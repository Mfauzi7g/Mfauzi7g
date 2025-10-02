import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Don't call API on init, just use stored user data to prevent logout
          const userData = JSON.parse(savedUser);
          console.log('Restoring user from localStorage:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (emailOrUser, passwordOrToken, type = 'email') => {
    try {
      let userData, accessToken;
      
      if (type === 'social' || type === 'existing_session') {
        // Social login or existing session - user data already provided
        userData = emailOrUser;
        accessToken = passwordOrToken;
        
        console.log('Social login - userData:', userData);
        console.log('Social login - accessToken present:', !!accessToken);
      } else {
        // Email/password login
        const loginData = { email: emailOrUser, password: passwordOrToken };
        console.log('Traditional login attempt:', loginData);
        
        const response = await authAPI.login(loginData);
        userData = response.user;
        accessToken = response.access_token;
      }
      
      // Ensure we have valid data before setting state
      if (!userData || !userData.email) {
        throw new Error('Invalid user data received');
      }
      
      if (accessToken) {
        localStorage.setItem('authToken', accessToken);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set state synchronously to prevent race conditions
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('Login successful, user authenticated:', userData.email);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', error.response?.data);
      
      // Clear any partial state on error
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Login failed'
      };
    }
  };

  const register = async (nameOrUserData, email = null, password = null) => {
    try {
      let response, userData, accessToken;
      
      if (typeof nameOrUserData === 'object') {
        // Traditional registration with user object
        response = await authAPI.register(nameOrUserData);
        userData = response.user;
        accessToken = response.access_token;
      } else {
        // Individual parameters
        response = await authAPI.register({
          name: nameOrUserData,
          email: email,
          password: password
        });
        userData = response.user;
        accessToken = response.access_token;
      }
      
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
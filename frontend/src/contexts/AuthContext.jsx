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
          const userData = await authAPI.getCurrentUser();
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
      let response, userData, accessToken;
      
      if (type === 'social' || type === 'existing_session') {
        // Social login or existing session - user data already provided
        userData = emailOrUser;
        accessToken = passwordOrToken;
      } else {
        // Email/password login
        response = await authAPI.login({ email: emailOrUser, password: passwordOrToken });
        userData = response.user;
        accessToken = response.access_token;
      }
      
      if (accessToken) {
        localStorage.setItem('authToken', accessToken);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed'
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
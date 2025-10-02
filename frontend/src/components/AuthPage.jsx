import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import LanguageSelector from './LanguageSelector';
import AppleSigninButton from 'react-apple-signin-auth';
import axios from 'axios';

const AuthPage = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, apple: false });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { login, register } = useAuth();

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
    
    // Check for session_id in URL fragment (from Emergent Auth)
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      setLoading(true);
      handleGoogleAuthCallback(sessionId);
      // Clean URL fragment
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/social-auth/session`, {
        withCredentials: true
      });
      
      if (response.data.authenticated) {
        // User is already authenticated, redirect to dashboard
        login(response.data.user, 'existing_session');
      }
    } catch (error) {
      // No existing session, continue with login page
      console.log('No existing session found');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (result.success) {
        toast.success(isLogin ? t('auth.welcome_success') : t('auth.account_created'));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(t('auth.something_wrong'));
    } finally {
      setLoading(false);
    }
  };

  // Google Auth Handlers
  const handleGoogleSignIn = () => {
    setSocialLoading({ ...socialLoading, google: true });
    const currentUrl = window.location.origin + window.location.pathname;
    const emergentAuthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = emergentAuthUrl;
  };

  const handleGoogleAuthCallback = async (sessionId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/social-auth/google`, {
        session_id: sessionId
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Successfully signed in with Google!');
        login(response.data.user, response.data.access_token);
      } else {
        toast.error('Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
      setSocialLoading({ ...socialLoading, google: false });
    }
  };

  // Apple Auth Handlers
  const handleAppleSuccess = async (response) => {
    setSocialLoading({ ...socialLoading, apple: true });
    
    try {
      const { authorization, user } = response;
      
      const authResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/social-auth/apple`, {
        code: authorization.code,
        id_token: authorization.id_token,
        state: authorization.state,
        user: user
      }, {
        withCredentials: true
      });

      if (authResponse.data.success) {
        toast.success('Successfully signed in with Apple!');
        login(authResponse.data.user, authResponse.data.access_token);
      } else {
        toast.error('Apple authentication failed');
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      toast.error('Apple authentication failed');
    } finally {
      setSocialLoading({ ...socialLoading, apple: false });
    }
  };

  const handleAppleError = (error) => {
    console.error('Apple Sign In error:', error);
    toast.error('Apple authentication failed');
    setSocialLoading({ ...socialLoading, apple: false });
  };

  // Apple Auth Configuration
  const appleAuthOptions = {
    clientId: process.env.REACT_APP_APPLE_CLIENT_ID || 'com.screentime.web',
    scope: 'email name',
    redirectURI: window.location.origin,
    state: 'signin-state-' + Math.random().toString(36).substring(2, 15),
    nonce: 'nonce-' + Math.random().toString(36).substring(2, 15),
    usePopup: true
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Language Selector - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">ST</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
          </div>
          <p className="text-gray-600">
            {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.full_name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder={t('auth.enter_full_name')}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder={t('auth.enter_email')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  placeholder={isLogin ? t('auth.enter_password') : t('auth.create_password')}
                  minLength={!isLogin ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? t('auth.signing_in') : t('auth.creating_account')}</span>
                </div>
              ) : (
                isLogin ? t('auth.sign_in') : t('auth.create_account_btn')
              )}
            </Button>

            {/* Social Login Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={socialLoading.google || loading}
                className="w-full flex items-center justify-center space-x-3 py-3 border-gray-300 hover:bg-gray-50"
              >
                {socialLoading.google ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </Button>

              {/* Apple Sign In */}
              <div className="w-full">
                {typeof window !== 'undefined' && (
                  <AppleSigninButton
                    authOptions={appleAuthOptions}
                    uiType="dark"
                    className="w-full"
                    onSuccess={handleAppleSuccess}
                    onError={handleAppleError}
                    render={(props) => (
                      <Button
                        {...props}
                        type="button"
                        variant="outline"
                        disabled={socialLoading.apple || loading}
                        className="w-full flex items-center justify-center space-x-3 py-3 bg-black text-white border-black hover:bg-gray-900"
                      >
                        {socialLoading.apple ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                        )}
                        <span>Continue with Apple</span>
                      </Button>
                    )}
                  />
                )}
              </div>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin 
                ? t('auth.no_account')
                : t('auth.have_account')
              }
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>{t('auth.demo_account')}</strong><br />
                {t('auth.demo_email')}<br />
                {t('auth.demo_password')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
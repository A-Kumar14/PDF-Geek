import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('filegeek-user');
    return stored ? JSON.parse(stored) : null;
  });

  // Check token expiry on mount
  useEffect(() => {
    const token = localStorage.getItem('filegeek-token');
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('filegeek-token');
      localStorage.removeItem('filegeek-user');
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('filegeek-token', token);
      localStorage.setItem('filegeek-user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      throw new Error(msg);
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      const res = await apiClient.post('/auth/signup', { name, email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('filegeek-token', token);
      localStorage.setItem('filegeek-user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Sign up failed';
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('filegeek-token');
    localStorage.removeItem('filegeek-user');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const oidcEnabled = !!process.env.REACT_APP_OIDC_PROVIDER;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated, oidcEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

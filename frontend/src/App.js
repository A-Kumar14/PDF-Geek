import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileProvider } from './contexts/FileContext';
import { ChatProvider } from './contexts/ChatContext';
import { PersonaProvider } from './contexts/PersonaContext';
import { AnnotationProvider } from './contexts/AnnotationContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SettingsPage from './pages/SettingsPage';
import MainLayout from './pages/MainLayout';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PersonaProvider>
        <FileProvider>
          <ChatProvider>
            <AnnotationProvider>
              <AppRoutes />
            </AnnotationProvider>
          </ChatProvider>
        </FileProvider>
      </PersonaProvider>
    </AuthProvider>
  );
}

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

function AppRouter() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ChatPage /> : <AuthPage />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

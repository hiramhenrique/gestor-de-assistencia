import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PublicOrderStatusPage from './pages/modules/PublicOrderStatusPage';

type View = 'login' | 'register';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<View>('login');
  const statusParams = new URLSearchParams(window.location.search);

  return (
    <Routes>
      <Route
        path="/status"
        element={<PublicOrderStatusPage statusId={statusParams.get('track') ?? statusParams.get('os') ?? ''} />}
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <DashboardPage />
          ) : view === 'register' ? (
            <RegisterPage onNavigateToLogin={() => setView('login')} />
          ) : (
            <LoginPage onNavigateToRegister={() => setView('register')} />
          )
        }
      />
    </Routes>
  );
}

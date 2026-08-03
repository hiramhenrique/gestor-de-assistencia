import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

type View = 'login' | 'register';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<View>('login');

  if (isAuthenticated) {
    return <DashboardPage />;
  }

  if (view === 'register') {
    return <RegisterPage onNavigateToLogin={() => setView('login')} />;
  }

  return <LoginPage onNavigateToRegister={() => setView('register')} />;
}

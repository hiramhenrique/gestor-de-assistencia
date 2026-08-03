import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { LoginFormData } from '../types/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import AbstractBackground from '../components/AbstractBackground';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setLoading(true);
    try {
      await login(data.email, data.password, data.rememberMe);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setServerError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao entrar com o Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-violet-200 via-slate-100 to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors overflow-hidden">
      <AbstractBackground />
      <ThemeToggle />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo em destaque */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gray-700 rounded-2xl shadow-lg shadow-gray-900 px-8 py-5">
            <Logo className="w-44 h-auto" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-violet-100 dark:border-violet-900 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bem-vindo</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Entre na sua conta para continuar</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <span className="text-base">✕</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              required
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'E-mail é obrigatório.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'E-mail inválido.',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Senha é obrigatória.',
                  minLength: { value: 6, message: 'Mínimo de 6 caracteres.' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                Esqueci a senha
              </button>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Entrar
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              ou
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          <Button type="button" variant="secondary" fullWidth loading={googleLoading} onClick={onGoogleLogin}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.23c0-.79-.07-1.54-.2-2.27H12v4.3h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.99-4.33 2.99-7.55Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.59 0-4.79-1.75-5.58-4.11H3.07v2.57A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.42 13.92A6.01 6.01 0 0 1 6.42 10.08V7.51H3.07a10 10 0 0 0 0 12.82l3.35-2.41Z" />
              <path fill="#EA4335" d="M12 6.08c1.46 0 2.78.5 3.82 1.49l2.87-2.87A9.95 9.95 0 0 0 12 2a10 10 0 0 0-8.93 5.51l3.35 2.57C7.21 7.83 9.41 6.08 12 6.08Z" />
            </svg>
            Entrar com Google
          </Button>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
              >
                Cadastre-se grátis
              </button>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}

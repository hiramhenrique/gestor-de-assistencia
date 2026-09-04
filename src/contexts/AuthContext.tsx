import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, RegisterFormData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredUser extends User {
  password: string;
}

const USERS_KEY = 'at_users';
const SESSION_KEY = 'at_session';

function getAuthErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    return code || '';
  }
  return '';
}

function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message;
    return message || '';
  }
  return '';
}

function readStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as StoredUser[] : [];
  } catch {
    return [];
  }
}

function writeStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSessionUserId(): string | null {
  const localSession = localStorage.getItem(SESSION_KEY);
  if (localSession) return localSession;
  return sessionStorage.getItem(SESSION_KEY);
}

function writeSessionUserId(userId: string, remember: boolean) {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  if (remember) {
    localStorage.setItem(SESSION_KEY, userId);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, userId);
}

function clearSessionUserId() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUserId = readSessionUserId();
    if (!sessionUserId) {
      setUser(null);
      return;
    }

    const users = readStoredUsers();
    const currentUser = users.find((item) => item.id === sessionUserId);
    if (!currentUser) {
      clearSessionUserId();
      setUser(null);
      return;
    }

    const { password: _password, ...safeUser } = currentUser;
    void _password;
    setUser(safeUser);
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    try {
      const users = readStoredUsers();
      const normalizedEmail = email.trim().toLowerCase();
      const found = users.find((item) => item.email.trim().toLowerCase() === normalizedEmail && item.password === password);

      if (!found) {
        throw new Error('E-mail ou senha inválidos.');
      }

      writeSessionUserId(found.id, remember);
      const { password: _password, ...safeUser } = found;
      void _password;
      setUser(safeUser);
      return;
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      const rawMessage = getAuthErrorMessage(error);

      if (error instanceof Error && error.message) {
        throw error;
      }

      console.error('Erro de login local:', { code, rawMessage, error });
      throw new Error(code ? `Não foi possível entrar (${code}).` : 'Não foi possível entrar. Tente novamente.');
    }
  };

  const register = async (data: RegisterFormData) => {
    try {
      const users = readStoredUsers();
      const sanitizedCpf = data.cpf.replace(/\D/g, '');
      const normalizedEmail = data.email.trim().toLowerCase();

      if (users.some((item) => item.email.trim().toLowerCase() === normalizedEmail)) {
        throw new Error('Este e-mail já está cadastrado.');
      }

      if (users.some((item) => item.cpf === sanitizedCpf)) {
        throw new Error('Este CPF já está cadastrado.');
      }

      const profile: StoredUser = {
        id: crypto.randomUUID(),
        fullName: data.fullName,
        email: normalizedEmail,
        cpf: sanitizedCpf,
        phone: data.phone,
        createdAt: new Date().toISOString(),
        password: data.password,
      };

      writeStoredUsers([profile, ...users]);
      writeSessionUserId(profile.id, true);

      const { password: _password, ...safeUser } = profile;
      void _password;
      setUser(safeUser);
      return;
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (error instanceof Error && error.message) {
        throw error;
      }

      const rawMessage = getAuthErrorMessage(error);
      console.error('Erro de cadastro local:', { code, rawMessage, error });
      throw new Error(code ? `Não foi possível cadastrar (${code}).` : 'Não foi possível cadastrar. Tente novamente.');
    }
  };

  const logout = async () => {
    clearSessionUserId();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

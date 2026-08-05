import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  inMemoryPersistence,
  setPersistence,
  type User as FirebaseUser,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User, RegisterFormData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

async function syncUserProfile(firebaseUser: FirebaseUser, fallback?: Partial<User>): Promise<User> {
  const docRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(docRef);
  const existing = snap.exists() ? (snap.data() as Partial<User>) : undefined;

  const profile: User = {
    id: firebaseUser.uid,
    fullName: fallback?.fullName || existing?.fullName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
    email: firebaseUser.email || existing?.email || '',
    cpf: fallback?.cpf || existing?.cpf || '',
    phone: fallback?.phone || existing?.phone || '',
    createdAt: fallback?.createdAt || existing?.createdAt || new Date().toISOString(),
  };

  if (!snap.exists()) {
    await setDoc(docRef, profile);
  }

  return profile;
}

async function hasCpfRegistered(cpf: string): Promise<boolean> {
  if (!cpf) return false;
  const usersRef = collection(db, 'users');
  const cpfQuery = query(usersRef, where('cpf', '==', cpf), limit(1));
  const snapshot = await getDocs(cpfQuery);
  return !snapshot.empty;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void setPersistence(auth, inMemoryPersistence);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const mappedUser = await syncUserProfile(firebaseUser);
      setUser(mappedUser);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    void remember;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const safeUser = await syncUserProfile(cred.user);
      setUser(safeUser);
      return;
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      const rawMessage = getAuthErrorMessage(error);

      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        throw new Error('E-mail ou senha inválidos.');
      }
      if (code === 'auth/operation-not-allowed') {
        throw new Error('Login com e-mail/senha está desativado no Firebase. Ative em Authentication > Sign-in method.');
      }
      if (code === 'auth/invalid-api-key') {
        throw new Error('Configuração Firebase inválida no ambiente. Verifique as variáveis VITE_FIREBASE_* no Vercel.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
      }

      console.error('Erro de login Firebase:', { code, rawMessage, error });
      throw new Error(code ? `Não foi possível entrar (${code}).` : 'Não foi possível entrar. Tente novamente.');
    }
  };

  const register = async (data: RegisterFormData) => {
    const sanitizedCpf = data.cpf.replace(/\D/g, '');
    const cpfExists = await hasCpfRegistered(sanitizedCpf);
    if (cpfExists) {
      throw new Error('Este CPF já está cadastrado.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const profile: User = {
        id: cred.user.uid,
        fullName: data.fullName,
        email: data.email,
        cpf: sanitizedCpf,
        phone: data.phone,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUser(profile);
      return;
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (code === 'auth/email-already-in-use') {
        throw new Error('Este e-mail já está cadastrado.');
      }
      if (code === 'auth/operation-not-allowed') {
        throw new Error('Cadastro por e-mail/senha está desativado no Firebase. Ative em Authentication > Sign-in method.');
      }
      if (code === 'auth/invalid-api-key') {
        throw new Error('Configuração Firebase inválida no ambiente. Verifique as variáveis VITE_FIREBASE_* no Vercel.');
      }
      if (code === 'auth/weak-password') {
        throw new Error('A senha é muito fraca. Use pelo menos 6 caracteres.');
      }

      const rawMessage = getAuthErrorMessage(error);
      console.error('Erro de cadastro Firebase:', { code, rawMessage, error });
      throw new Error(code ? `Não foi possível cadastrar (${code}).` : 'Não foi possível cadastrar. Tente novamente.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
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

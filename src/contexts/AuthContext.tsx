import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
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
  loginWithGoogle: (remember?: boolean) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function getAuthErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    return code || '';
  }
  return '';
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message;
    return message || '';
  }
  return '';
}

function getGoogleLoginErrorMessage(code: string): string {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado no Firebase Auth. Adicione o domínio em Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Login com Google desativado no Firebase. Ative o provedor Google em Authentication > Sign-in method.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.';
    case 'auth/network-request-failed':
      return 'Falha de rede ao autenticar com Google. Verifique sua conexão e tente novamente.';
    case 'auth/invalid-api-key':
      return 'A chave da API do Firebase está inválida. Verifique o arquivo .env.local.';
    default:
      return code
        ? `Não foi possível entrar com o Google (${code}).`
        : 'Não foi possível entrar com o Google. Tente novamente.';
  }
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
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        throw new Error('E-mail ou senha inválidos.');
      }
      throw new Error('Não foi possível entrar. Tente novamente.');
    }
  };

  const loginWithGoogle = async (remember = true) => {
    void remember;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const safeUser = await syncUserProfile(cred.user);
      setUser(safeUser);
    } catch (error) {
      const code = getAuthErrorCode(error);
      const rawMessage = getErrorMessage(error);

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }

      if (code === 'auth/popup-blocked' || (!code && import.meta.env.PROD)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          throw new Error(getGoogleLoginErrorMessage(code));
        }
      }

      if (!code && rawMessage) {
        console.error('Google login failed without Firebase Auth code:', error);
        throw new Error(`Não foi possível entrar com o Google. Detalhe: ${rawMessage}`);
      }

      throw new Error(getGoogleLoginErrorMessage(code));
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
      throw new Error('Não foi possível cadastrar. Tente novamente.');
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

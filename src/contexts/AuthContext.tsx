import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

const STORAGE_KEY = 'at_users';
const SESSION_KEY = 'at_session';

function normalizeUser(user: FirebaseUser | null, fallback?: Partial<User>): User | null {
  if (!user) return null;
  const base: User = {
    id: user.uid,
    fullName: fallback?.fullName || user.displayName || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    cpf: fallback?.cpf || '',
    phone: fallback?.phone || '',
    createdAt: fallback?.createdAt || new Date().toISOString(),
  };
  return base;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const docRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(docRef);
      const profile = snap.exists() ? (snap.data() as Partial<User>) : undefined;
      const mappedUser = normalizeUser(firebaseUser, profile);
      setUser(mappedUser);

      const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(mappedUser));
    });

    return () => unsubscribe();
  }, []);

  const getUsers = (): Array<User & { password: string }> => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  };

  const saveUsers = (users: Array<User & { password: string }>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string, remember: boolean) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const docRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(docRef);
      const profile = snap.exists() ? (snap.data() as Partial<User>) : undefined;
      const safeUser = normalizeUser(cred.user, profile);
      setUser(safeUser);
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return;
    } catch (error) {
      const fallbackUsers = getUsers();
      const found = fallbackUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) {
        throw new Error('E-mail ou senha inválidos.');
      }
      const { password: _pw, ...safeUser } = found;
      setUser(safeUser);
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    }
  };

  const register = async (data: RegisterFormData) => {
    const users = getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const cpfExists = users.find((u) => u.cpf === data.cpf.replace(/\D/g, ''));
    if (cpfExists) {
      throw new Error('Este CPF já está cadastrado.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const profile: User = {
        id: cred.user.uid,
        fullName: data.fullName,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUser(profile);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      return;
    } catch (error) {
      const newUser: User & { password: string } = {
        id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fullName: data.fullName,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone,
        createdAt: new Date().toISOString(),
        password: data.password,
      };
      saveUsers([...users, newUser]);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
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

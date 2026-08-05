import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyB61svIQEdiYjk8KaQu04BGCWXg6hKxZB0',
  authDomain: 'gestor-de-assistencia.firebaseapp.com',
  projectId: 'gestor-de-assistencia',
  storageBucket: 'gestor-de-assistencia.firebasestorage.app',
  messagingSenderId: '72276776870',
  appId: '1:72276776870:web:91afa516741aae76932167',
};

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId;
const resolvedAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: resolvedAuthDomain,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export { app, auth, db };

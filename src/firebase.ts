import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseConfigError: string | null = null;

// A missing/invalid config makes getAuth() throw synchronously here. Without
// this guard the throw propagates through main.tsx before React mounts and the
// whole app renders blank. Degrade to a visible error instead.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseConfigError =
    'Configuração do Firebase ausente. Crie um arquivo .env com as variáveis VITE_FIREBASE_* (veja .env.example).';
} else {
  try {
    const app: FirebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    firebaseConfigError =
      err instanceof Error ? err.message : 'Falha ao inicializar o Firebase.';
  }
}

export { auth, db, googleProvider, firebaseConfigError };

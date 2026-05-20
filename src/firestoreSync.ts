import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useStore } from './store';
import type { Quest, Hero } from './types';

interface UserData {
  userName?: string;
  email?: string;
  taskCount?: number;
  hero: Hero;
  quests: Quest[];
}

/**
 * Recursively remove all `undefined` values from an object/array.
 * Firestore does not accept `undefined` — this converts the data to a
 * clean, JSON-safe structure before saving.
 */
function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (typeof value === 'object' && value !== null) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean as T;
  }
  return value;
}

/** Load user data from Firestore into the local Zustand store */
export async function loadUserData(uid: string, email?: string | null): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserData;
      const store = useStore.getState();
      // Replace local state with cloud data
      useStore.setState({
        hero: data.hero ?? store.hero,
        quests: data.quests ?? store.quests,
      });
    } else {
      // First login: migrate current localStorage data to Firestore
      await saveUserData(uid, email);
    }
  } catch (error) {
    console.error('Erro ao carregar dados do Firestore:', error);
  }
}

/** Save current Zustand store data to Firestore */
export async function saveUserData(uid: string, email?: string | null): Promise<void> {
  if (!db) return;
  try {
    const { hero, quests } = useStore.getState();
    const docRef = doc(db, 'users', uid);
    const dataToSave: Record<string, unknown> = { 
      userName: hero.name,
      taskCount: quests.length,
      hero, 
      quests 
    };
    
    if (email) {
      dataToSave.email = email;
    }

    await setDoc(docRef, stripUndefined(dataToSave), { merge: true });
  } catch (error) {
    console.error('Erro ao salvar dados no Firestore:', error);
  }
}

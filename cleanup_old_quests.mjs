/**
 * One-time script to clean old quests from Firestore.
 * Removes all quests with scheduledDate before 2026-04-24.
 * Run with: node cleanup_old_quests.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Load env vars
import { config } from 'dotenv';
config({ path: '.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CUTOFF = new Date('2026-04-24T00:00:00').getTime();

async function cleanup() {
  const usersCol = collection(db, 'users');
  const snapshot = await getDocs(usersCol);

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const quests = data.quests || [];
    const cleaned = quests.filter(q => q.scheduledDate >= CUTOFF);
    const removed = quests.length - cleaned.length;

    if (removed > 0) {
      console.log(`User ${userDoc.id}: removing ${removed} old quests (keeping ${cleaned.length})`);
      await updateDoc(doc(db, 'users', userDoc.id), { quests: cleaned });
      console.log(`  ✅ Done`);
    } else {
      console.log(`User ${userDoc.id}: no old quests to remove (${quests.length} total)`);
    }
  }

  console.log('\n🏁 Cleanup complete!');
  process.exit(0);
}

cleanup().catch(err => { console.error('Error:', err); process.exit(1); });

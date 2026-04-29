/**
 * Script to send WhatsApp notifications for incomplete quests.
 * Uses firebase-admin to bypass client-side rules and CallMeBot API.
 */
import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', error.message);
    process.exit(1);
  }
} else {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  console.log('Please provide the Service Account JSON string in the FIREBASE_SERVICE_ACCOUNT environment variable.');
  process.exit(1);
}

const db = admin.firestore();

const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
const PHONE_NUMBER = process.env.RECIPIENT_PHONE_NUMBER;

async function sendWhatsApp(text) {
  if (!CALLMEBOT_API_KEY || !PHONE_NUMBER) {
    console.error('❌ CallMeBot API Key or Phone Number missing');
    return;
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE_NUMBER}&text=${encodeURIComponent(text)}&apikey=${CALLMEBOT_API_KEY}&source=php`;
  
  try {
    const response = await fetch(url);
    const data = await response.text();
    if (data.includes('APIKey is invalid') || data.includes('error')) {
      console.error(`❌ CallMeBot Error: ${data}`);
    } else {
      console.log('✅ WhatsApp message sent successfully');
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
  }
}

async function notifyIncompleteQuests() {
  console.log('--- Starting Notification Script ---');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  const end = start + 86400000;
  
  console.log(`Checking quests for date: ${today.toLocaleDateString('pt-BR')}`);

  try {
    const usersCol = db.collection('users');
    const snapshot = await usersCol.get();

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      const heroName = data.hero?.name || 'Heroi';
      const quests = data.quests || [];
      
      const incompleteToday = quests.filter(q => 
        !q.completed && 
        q.scheduledDate >= start && 
        q.scheduledDate < end
      );

      if (incompleteToday.length > 0) {
        console.log(`User ${userDoc.id} (${heroName}): ${incompleteToday.length} incomplete quests found.`);
        
        let message = `⚔️ *MissionLog: Pendências de Hoje* (${today.toLocaleDateString('pt-BR')})\n\n`;
        message += `Olá, ${heroName}! Você ainda tem as seguintes missões pendentes:\n\n`;
        
        incompleteToday.forEach((q, index) => {
          const difficultyEmoji = q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢';
          message += `${index + 1}. ${difficultyEmoji} *${q.title}*\n`;
        });
        
        message += `\n👉 Acesse para completar: https://questlog-app-a5e29.web.app/`;
        
        await sendWhatsApp(message);
      } else {
        console.log(`User ${userDoc.id} (${heroName}): No incomplete quests for today.`);
      }
    }
  } catch (error) {
    console.error('❌ Error fetching data from Firestore:', error.message);
  }

  console.log('--- Notification Script Finished ---');
  process.exit(0);
}

notifyIncompleteQuests().catch(err => {
  console.error('❌ Critical Error:', err);
  process.exit(1);
});

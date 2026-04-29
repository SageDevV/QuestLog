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

// Parse command line arguments
const args = process.argv.slice(2);
const isMorning = args.includes('--morning');
const isEvening = args.includes('--evening') || (!isMorning); // Default to evening if none specified

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

async function notifyQuests() {
  const mode = isMorning ? 'MANHÃ' : 'NOITE';
  console.log(`--- Starting Notification Script [Mode: ${mode}] ---`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  const end = start + 86400000;
  
  const dateStr = today.toLocaleDateString('pt-BR');
  console.log(`Checking quests for date: ${dateStr}`);

  try {
    const snapshot = await db.collection('users').get();

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      const heroName = data.hero?.name || 'Heroi';
      const quests = data.quests || [];
      
      const questsToday = quests.filter(q => 
        q.scheduledDate >= start && 
        q.scheduledDate < end
      );

      if (isMorning) {
        if (questsToday.length > 0) {
          console.log(`User ${userDoc.id} (${heroName}): Sending morning list with ${questsToday.length} quests.`);
          
          let message = `☀️ *MissionLog: Missões de Hoje* (${dateStr})\n\n`;
          message += `Olá, ${heroName}! Aqui estão suas missões para hoje:\n\n`;
          
          questsToday.forEach((q, index) => {
            const status = q.completed ? '✅' : (q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢');
            message += `${index + 1}. ${status} *${q.title}*\n`;
          });
          
          message += `\n👉 Boa sorte! https://questlog-app-a5e29.web.app/`;
          await sendWhatsApp(message);
        } else {
          console.log(`User ${userDoc.id} (${heroName}): No quests scheduled for today.`);
        }
      } else {
        const incompleteToday = questsToday.filter(q => !q.completed);
        
        if (incompleteToday.length > 0) {
          console.log(`User ${userDoc.id} (${heroName}): ${incompleteToday.length} incomplete quests found.`);
          
          let message = `⚠️ *MissionLog: Pendências de Hoje* (${dateStr})\n\n`;
          message += `Olá, ${heroName}! Você ainda tem as seguintes missões pendentes:\n\n`;
          
          incompleteToday.forEach((q, index) => {
            const difficultyEmoji = q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢';
            message += `${index + 1}. ${difficultyEmoji} *${q.title}*\n`;
          });
          
          message += `\n👉 Acesse para completar: https://questlog-app-a5e29.web.app/`;
          await sendWhatsApp(message);
        } else {
          console.log(`User ${userDoc.id} (${heroName}): All quests completed! No notification needed.`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching data from Firestore:', error.message);
  }

  console.log('--- Notification Script Finished ---');
  process.exit(0);
}

notifyQuests().catch(err => {
  console.error('❌ Critical Error:', err);
  process.exit(1);
});

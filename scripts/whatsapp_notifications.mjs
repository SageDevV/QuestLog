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

// Configuration
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
const PHONE_NUMBER = process.env.RECIPIENT_PHONE_NUMBER;

// Get current time in Sao Paulo components
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
  hour12: false
});

const parts = formatter.formatToParts(now).reduce((acc, part) => {
  acc[part.type] = part.value;
  return acc;
}, {});

// Create a date string in ISO format with BRT offset (-03:00)
// Format: YYYY-MM-DDTHH:MM:SS-03:00
const pad = (n) => String(n).padStart(2, '0');
const brtIsoStr = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}-03:00`;
const brtNow = new Date(brtIsoStr);
const brtHour = brtNow.getHours(); // This might be local hour, but we want the BRT hour we just parsed
const brtHourNum = parseInt(parts.hour);

// Parse command line arguments or auto-detect
const args = process.argv.slice(2);
let isMorning = args.includes('--morning');
let isEvening = args.includes('--evening');
let isTest = args.includes('--test');

if (!isMorning && !isEvening && !isTest) {
  // Auto-detect based on hour (BRT)
  // Morning: 5:00 to 12:00
  // Evening: 17:00 to 23:00
  isMorning = brtHourNum >= 5 && brtHourNum < 12;
  isEvening = !isMorning; 
  console.log(`ℹ️ Auto-detected mode: ${isMorning ? 'MORNING' : 'EVENING'} based on BRT hour ${brtHourNum}`);
}

async function sendWhatsApp(text) {
  if (!CALLMEBOT_API_KEY || !PHONE_NUMBER) {
    console.error('❌ CallMeBot API Key or Phone Number missing');
    return;
  }

  const maskedKey = CALLMEBOT_API_KEY.substring(0, 4) + '****';
  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE_NUMBER}&text=${encodeURIComponent(text)}&apikey=${CALLMEBOT_API_KEY}&source=php`;
  
  console.log(`📤 Sending to ${PHONE_NUMBER} via CallMeBot (API Key: ${maskedKey})...`);

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
  if (isTest) {
    console.log('🧪 Running TEST notification...');
    await sendWhatsApp(`🚀 *MissionLog: Teste de Notificação*\n\nSe você recebeu isso, a integração com o GitHub Actions está funcionando!\n\nHora atual: ${brtNow.toLocaleString('pt-BR')}`);
    return;
  }

  const mode = isMorning ? 'MANHÃ' : 'NOITE';
  console.log(`--- Starting Notification Script [Mode: ${mode}] [BRT: ${brtNow.toLocaleString('pt-BR')}] ---`);
  
  // Calculate range for "Today" in BRT (Midnight to Midnight BRT)
  const midnightIsoStr = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T00:00:00-03:00`;
  const startTs = new Date(midnightIsoStr).getTime();
  const endTs = startTs + 86400000;
  
  const dateStr = `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`;
  console.log(`🔍 Checking quests for date range: ${new Date(startTs).toISOString()} to ${new Date(endTs).toISOString()}`);

  try {
    const snapshot = await db.collection('users').get();
    console.log(`👥 Found ${snapshot.size} users in Firestore.`);

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      const heroName = data.hero?.name || 'Heroi';
      const quests = data.quests || [];
      
      console.log(`👤 User: ${userDoc.id} (${heroName}) | Total Quests: ${quests.length}`);

      const questsToday = quests.filter(q => 
        q.scheduledDate >= startTs && 
        q.scheduledDate < endTs
      );

      console.log(`   └─ Quests today: ${questsToday.length}`);

      if (isMorning) {
        if (questsToday.length > 0) {
          console.log(`   └─ Sending morning list.`);
          
          let message = `☀️ *MissionLog: Missões de Hoje* (${dateStr})\n\n`;
          message += `Olá, ${heroName}! Aqui estão suas missões para hoje:\n\n`;
          
          questsToday.forEach((q, index) => {
            const status = q.completed ? '✅' : (q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢');
            message += `${index + 1}. ${status} *${q.title}*\n`;
          });
          
          message += `\n👉 Boa sorte! https://questlog-app-a5e29.web.app/`;
          await sendWhatsApp(message);
        } else {
          console.log(`   └─ No quests for today. Skipping.`);
        }
      } else {
        const incompleteToday = questsToday.filter(q => !q.completed);
        console.log(`   └─ Incomplete quests today: ${incompleteToday.length}`);
        
        if (incompleteToday.length > 0) {
          console.log(`   └─ Sending evening list.`);
          
          let message = `⚠️ *MissionLog: Pendências de Hoje* (${dateStr})\n\n`;
          message += `Olá, ${heroName}! Você ainda tem as seguintes missões pendentes:\n\n`;
          
          incompleteToday.forEach((q, index) => {
            const difficultyEmoji = q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢';
            message += `${index + 1}. ${difficultyEmoji} *${q.title}*\n`;
          });
          
          message += `\n👉 Acesse para completar: https://questlog-app-a5e29.web.app/`;
          await sendWhatsApp(message);
        } else {
          console.log(`   └─ All completed! Skipping.`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching data from Firestore:', error.message);
  }

  console.log('--- Notification Script Finished ---');
}

notifyQuests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Critical Error:', err);
  process.exit(1);
});


/**
 * Script to send Telegram notifications for incomplete quests.
 * Uses firebase-admin to bypass client-side rules and Telegram Bot API.
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
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Get current time in Sao Paulo components
const now = new Date();
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
const pad = (n) => String(n).padStart(2, '0');
const brtIsoStr = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}-03:00`;
const brtNow = new Date(brtIsoStr);
const brtHourNum = parseInt(parts.hour);

// Parse command line arguments or auto-detect
const args = process.argv.slice(2);
let isMorning = args.includes('--morning');
let isEvening = args.includes('--evening');
let isTest = args.includes('--test');

if (!isMorning && !isEvening && !isTest) {
  // Auto-detect based on hour (BRT)
  // Morning: 5:00 to 12:00
  isMorning = brtHourNum >= 5 && brtHourNum < 12;
  isEvening = !isMorning; 
  console.log(`ℹ️ Auto-detected mode: ${isMorning ? 'MORNING' : 'EVENING'} based on BRT hour ${brtHourNum}`);
}

async function sendTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Telegram Bot Token or Chat ID missing');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  console.log(`📤 Sending to Telegram Chat ${CHAT_ID}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const data = await response.json();

    if (data && data.ok) {
      console.log('✅ Telegram message sent successfully');
    } else {
      console.error(`❌ Telegram API returned error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.message);
  }
}

async function notifyQuests() {
  if (isTest) {
    console.log('🧪 Running TEST notification...');
    await sendTelegram(`🚀 <b>MissionLog: Teste de Notificação</b>\n\nSe você recebeu isso, a integração com o GitHub Actions via Telegram está funcionando!\n\nHora atual: ${brtNow.toLocaleString('pt-BR')}`);
    return;
  }

  const mode = isMorning ? 'MANHÃ' : 'NOITE';
  console.log(`--- Starting Notification Script [Mode: ${mode}] [BRT: ${brtNow.toLocaleString('pt-BR')}] ---`);
  
  // Calculate range for "Today" in BRT (Midnight to Midnight BRT)
  const midnightIsoStr = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T00:00:00-03:00`;
  const startTs = new Date(midnightIsoStr).getTime();
  const endTs = startTs + 86400000;
  
  const dateStr = `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`;

  try {
    const snapshot = await db.collection('users').get();
    console.log(`👥 Found ${snapshot.size} users in Firestore.`);

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      const userEmail = data.email || '';
      
      // RESTRICTION: Only send to pandredbz@gmail.com
      if (userEmail !== 'pandredbz@gmail.com') {
        continue;
      }

      const heroName = data.hero?.name || 'Heroi';
      const quests = data.quests || [];
      
      const questsToday = quests.filter(q => 
        q.scheduledDate >= startTs && 
        q.scheduledDate < endTs
      );

      if (isMorning) {
        if (questsToday.length > 0) {
          let message = `☀️ <b>MissionLog: Missões de Hoje</b> (${dateStr})\n\n`;
          message += `Olá, ${heroName}! Aqui estão suas missões para hoje:\n\n`;
          
          questsToday.forEach((q, index) => {
            const status = q.completed ? '✅' : (q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢');
            message += `${index + 1}. ${status} <b>${q.title}</b>\n`;
          });
          
          message += `\n👉 <a href="https://questlog-app-a5e29.web.app/">Boa sorte!</a>`;
          await sendTelegram(message);
        }
      } else {
        const incompleteToday = questsToday.filter(q => !q.completed);
        
        if (incompleteToday.length > 0) {
          let message = `⚠️ <b>MissionLog: Pendências de Hoje</b> (${dateStr})\n\n`;
          message += `Olá, ${heroName}! Você ainda tem as seguintes missões pendentes:\n\n`;
          
          incompleteToday.forEach((q, index) => {
            const difficultyEmoji = q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢';
            message += `${index + 1}. ${difficultyEmoji} <b>${q.title}</b>\n`;
          });
          
          message += `\n👉 <a href="https://questlog-app-a5e29.web.app/">Acesse para completar</a>`;
          await sendTelegram(message);
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

/**
 * One-time migration: add agentLabel = 'Manual' to all existing quests.
 * Uses firebase-admin to bypass Firestore security rules.
 * 
 * Run with: node migrate_agent_labels.mjs
 * 
 * Requires FIREBASE_SERVICE_ACCOUNT environment variable (JSON string).
 * You can set it by running:
 *   $env:FIREBASE_SERVICE_ACCOUNT = Get-Content path\to\serviceAccountKey.json -Raw
 *   node migrate_agent_labels.mjs
 */
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('❌ Erro ao parsear FIREBASE_SERVICE_ACCOUNT:', error.message);
    process.exit(1);
  }
} else {
  console.error('❌ Variável FIREBASE_SERVICE_ACCOUNT não encontrada.');
  console.log('Defina a variável de ambiente com o JSON da Service Account:');
  console.log('  $env:FIREBASE_SERVICE_ACCOUNT = Get-Content caminho\\para\\serviceAccountKey.json -Raw');
  process.exit(1);
}

const db = admin.firestore();

async function migrate() {
  console.log('🔄 Iniciando migração: agentLabel = "Manual" para quests CONCLUÍDAS...\n');
  
  const snapshot = await db.collection('users').get();
  console.log(`👥 Encontrados ${snapshot.size} usuários no Firestore.\n`);

  let totalUpdated = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const quests = data.quests || [];
    
    let updated = 0;
    const migratedQuests = quests.map(q => {
      if (q.completed) {
        if (q.agentLabel !== 'Manual') {
            updated++;
            return { ...q, agentLabel: 'Manual' };
        }
      }
      return q;
    });

    if (updated > 0) {
      console.log(`👤 User ${userDoc.id}: ${updated} quests concluídas atualizadas com agentLabel = "Manual"`);
      await userDoc.ref.update({ quests: migratedQuests });
      console.log(`  ✅ Salvo no Firestore`);
      totalUpdated += updated;
    } else {
      console.log(`👤 User ${userDoc.id}: nenhuma quest concluída para atualizar.`);
    }
  }

  console.log(`\n🏁 Migração concluída! ${totalUpdated} quests atualizadas no total.`);
  process.exit(0);
}

migrate().catch(err => { console.error('❌ Erro:', err); process.exit(1); });

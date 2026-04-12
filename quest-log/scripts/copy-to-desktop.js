/**
 * Copies the generated QuestLog.exe to the user's Windows desktop.
 * Uses USERPROFILE environment variable to determine the desktop path.
 * If the desktop path cannot be determined, logs the path where the exe was generated.
 * Overwrites any existing QuestLog.exe on the desktop.
 */

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const exePath = join(projectRoot, 'dist', 'QuestLog.exe');

if (!existsSync(exePath)) {
  console.error(`Erro: QuestLog.exe não encontrado em ${exePath}`);
  process.exit(1);
}

const userProfile = process.env.USERPROFILE;

if (!userProfile) {
  console.log(`Não foi possível determinar a área de trabalho do usuário.`);
  console.log(`O executável foi gerado em: ${exePath}`);
  process.exit(0);
}

const desktopPath = join(userProfile, 'Desktop');
const destPath = join(desktopPath, 'QuestLog.exe');

try {
  copyFileSync(exePath, destPath);
  console.log(`QuestLog.exe copiado com sucesso para: ${destPath}`);
} catch (err) {
  console.error(`Erro ao copiar QuestLog.exe para a área de trabalho: ${err.message}`);
  console.log(`O executável foi gerado em: ${exePath}`);
  process.exit(1);
}

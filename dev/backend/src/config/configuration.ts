import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as os from 'os';

function getUserDataPath(appName: string): string {
  switch (process.platform) {
    case 'win32':
      return join(process.env.APPDATA || '', appName);
    case 'darwin':
      return join(os.homedir(), 'Library', 'Application Support', appName);
    case 'linux':
      return join(os.homedir(), '.config', appName);
    default:
      return join(os.homedir(), appName);
  }
}

const appName = 'eaata-helpdesk';
const userDataPath = getUserDataPath(appName);
const configPath = join(userDataPath, 'config.json');


function readConfig(): Record<string, any> {
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch (err: any) {
      console.warn('[CONFIG] Falha ao ler config.json:', err.message);
    }
  }
  return {};
}


export function updateConfig(newValues: Record<string, any>): void {
  try {
    // garante que a pasta existe
    mkdirSync(userDataPath, { recursive: true });

    const current = readConfig();
    const updated = { ...current, ...newValues };

    writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[CONFIG] Configuração atualizada em', configPath);
  } catch (err: any) {
    console.error('[CONFIG] Erro ao atualizar config.json:', err.message);
  }
}

export default () => {
  let backendUrl: string | undefined;

  const config = readConfig();
  backendUrl = config.backendUrl;

  return {
    BASE_URL: backendUrl || process.env.BASE_URL || null,
    UPLOAD_DIR: process.env.UPLOAD_DIR || null,
  };
};

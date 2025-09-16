import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
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

export default () => {
  const appName = 'eaata-helpdesk';
  const userDataPath = getUserDataPath(appName);
  const configPath = join(userDataPath, 'config.json');

  let backendUrl: string | undefined;

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      backendUrl = config.backendUrl;
    } catch (err) {
      console.warn('[CONFIG] Falha ao ler config.json:', err.message);
    }
  }

  return {
    BASE_URL: backendUrl || process.env.BASE_URL || null,
    UPLOAD_DIR: process.env.UPLOAD_DIR || null,
  };
};

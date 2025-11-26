import * as path from 'path';

function getWritableBasePath(): string {
  // When packaged with pkg, __dirname points to the snapshot. Use the executable
  // directory (process.execPath) instead so we write to a real, writable path.
  if ((process as any).pkg) {
    return path.dirname(process.execPath);
  }

  // In development, keep files alongside the project root (two levels up from
  // the compiled dist folder).
  return path.join(__dirname, '..', '..');
}

export function getConfigPath(): string {
  return path.join(getWritableBasePath(), 'config.json');
}

export function getEnvPath(): string {
  return path.join(getWritableBasePath(), '.env');
}

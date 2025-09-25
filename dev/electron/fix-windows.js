#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

const ELECTRON_VERSION = '28.3.3'; // ajuste se mudar
const MODULES = ['sqlite3', 'pg', 'mysql2']; // módulos que precisam rebuild

console.log('🔧 [EAATA FIX] Preparando ambiente para Windows...');

try {
  // 1️⃣ Verifica se está no Windows
  if (process.platform !== 'win32') {
    console.log('✅ Não está no Windows, não precisa rodar este fix.');
    process.exit(0);
  }

  // 2️⃣ Verifica se Visual Studio Build Tools estão instaladas
  console.log('🛠️  Verificando Visual Studio Build Tools...');
  const vswhere = `"C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe"`;
  if (!fs.existsSync(vswhere.replace(/"/g, ''))) {
    console.log('⚠️  Visual Studio Build Tools não encontradas. Instalando...');
    execSync('npm install --global --production windows-build-tools', { stdio: 'inherit' });
  } else {
    console.log('✅ Visual Studio Build Tools detectadas.');
  }

  // 3️⃣ Executa electron-rebuild com lista de módulos separada por vírgula
  console.log(`📦 Rebuild para Electron v${ELECTRON_VERSION}`);
  const moduleList = MODULES.join(',');
  execSync(`npx electron-rebuild -v ${ELECTRON_VERSION} -f ${moduleList}`, { stdio: 'inherit' });

  console.log('✅ Tudo pronto! Agora sqlite3, pg e mysql2 estão compilados para Electron.');
} catch (err) {
  console.error('❌ Erro ao preparar o ambiente:', err.message);
  process.exit(1);
}

const { app, BrowserWindow, Tray, Menu, Notification, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const io = require('socket.io-client');

let mainWindow;
let splashWindow;
let tray;
let backendProcess;
let socket = null;

// ✅ Caminho do config.json
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

// 🔧 Utilidades para config
function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ✅ Pega URL do backend (default se não existir)
function getBackendUrl() {
  const config = readConfig();
  return config.backendUrl || 'http://localhost:3000';
}

// ✅ Conecta WebSocket e escuta eventos
function connectWebSocket(backendUrl) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const normalizedUrl = backendUrl.endsWith('/')
    ? backendUrl.slice(0, -1)
    : backendUrl;

  const urlParts = normalizedUrl.split('/');
  const hasPrefix = urlParts.length > 3;
  const prefix = hasPrefix ? `/${urlParts.at(-1)}` : '';

  const wsUrl = `${urlParts[0]}//${urlParts[2]}`;
  const wsPath = `${prefix}/socket.io/` || '/socket.io/';

  console.log(`🔌 Conectando ao WebSocket: ${wsUrl} (path: ${wsPath})`);

  socket = io(wsUrl, {
    transports: ['websocket'],
    path: wsPath,
    reconnectionAttempts: 3,
    timeout: 5000,
  });

  socket.on('connect', () => console.log('✅ WebSocket conectado'));
  socket.on('connect_error', (err) => console.error('❌ connect_error:', err.message));
  socket.on('disconnect', () => console.log('⚠️ WebSocket desconectado'));

  socket.on('nova_chamada', (call) => {
    console.log('📢 Nova chamada recebida via WS:', call);
    if (areNotificationsEnabled()) {
      new Notification({
        title: `Nova chamada - ${call.department || 'Helpdesk'}`,
        body: call.title || 'Nova solicitação!',
        silent: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
      }).show();
    }
  });
}

// ✅ Handlers IPC
ipcMain.handle('get-backend-url', () => getBackendUrl());
ipcMain.on('update-backend-url', (event, newUrl) => {
  const config = readConfig();
  config.backendUrl = newUrl;
  saveConfig(config);
  console.log(`✅ Backend URL atualizada para: ${newUrl}`);
  connectWebSocket(newUrl);
});

ipcMain.handle('get-notification-preference', () => {
  const config = readConfig();
  return config.notificationsEnabled !== false; // default TRUE
});

ipcMain.on('set-notification-preference', (event, enabled) => {
  const config = readConfig();
  config.notificationsEnabled = enabled;
  saveConfig(config);
  console.log(`🔔 Notificações ${enabled ? 'ativadas' : 'desativadas'}`);
});

// ✅ Função que retorna o caminho do backend
function getBackendExecutable() {
  const backendName = process.platform === 'win32' ? 'eaata-help-desk-win.exe' : 'eaata-help-desk-linux';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'builds', 'backend', backendName);
  } else {
    return path.join(__dirname, '..', 'backend', 'builds', backendName);
  }
}

// ✅ Inicia backend NestJS
function startBackend() {
  const backendPath = getBackendExecutable();

  if (process.platform !== 'win32' && app.isPackaged) {
    try { fs.chmodSync(backendPath, '755'); } 
    catch (err) { console.error('Erro ao setar permissão de execução no backend:', err); }
  }

  const spawnCmd = app.isPackaged ? backendPath : 'node';
  const spawnArgs = app.isPackaged ? [] : [backendPath];

  backendProcess = spawn(spawnCmd, spawnArgs, {
    cwd: path.dirname(backendPath),
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  backendProcess.stdout.on('data', (data) => {
    const message = data.toString();
    console.log(`[BACKEND]: ${message}`);

    if (message.includes('Nova chamada')) {
      try {
        const call = JSON.parse(message.replace('Nova chamada ', '').trim());
        new Notification({
          title: `Nova chamada - ${call.department}`,
          body: call.title,
          silent: false,
          icon: path.join(__dirname, 'assets', 'icon.png'),
        }).show();
      } catch (err) { console.error('Erro ao parsear nova chamada:', err); }
    }

    if (message.includes('Reiniciar backend')) restartBackend();
    if (message.includes('Aplicação rodando em')) {
      if (splashWindow) { splashWindow.close(); splashWindow = null; }
      createWindow();
      connectWebSocket(getBackendUrl());
    }
  });

  backendProcess.stderr.on('data', (data) => console.error(`[BACKEND ERROR]: ${data.toString()}`));
  backendProcess.on('exit', (code) => console.log(`Backend saiu com código: ${code}`));
}

// ✅ Reinicia backend
function restartBackend() {
  if (backendProcess) backendProcess.kill();
  startBackend();

  new Notification({
    title: 'EAATA Help Desk',
    body: 'Backend reiniciado com sucesso!',
    icon: path.join(__dirname, 'assets', 'icon.png'),
  }).show();
}

// ✅ Splash
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    show: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ✅ Main Window
function createWindow() {
  if (mainWindow) { mainWindow.show(); return; }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'builds', 'frontend', 'index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) { event.preventDefault(); mainWindow.hide(); }
  });

  mainWindow.focus();
}

// ✅ Notificações habilitadas?
function areNotificationsEnabled() {
  const config = readConfig();
  return config.notificationsEnabled !== false; // padrão TRUE
}

// ✅ Tray
app.setName('EAATA Help Desk');
app.setAppUserModelId('com.eaata.helpdesk');

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  tray.setToolTip('EAATA Help Desk');

  tray.on('click', () => { if (!mainWindow) createWindow(); else mainWindow.show(); });
  tray.on('right-click', () => {
    const rightMenu = Menu.buildFromTemplate([
      { label: 'Abrir', click: () => { if (!mainWindow) createWindow(); else mainWindow.show(); } },
      { label: 'Reiniciar Backend', click: () => restartBackend() },
      { label: 'Reiniciar Aplicativo', click: () => { app.relaunch(); } },
      { label: 'Fechar Aplicação', click: () => { app.isQuiting = true; app.quit(); } }
    ]);
    tray.popUpContextMenu(rightMenu);
  });

  createSplash();
  startBackend();

  // ✅ Conecta WebSocket na inicialização com a URL salva
  
});

app.on('window-all-closed', () => { /* Mantém rodando no tray */ });

app.on('before-quit', () => {
  app.isQuiting = true;
  if (backendProcess) backendProcess.kill();
});

app.on('activate', () => { if (mainWindow === null) createWindow(); });

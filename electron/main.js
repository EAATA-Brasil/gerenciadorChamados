const { app, BrowserWindow, Tray, Menu, Notification, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const io = require('socket.io-client');

let mainWindow;
let splashWindow;
let tray;
let backendProcess;
let backendScriptPath;
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

  const wsUrl = backendUrl.replace(/^http/, 'ws'); // troca http por ws
  console.log(`🔌 Conectando ao WebSocket: ${wsUrl}`);

  socket = io(wsUrl, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('✅ WebSocket conectado');
  });

  socket.on('disconnect', () => {
    console.log('⚠️ WebSocket desconectado');
  });

  socket.on('nova_chamada', (call) => {
    console.log('📢 Nova chamada recebida via WS:', call);
    new Notification({
      title: `Nova chamada - ${call.department || 'Helpdesk'}`,
      body: call.title || 'Nova solicitação!',
      silent: false,
      icon: path.join(__dirname, 'assets', 'icon.png'),
    }).show();
  });
}

// ✅ Handlers IPC
ipcMain.handle('get-backend-url', () => {
  return getBackendUrl();
});

ipcMain.on('update-backend-url', (event, newUrl) => {
  const config = readConfig();
  config.backendUrl = newUrl;
  saveConfig(config);

  console.log(`✅ Backend URL atualizada para: ${newUrl}`);
  connectWebSocket(newUrl); // reconecta WebSocket na nova URL
});

// ✅ Inicia backend NestJS
function startBackend() {
  if (app.isPackaged) {
    backendScriptPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'builds', 'backend', 'backend.exe');
    backendProcess = spawn(backendScriptPath, [], {
      cwd: path.dirname(backendScriptPath),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } else {
    backendScriptPath = path.join(__dirname, '..', 'backend', 'dist', 'main.js');
    backendProcess = spawn('node', [backendScriptPath], {
      cwd: path.dirname(backendScriptPath),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  backendProcess.stdout.on('data', (data) => {
    const message = data.toString();

    if (message.includes('Nova chamada')) {
      const jsonPart = message.replace('Nova chamada ', '').trim();
      try {
        const call = JSON.parse(jsonPart);
        new Notification({
          title: `Nova chamada - ${call.department}`,
          body: call.title,
          silent: false,
          icon: path.join(__dirname, 'assets', 'icon.png'),
        }).show();
      } catch (err) {
        console.error('Erro ao parsear nova chamada:', err);
      }
    }

    if (message.includes('Reiniciar backend')) {
      new Notification({
        title: 'Reiniciando backend!',
        body: 'Nova configuração de banco de dados',
        silent: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
      }).show();
      restartBackend();
    }

    if (message.includes('Aplicação rodando em')) {
      console.log('✅ Backend pronto, fechando splash e abrindo app');
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      createWindow();
    }

    console.log(`[BACKEND]: ${message}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR]: ${data.toString()}`);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend saiu com código: ${code}`);
    if (!mainWindow && splashWindow) {
      splashWindow.close();
      splashWindow = null;
      createWindow();
    }
  });
}

function restartBackend() {
  if (backendProcess) backendProcess.kill();
  startBackend();

  new Notification({
    title: 'EAATA Help Desk',
    body: 'Backend reiniciado com sucesso!',
    icon: path.join(__dirname, 'assets', 'icon.png'),
  }).show();
}

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

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // para expor electronAPI
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'builds', 'frontend', 'index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.focus();
}

// ✅ Tray + inicialização
app.setName('EAATA Help Desk');
app.setAppUserModelId('com.eaata.helpdesk');

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  tray.setToolTip('EAATA Help Desk');

  tray.on('click', () => {
    if (!mainWindow) createWindow();
    else mainWindow.show();
  });

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
  connectWebSocket(getBackendUrl());
});

app.on('window-all-closed', () => { /* Mantém rodando no tray */ });

app.on('before-quit', () => {
  app.isQuiting = true;
  if (backendProcess) backendProcess.kill();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

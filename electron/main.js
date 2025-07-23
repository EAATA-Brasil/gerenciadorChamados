const { app, BrowserWindow, Tray, Menu, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let splashWindow;
let backendProcess;
let tray;
let backendScriptPath;

function startBackend() {
  if (app.isPackaged) {
    // Produção: backend.exe empacotado
    backendScriptPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'builds', 'backend', 'backend.exe');
    backendProcess = spawn(backendScriptPath, [], {
      cwd: path.dirname(backendScriptPath),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } else {
    // Desenvolvimento: roda o main.js do NestJS
    backendScriptPath = path.join(__dirname, '..', 'backend', 'dist', 'main.js');
    backendProcess = spawn('node', [backendScriptPath], {
      cwd: path.dirname(backendScriptPath),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  // 🔔 Detecta novas chamadas
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
        console.error('Erro ao fazer parse do JSON da nova chamada:', err);
      }
    }

    if(message.includes('Reiniciar backend')){
      new Notification({
        title:'Reiniciando backend!',
        body:'Nova configuração de banco de dados',
        silent: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
      }).show()
      restartBackend()
    }

    // ✅ Quando backend fica pronto
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
  if (backendProcess) {
    backendProcess.kill();
  }
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


app.setName('EAATA Help Desk');
app.setAppUserModelId('com.eaata.helpdesk');

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  tray.setToolTip('EAATA Help Desk');

  // ✅ Clique ESQUERDO → ABRE a aplicação
  tray.on('click', () => {
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });

  // ✅ Clique DIREITO → Mostra menu com opções
  tray.on('right-click', () => {
    const rightMenu = Menu.buildFromTemplate([
      { label: 'Abrir', click: () => { if (!mainWindow) createWindow(); else mainWindow.show(); } },
      { label: 'Reiniciar Backend', click: () => restartBackend() },
      { label: 'Reiniciar Aplicativo', click: () => {  app.relaunch(); } },
      { label: 'Fechar Aplicação', click: () => { app.isQuiting = true; app.quit(); } }
    ]);
    tray.popUpContextMenu(rightMenu);
  });


  createSplash();
  startBackend();
});

app.on('window-all-closed', () => {
  // Não fecha, mantém rodando no tray
});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (backendProcess) backendProcess.kill();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

const { app, BrowserWindow} = require("electron");
const path = require("path");

let mainWindow;

// ✅ Main Window
function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "builds", "frontend", "index.html"));
  }

  mainWindow.on("close", (event) => {
    if (!app.isQuiting) { event.preventDefault(); mainWindow.hide(); }
  });

  mainWindow.focus();
}
app.whenReady().then(() => {
  createWindow(); // Cria a janela principal

  app.on("activate", () => {
    // No macOS, é comum recriar uma janela no aplicativo quando o
    // ícone da dock é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // Se a janela já existir, apenas a mostre e foque nela.
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// ✅ Encerrar quando todas as janelas forem fechadas (exceto no macOS)
app.on("window-all-closed", () => {
  // process.platform !== 'darwin' significa que não é macOS
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Adicione esta variável para controlar o encerramento
app.on("before-quit", () => {
  app.isQuiting = true;
});

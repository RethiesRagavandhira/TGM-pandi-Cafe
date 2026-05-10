const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load Vite dev server if in development, else load built index.html
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Database Operations
ipcMain.handle('db:getMenu', async () => {
  return await db.getMenu();
});

ipcMain.handle('db:addMenuItem', async (event, item) => {
  return await db.addMenuItem(item);
});

ipcMain.handle('db:updateMenuItem', async (event, item) => {
  return await db.updateMenuItem(item);
});

ipcMain.handle('db:deleteMenuItem', async (event, id) => {
  return await db.deleteMenuItem(id);
});

ipcMain.handle('db:createBill', async (event, billData) => {
  return await db.createBill(billData);
});

ipcMain.handle('db:getBills', async (event, filters) => {
  return await db.getBills(filters);
});

ipcMain.handle('db:getDashboardStats', async () => {
  return await db.getDashboardStats();
});

ipcMain.handle('db:deleteBill', async (event, id) => {
  return await db.deleteBill(id);
});

ipcMain.handle('db:updateBill', async (event, billData) => {
  return await db.updateBill(billData);
});

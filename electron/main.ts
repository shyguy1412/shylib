import { ipcMain, app, BrowserWindow, session } from "electron";

ipcMain.handle("close", () => {
  app.quit();
});

ipcMain.handle("maximize", () => {
  const win = BrowserWindow.getFocusedWindow();

  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.handle("is-maximized", (e) => {
  return BrowserWindow.getFocusedWindow()?.isMaximized();
});

ipcMain.handle("is-fullscreen", (e) => {
  return BrowserWindow.getFocusedWindow()?.isFullScreen();
});

ipcMain.handle("minimize", () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

app.on("browser-window-created", (_, window) => {
  window.on('enter-full-screen', () => window.webContents.send('enter-full-screen'));
  window.on('leave-full-screen', () => window.webContents.send('leave-full-screen'));
});

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          `default-src 'self' ${process.env.DEV ? "'unsafe-inline'" : ""}`,
        ],
      },
    });
  });
});
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  shell,
  session,
} = require("electron");
const path = require("path");
const { execFile } = require("child_process");
const { fork } = require("child_process");

let backendProcess;
let mainWindow;
let tray;
let isQuiting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 620,
    minWidth: 420,
    minHeight: 520,
    resizable: true,
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: "#020409",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
  }

  mainWindow.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "assets", "icon.ico");

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Jarvis 열기",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: "숨기기",
      click: () => {
        mainWindow.hide();
      },
    },
    {
      label: "종료",
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Jarvis Running");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
        if (permission === "media") {
        callback(true);
        return;
        }

        callback(false);
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => {
        return permission === "media";
    }
  );
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "server.js")
    : path.join(__dirname, "../backend/server.js");
  backendProcess = fork(backendPath, [], {
    cwd: app.isPackaged
        ? path.join(process.resourcesPath, "backend")
        : path.join(__dirname, "../backend"),
    env: {
        ...process.env,
        JARVIS_DB_PATH: app.getPath("userData"),
        NODE_PATH: app.isPackaged
        ? path.join(process.resourcesPath, "backend", "node_modules")
        : path.join(__dirname, "../backend/node_modules"),
    },
  });
  createWindow();
  createTray();

  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });
});

app.on("before-quit", () => {
  isQuiting = true;
   if (backendProcess) {
    backendProcess.kill();
  }
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

ipcMain.on("hide-window", () => {
  mainWindow.hide();
});

ipcMain.on("show-window", () => {
  mainWindow.show();
  mainWindow.focus();
});

ipcMain.handle("set-auto-launch", async (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
  });

  return app.getLoginItemSettings();
});

ipcMain.handle("get-auto-launch", async () => {
  return app.getLoginItemSettings();
});

ipcMain.handle("open-app", async (event, appPath) => {
  return new Promise((resolve) => {
    execFile(appPath, (error) => {
      if (error) {
        resolve({ success: false, message: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle("open-folder", async (event, folderPath) => {
  const result = await shell.openPath(folderPath);
  return {
    success: result === "",
    message: result,
  };
});

ipcMain.handle("open-user-data-folder", async () => {
  const userDataPath = app.getPath("userData");
  shell.openPath(userDataPath);

  return userDataPath;


backendProcess.stdout?.on("data", (data) => {
  console.log("Backend:", data.toString());
});

backendProcess.stderr?.on("data", (data) => {
  console.error("Backend error:", data.toString());
});
});
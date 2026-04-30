const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jarvisAPI", {
  openApp: (appPath) => ipcRenderer.invoke("open-app", appPath),
  openFolder: (folderPath) => ipcRenderer.invoke("open-folder", folderPath),
  openUserDataFolder: () => ipcRenderer.invoke("open-user-data-folder"),
  setAutoLaunch: (enabled) => ipcRenderer.invoke("set-auto-launch", enabled),
  getAutoLaunch: () => ipcRenderer.invoke("get-auto-launch"),
  hideWindow: () => ipcRenderer.send("hide-window"),
  showWindow: () => ipcRenderer.send("show-window"),
});
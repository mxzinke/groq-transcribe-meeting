import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
  store: {
    get: (key: string) => ipcRenderer.invoke("store-get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("store-set", key, value),
    delete: (key: string) => ipcRenderer.invoke("store-delete", key),
  },
  audio: {
    requestPermission: () => ipcRenderer.invoke("request-audio-permission"),
    getSources: () => ipcRenderer.invoke("get-audio-sources"),
    requestScreenCapturePermission: () =>
      ipcRenderer.invoke("request-screen-capture-permission"),
    getDevices: () => ipcRenderer.invoke("get-audio-devices"),
  },
});

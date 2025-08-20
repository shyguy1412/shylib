import { contextBridge, ipcRenderer } from "electron";
import { bridge } from "./ModuleBridge";

bridge();

contextBridge.exposeInMainWorld("titlebar", {
  close: () => ipcRenderer.invoke("close"),
  maximize: () => ipcRenderer.invoke("maximize"),
  minimize: () => ipcRenderer.invoke("minimize"),
  isMaximised: () => ipcRenderer.invoke("is-maximized"),
});

contextBridge.exposeInMainWorld("fullscreen", {
  onEnterFullscreen: (callback: () => void) => ipcRenderer.on("enter-full-screen", callback),
  onLeaveFullscreen: (callback: () => void) => ipcRenderer.on("leave-full-screen", callback),
  isFullscreen: () => ipcRenderer.invoke("is-fullscreen")
});

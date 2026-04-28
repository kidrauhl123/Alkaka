import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('petElectron', {
  openMainWindow: () => ipcRenderer.invoke('pet:openMainWindow'),
  hidePet: () => ipcRenderer.invoke('pet:hide'),
  quitApp: () => ipcRenderer.invoke('pet:quit'),
  showContextMenu: (position?: { x: number; y: number }) =>
    ipcRenderer.invoke('pet:showContextMenu', position),
  moveWindowBy: (dx: number, dy: number) =>
    ipcRenderer.send('pet:moveWindowBy', dx, dy),
});

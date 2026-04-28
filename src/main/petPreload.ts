import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('petElectron', {
  openMainWindow: () => ipcRenderer.invoke('pet:openMainWindow'),
  hidePet: () => ipcRenderer.invoke('pet:hide'),
  quitApp: () => ipcRenderer.invoke('pet:quit'),
  showContextMenu: (position?: { x: number; y: number }) =>
    ipcRenderer.invoke('pet:showContextMenu', position),
  moveWindowBy: (dx: number, dy: number) =>
    ipcRenderer.send('pet:moveWindowBy', dx, dy),
  setQuickInputExpanded: (expanded: boolean) =>
    ipcRenderer.invoke('pet:setQuickInputExpanded', expanded),
  startQuickTask: (options: { prompt: string; title: string }) =>
    ipcRenderer.invoke('pet:quickTask:start', options),
});

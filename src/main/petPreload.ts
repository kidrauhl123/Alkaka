import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('petElectron', {
  openMainWindow: () => ipcRenderer.invoke('pet:openMainWindow'),
  openSession: (sessionId: string) => ipcRenderer.invoke('pet:openCoworkSession', { sessionId }),
  hidePet: () => ipcRenderer.invoke('pet:hide'),
  quitApp: () => ipcRenderer.invoke('pet:quit'),
  showContextMenu: (position?: { x: number; y: number }) =>
    ipcRenderer.invoke('pet:showContextMenu', position),
  moveWindowBy: (dx: number, dy: number) =>
    ipcRenderer.send('pet:moveWindowBy', dx, dy),
  setQuickInputExpanded: (expanded: boolean) =>
    ipcRenderer.invoke('pet:setQuickInputExpanded', expanded),
  setPointerPassthrough: (passthrough: boolean) =>
    ipcRenderer.send('pet:setPointerPassthrough', passthrough),
  startQuickTask: (options: { prompt: string; title: string }) =>
    ipcRenderer.invoke('pet:quickTask:start', options),
  getStatus: () => ipcRenderer.invoke('pet:status:current'),
  onStatusChanged: (listener: (status: unknown) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, status: unknown) => listener(status);
    ipcRenderer.on('pet:status:changed', wrapped);
    return () => ipcRenderer.removeListener('pet:status:changed', wrapped);
  },
});

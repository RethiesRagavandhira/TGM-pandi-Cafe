const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMenu: () => ipcRenderer.invoke('db:getMenu'),
  addMenuItem: (item) => ipcRenderer.invoke('db:addMenuItem', item),
  updateMenuItem: (item) => ipcRenderer.invoke('db:updateMenuItem', item),
  deleteMenuItem: (id) => ipcRenderer.invoke('db:deleteMenuItem', id),
  createBill: (billData) => ipcRenderer.invoke('db:createBill', billData),
  getBills: (filters) => ipcRenderer.invoke('db:getBills', filters),
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  deleteBill: (id) => ipcRenderer.invoke('db:deleteBill', id),
  updateBill: (billData) => ipcRenderer.invoke('db:updateBill', billData),
});

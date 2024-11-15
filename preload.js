console.log('Preload script loaded');
const { contextBridge, ipcRenderer } = require('electron');



contextBridge.exposeInMainWorld('electronAPI', {
    navigateToInformes: () => ipcRenderer.send('navigateToInformes'),
    userInteracted: () => ipcRenderer.send('user-interacted'),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    onUserData: (callback) => ipcRenderer.on('userData', callback),
    navigateToIndex: () => ipcRenderer.send('navigateToIndex'),
    loadContent: (filePath) => ipcRenderer.send('load-content', filePath),
    openWindow: (filePath) => ipcRenderer.invoke('open-window', filePath),
    createUser: (email, password) => ipcRenderer.invoke('firebase-auth-createUser', email, password),
    uploadUserPhoto: (base64String, fileName) => ipcRenderer.invoke('upload-user-photo', base64String, fileName),
    saveUserData: (userData) => ipcRenderer.invoke('save-user-data', userData),
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    logTime: (logData) => ipcRenderer.invoke('logTime', logData),
    showPopup: (message) => ipcRenderer.send('show-popup', message),
    onTimeEvent: (callback) => ipcRenderer.on('time-event', (_, message) => callback(message)),
    onPopupTrigger: (callback) => ipcRenderer.on('trigger-popup', (event, arg) => callback(arg)),
    testMorningPopup: () => ipcRenderer.send('trigger-test-popup', 'test-morning'),
    testEveningPopup: () => ipcRenderer.send('trigger-test-popup', 'test-evening'),
    fetchRandomQuote: async () => {
        return await ipcRenderer.invoke('fetch-random-quote');
    }
});

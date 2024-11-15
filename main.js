const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('./asistencia.json');
const notifier = require('node-notifier');


// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

let mainWindow;
let minuteCounter = 0;
let userInteracted = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
    // Setup the initial popup trigger
    setupPopupTrigger();
    // Initial check and set interval to check every minute
scheduleNextPopup();
setInterval(scheduleNextPopup, 60000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function scheduleNextPopup() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  let type = '';

  // Check for morning popup condition
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && currentHour === 9 && currentMinute === 30) {
      type = 'morning';
  }
  // Check for Friday evening popup condition
  else if (dayOfWeek === 5 && currentHour === 14 && currentMinute === 0) {
      type = 'friday-evening';
  }
  // Check for evening popup condition
  else if (dayOfWeek >= 1 && dayOfWeek <= 4 && currentHour === 17 && currentMinute === 0) {
      type = 'evening';
  }

  // If it's time for a popup, send the trigger event
  if (type) {
      console.log(`Triggering ${type} popup event`);
      mainWindow.webContents.send('trigger-popup', { type });
  }
}


function setupPopupTrigger() {
  // Wait for 5 minutes before starting to check for user interaction
  setTimeout(() => {
    if (!userInteracted) {
      // User has not interacted after 5 minutes; start playing the sound
      const soundInterval = setInterval(() => {
        mainWindow.webContents.send('play-popup-sound');
        minuteCounter++;
        
        if (minuteCounter >= 5) {
          // After 5 more minutes (total of 10 minutes since the popup appeared)
          clearInterval(soundInterval); // Stop playing sounds
          showNotification(); // Show notification if the user hasn't interacted
        }
      }, 60000); // Play sound every minute

      // Reset the counter for this new phase
      minuteCounter = 0;
    }
  }, 5 * 60000); // 5 minutes
}


app.on('ready', createWindow);


app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Clear intervals and timeouts here
  if (global.soundInterval) clearInterval(global.soundInterval);
  if (global.notificationTimeout) clearTimeout(global.notificationTimeout);
});


function showNotification() {
  const iconPath = path.join(__dirname, 'asistnciA.png');
console.log(iconPath); // Log the path to check if it's correct
  notifier.notify(

    
    {
      title: 'Notificacion de AsisTnCia',
      message: 'Tienes alertas pendientes!',
      icon: path.join(__dirname, 'asistnciA.png'), // Optional: Path to your icon
      sound: true, // Optional: Use the system notification sound
      wait: true // Wait for the user action against the notification
    },
    function (err, response, metadata) {
      // Response is the action taken by the user.
      if (response === 'activate') {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    }
  );
}

ipcMain.on('navigateToInformes', () => {
  mainWindow.loadFile('informes.html');
});

// Listen for user interaction with the popup to set the flag
ipcMain.on('user-interacted', (event) => {
  console.log('User interacted with the popup');
  userInteracted = true;
});

// Event listener for popup trigger
ipcMain.on('trigger-popup', () => {
  console.log("Before attempting to focus:");
  console.log(`Is minimized: ${mainWindow.isMinimized()}`);
  console.log(`Is visible: ${mainWindow.isVisible()}`);
  console.log(`Is focused: ${mainWindow.isFocused()}`);
  
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  
  console.log("After attempting to focus:");
  console.log(`Is minimized: ${mainWindow.isMinimized()}`);
  console.log(`Is visible: ${mainWindow.isVisible()}`);
  console.log(`Is focused: ${mainWindow.isFocused()}`);
});

ipcMain.on('load-content', (event, filePath) => {
  if (mainWindow) {
    mainWindow.loadFile(filePath);
  }
});

ipcMain.handle('open-window', async (event, filePath) => {
  if (mainWindow) {
    await mainWindow.loadFile(filePath);
  }
});

ipcMain.on('navigateToIndex', () => {
  mainWindow.loadFile('index.html');
});

ipcMain.handle('upload-user-photo', async (event, base64String, fileName) => {
  try {
    const buffer = Buffer.from(base64String, 'base64');
    const storage = admin.storage();
    const storageRef = storage.ref(`FotosEmpleados/${fileName}`);
    const snapshot = await storageRef.put(buffer);
    const url = await snapshot.ref.getDownloadURL();
    return { success: true, url: url };
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-user-data', async (event, userData) => {
  try {
    await db.collection("EMPLEADOS").doc(userData.uid).set(userData);
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error: error.message };
  }
});

// // Handle IPC call to fetch a random quote
ipcMain.handle('fetch-random-quote', async () => {
  const random = Math.random();
  let quote = { Texto: "No quote available", Autor: "", Observacion: "" }; // Default quote

  try {
      let querySnapshot = await db.collection('CITAS')
                                  .where('random', '>=', random)
                                  .orderBy('random')
                                  .limit(1)
                                  .get();

      if (querySnapshot.empty) {
          querySnapshot = await db.collection('CITAS')
                                  .where('random', '<', random)
                                  .orderBy('random', 'desc')
                                  .limit(1)
                                  .get();
      }

      if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          quote = { Texto: doc.data().Texto, Autor: doc.data().Autor, Observacion: doc.data().Observacion };
      }
  } catch (error) {
      console.error("Error fetching quote from Firestore:", error);
  }

  return quote;
});

ipcMain.handle('logTime', async (event, { userName, dateId, ...rest }) => {
  if (!userName || !dateId) {
    console.error("UserName or DateId is missing");
    return { success: false, error: "UserName or DateId is missing" };
  }

  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();

    const docPath = `/ASISTENCIA/${userName}/LOGS/${year}-${month}`;
    const docRef = admin.firestore().doc(docPath);
    const updateData = { [dateId]: rest };

    await docRef.set(updateData, { merge: true });
    console.log(`Time logged successfully for ${userName} on ${dateId}`);
    return { success: true, message: "Time logged successfully" };
  } catch (error) {
    console.error('Error logging time data:', error);
    return { success: false, error: error.message };
  }
});







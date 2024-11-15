




document.addEventListener('DOMContentLoaded', () => {
    // checkTimeAndShowPopup();
    // setInterval(checkTimeAndShowPopup, 60000); // Check every minute
    //Esto era un duplicado de la misma llamada desde el main process parece que por eso el popup se duplicaba

    function dismissBtnHandler() {
        logDismissalTime();
        document.getElementById('attendanceModal').style.display = 'none';
        if (new Date().getHours() < 12) {
            window.electronAPI.minimizeApp();
        }

        // Clear intervals or timeouts
    if (soundInterval) clearInterval(soundInterval);
    if (notificationTimeout) clearTimeout(notificationTimeout);
    
        // Send an IPC message to indicate user interaction
        window.electronAPI.userInteracted();
    }
    
    // When the DOM is fully loaded
    // Ensure the 'dismissBtn' event listener is added only once
    const dismissBtn = document.getElementById('dismissBtn');
    // Remove the event listener to avoid duplicating it in case this code runs more than once
    dismissBtn.removeEventListener('click', dismissBtnHandler);
    // Add the event listener
    dismissBtn.addEventListener('click', dismissBtnHandler);

    electronAPI.onPopupTrigger(({ type }) => { // Directly using electronAPI for event listening
        switch (type) {
            case 'morning':
                displayMorningPopup();
                break;
            case 'evening':
                displayEveningPopup();
                break;
            case 'friday-evening':
                displayFridayEveningPopup();
                break;
            case 'test-morning':
                displayMorningPopup();
                break;
            case 'test-evening':
                displayEveningPopup();
                break;
            default:
                console.error("Unknown time event type:", type);
        }
    });
});
    

function checkTimeAndShowPopup() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Morning popup for every weekday (Monday to Friday) at 09:30
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hours === 9 && minutes === 30) {
        displayMorningPopup(); // Assuming this function displays the morning popup
    }

    // Evening popup for Monday to Thursday at 17:00
    else if (dayOfWeek >= 1 && dayOfWeek <= 4 && hours === 17 && minutes === 0) {
        displayEveningPopup(); // Assuming this function displays the evening popup
    }

    // Special Friday evening popup at 14:00
    else if (dayOfWeek === 5 && hours === 14 && minutes === 0) {
        displayFridayEveningPopup(); // Assuming this function displays the special Friday evening popup
    }



    
}


function updatePopupContent(greeting, quote, isEntry) {
    const popupContentDiv = document.getElementById('popupContent');
    let contentHtml = `<div class="popup-section greeting-section">${greeting}</div>`;

    // Always add the quote text.
    contentHtml += `<div class="popup-section quote-section">`;
    if (quote.Texto) {
        contentHtml += `<i>"${quote.Texto}"</i><br>`;
    }

    // Add author if present and meaningful.
    if (quote.Autor && quote.Autor !== "No Author") { // Adjust condition as needed
        contentHtml += `<strong>- ${quote.Autor}</strong><br>`;
    }

    // Add observation if present and meaningful.
    if (quote.Observacion && quote.Observacion.toLowerCase() !== "no observation") { // Checking for specific placeholder text
        contentHtml += `<em>${quote.Observacion}</em>`;
    }

    contentHtml += `</div>`; // Closing the quote-section div.

    popupContentDiv.innerHTML = contentHtml;

    const okButton = document.createElement('button');
    okButton.className = "ok-button";
    okButton.innerText = 'OK';
    okButton.onclick = () => {
        logDismissalTime(isEntry);
        document.getElementById('popupContainer').style.display = 'none';
        displayDismissMessage(isEntry);
    };
    popupContentDiv.appendChild(okButton);
}


export function displayMorningPopup() {
    console.log("Displaying Morning Popup");
    electronAPI.fetchRandomQuote().then(quote => { // Adjusted for fetchRandomQuote invocation
        const greeting = `Buenos días <b>${localStorage.getItem('userName') || 'Usuario'}</b><br>Hora de comenzar el trabajo`;
        updatePopupContent(greeting, quote, true);
        playPopupSound();
        showPopup();
    });
}

export function displayEveningPopup() {
    console.log("Displaying Evening Popup");
    electronAPI.fetchRandomQuote().then(quote => { // Adjusted for fetchRandomQuote invocation
        const greeting = `Buenas noches <b>${localStorage.getItem('userName') || 'Usuario'}</b><br>Hora de ir tirando pa' casa`;
        updatePopupContent(greeting, quote, false);
        playPopupSound();
        showPopup();
    });
}

function displayFridayEveningPopup() {
    console.log("Displaying Friday Evening Popup");
    electronAPI.fetchRandomQuote().then(quote => { // Adjusted for fetchRandomQuote invocation
        const greeting = `Feliz fin de semana <b>${localStorage.getItem('userName') || 'Usuario'}</b><br>Nos vemos la próxima semana`;
        updatePopupContent(greeting, quote, false);
        playPopupSound();
        showPopup();
    });
}



function playPopupSound() {
    const audio = document.getElementById('popupAudio');
    if (audio) audio.play();
}

function showPopup() {
    const popupContainerDiv = document.getElementById('popupContainer');
    if (popupContainerDiv) popupContainerDiv.style.display = 'block';
}

// function logDismissalTime(isEntry, justification = null) {
//     const currentTime = new Date();

//     // Use Intl.DateTimeFormat to format the date with Spanish day of the week and month
//     const formatter = new Intl.DateTimeFormat('es-ES', {
//         weekday: 'long', 
//         year: 'numeric', 
//         month: 'long', // Use 'long' to get the full month name in Spanish
//         day: '2-digit'
//     });
//     const [{ value: weekday },,{ value: day },,{ value: month },,{ value: year }] = formatter.formatToParts(currentTime);
    
//     // Combine formatted parts into a single string
//     const dateFormatted = `${weekday.toUpperCase()} ${day}-${month.toUpperCase()}-${year}`;

//     // Determine if this is an entry or exit time log
//     const timeField = isEntry ? 'entryTime' : 'exitTime';
//     const time = currentTime.toLocaleTimeString('es-ES', {
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit'
//     });

//     const logData = {
//         userName: localStorage.getItem('userName') || 'defaultUserName',
//         dateId: dateFormatted,
//         [timeField]: time,
//         justification: justification // Include justification if provided
//     };

//     // Log time
//     window.electronAPI.logTime(logData)
//         .then(() => {
//             console.log("Time logged successfully.");
//             document.getElementById('popupContainer').style.display = 'none';
//         })
//         .catch(error => {
//             console.error("Error logging time: ", error);
//         });
// }



function logDismissalTime(isEntry, justification = null) {
    const currentTime = new Date();

    // Standardized date formatting
    const dayOfWeek = new Intl.DateTimeFormat('es-ES', {weekday: 'long'}).format(currentTime).toUpperCase();
    const monthName = currentTime.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    const dateFormatted = `${dayOfWeek} ${currentTime.getDate().toString().padStart(2, '0')}-${monthName}-${currentTime.getFullYear()}`;

    const timeField = isEntry ? 'entryTime' : 'exitTime';
    const time = currentTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const logData = {
        userName: localStorage.getItem('userName') || 'defaultUserName',
        dateId: dateFormatted,
        [timeField]: time,
        justification: justification
    };

    console.log("Attempting to log time:", logData);

    window.electronAPI.logTime(logData)
        .then(() => {
            console.log("Time logged successfully.");
            document.getElementById('popupContainer').style.display = 'none';
           
        })
        .catch(error => {
            console.error("Error logging time: ", error);
        });
}


function displayDismissMessage(isEntry) {
    let message = "";
    // Determine the message based on the entry flag and the day of the week
    message = isEntry ? "Recibido.Que tengas buena jornada" : 
              (new Date().getDay() === 5 ? "Feliz fin de semana" : "Hasta mañana.Que descanses.");
    
    // Display message in an alert
    alert(message);
}


export async function fetchRandomQuote(db) {
    try {
        const docRef = doc(db, "quotes", "randomQuoteId"); // Example path
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            return docSnap.data();
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching document: ", error);
        return null;
    }
}


function getTimeUntil(targetHour, targetMinute) {
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0, 0);

    let delay = targetTime - now;
    if (delay < 0) {
        // If the time has already passed today, schedule for next day
        delay += 24 * 60 * 60 * 1000;
    }
    return delay;
}

function isWeekday(date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek > 0 && dayOfWeek < 6; // 0 = Sunday, 6 = Saturday
  }


export async function generateLogsMayo() {
    const userName = 'CHRISTIAN ELE BIONG'; 
    const year = 2024;
    const month = 5; // May
    const monthName = 'MAYO';
    const daysInMonth = new Date(year, month, 0).getDate();
    let logs = {};

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
            const dayOfWeek = new Intl.DateTimeFormat('es-ES', {weekday: 'long'}).format(date).toUpperCase();
            const dateKey = `${dayOfWeek} ${day.toString().padStart(2, '0')}-${monthName}-${year}`;

            const isLate = Math.random() < 0.2;  // 20% chance to be late
            const isEarly = Math.random() < 0.3; // 30% chance to leave early
            const normalStartHour = isLate ? 10 : 9;
            const normalEndHour = isEarly ? (date.getDay() === 5 ? 13 : 16) : (date.getDay() === 5 ? 14 : 17);

            if (Math.random() < 0.78) { // 78% chance to log normal hours
                logs[dateKey] = {
                    entryTime: `${normalStartHour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    exitTime: `${normalEndHour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    justification: null
                };
            } else { // 22% chance of absence
                logs[dateKey] = {
                    entryTime: '--',
                    exitTime: '--',
                    justification: null
                };
            }
        }
    }

    // Make sure to use the Firebase Firestore functions correctly
    const docPath = `/ASISTENCIA/${userName}/LOGS/${year}-${monthName}`;
    const docRef = window.doc(window.db, docPath); // Ensure these are attached to window in your HTML script where Firebase is initialized

    try {
        await window.setDoc(docRef, logs, { merge: true });
        console.log(`Logs successfully saved for ${monthName}`);
    } catch (error) {
        console.error(`Error saving logs for ${monthName}:`, error);
    }

    return logs; // Optionally return the logs for testing or further operations
}



  

  

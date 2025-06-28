import { initTheme } from './theme.js';
import { initSidebar } from './sidebar.js';

let reminders = JSON.parse(localStorage.getItem('wetinReminders') || '[]');
const reminderList = document.getElementById('reminderList');

function saveReminders() {
  localStorage.setItem('wetinReminders', JSON.stringify(reminders));
}

function renderReminders() {
  reminderList.innerHTML = '';
  if (reminders.length === 0) {
    reminderList.innerHTML = '<li>No reminders yet.</li>';
    return;
  }
  reminders.forEach((rem, idx) => {
    let icon = rem.type === 'alarm' ? '⏰' : '⏳';
    let timeDisplay = '';
    if (rem.type === 'alarm') {
      // Convert 24hr time to 12hr with AM/PM
      const [h, m] = rem.time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = ((h + 11) % 12 + 1);
      timeDisplay = `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    } else {
      timeDisplay = `${rem.minutes} min`;
    }
    let soundName = rem.soundName || 'Classic Bell';

    const li = document.createElement('li');
    const infoDiv = document.createElement('div');
    infoDiv.className = 'reminder-info';

    const label = document.createElement('strong');
    label.textContent = rem.label || '(No label)';

    const meta = document.createElement('span');
    meta.className = 'reminder-meta';
    meta.innerHTML = `${icon} ${timeDisplay} <span style="color:#888;">(${soundName})</span>`;

    infoDiv.appendChild(label);
    infoDiv.appendChild(meta);

    // Add toggle switch for alarms only
    let toggle = null;
    if (rem.type === 'alarm') {
      toggle = document.createElement('label');
      toggle.className = 'switch';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!rem.repeat;
      input.onchange = () => {
        rem.repeat = input.checked;
        saveReminders();
      };
      const slider = document.createElement('span');
      slider.className = 'slider';
      toggle.appendChild(input);
      toggle.appendChild(slider);
      infoDiv.appendChild(toggle);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'deleteBtn';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => {
      reminders.splice(idx, 1);
      saveReminders();
      renderReminders();
    };

    li.appendChild(infoDiv);
    li.appendChild(delBtn);
    reminderList.appendChild(li);
  });
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

function notifyUser(label, soundId) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Wetin Dey Sup Reminder', { body: label });
  }
  const audio = document.getElementById(soundId || 'sound1');
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
  alert(label); // fallback for mobile browsers
}

// Alarm/timer logic
function checkAlarms() {
  const now = new Date();
  reminders.forEach((rem, idx) => {
    if (rem.type === 'alarm') {
      const [h, m] = rem.time.split(':').map(Number);
      if (now.getHours() === h && now.getMinutes() === m && !rem._lastTriggered) {
        notifyUser(rem.label || 'Alarm!', rem.sound);
        rem._lastTriggered = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${h}-${m}`;
        // If not repeating, delete after ringing
        if (!rem.repeat) {
          setTimeout(() => {
            reminders = reminders.filter((r, i) => i !== idx);
            saveReminders();
            renderReminders();
          }, 500); // Give a short delay for notification to show
        } else {
          saveReminders();
        }
      }
      if (rem._lastTriggered && now.getHours() === 0 && now.getMinutes() === 0) {
        rem._lastTriggered = null;
        saveReminders();
      }
    }
    if (rem.type === 'timer') {
      if (!rem.endTime) return;
      const msLeft = rem.endTime - Date.now();
      rem.remaining = msLeft;
      if (msLeft <= 0) {
        notifyUser(rem.label || 'Timer done!', rem.sound);
        reminders = reminders.filter(r => r !== rem);
        saveReminders();
        renderReminders();
      }
    }
  });
}

setInterval(checkAlarms, 10000); // check every 10 seconds

// When adding a new alarm:
document.getElementById('alarmForm').onsubmit = function(e) {
  e.preventDefault();
  const time = document.getElementById('alarmTime').value;
  const label = document.getElementById('alarmLabel').value;
  const sound = document.getElementById('alarmSoundSelect').value;
  const repeat = document.getElementById('alarmRepeat').checked;
  if (!time) return;
  reminders.push({
    type: 'alarm',
    time,
    label,
    sound,
    repeat
  });
  saveReminders();
  renderReminders();
  this.reset();
};

// Remove repeat for timers in the timer form handler:
document.getElementById('timerForm').onsubmit = function(e) {
  e.preventDefault();
  const minutes = parseInt(document.getElementById('timerMinutes').value, 10);
  const label = document.getElementById('timerLabel').value;
  const sound = document.getElementById('timerSoundSelect').value;
  if (!minutes) return;
  const endTime = Date.now() + minutes * 60000;
  reminders.push({
    type: 'timer',
    minutes,
    label,
    sound,
    endTime
  });
  saveReminders();
  renderReminders();
  this.reset();
};

// When a reminder/alarm rings:
function handleReminderRing(idx) {
  const rem = reminders[idx];
  // Play sound, show notification, etc.
  if (!rem.repeat) {
    reminders.splice(idx, 1); // Remove if not repeating
    saveReminders();
    renderReminders();
  } else if (rem.type === 'alarm') {
    // For repeating alarms, set next day (if needed)
    // No need to change time, just wait for next day
  } else if (rem.type === 'timer') {
    // For repeating timers, set new endTime
    rem.endTime = Date.now() + rem.minutes * 60000;
    saveReminders();
    renderReminders();
  }
}

// (Your timer/alarm checking logic should call handleReminderRing(idx) when a reminder is due)

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  requestNotificationPermission();
  renderReminders();
});
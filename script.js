const form = document.getElementById('entryForm');
const mood = document.getElementById('mood');
const thoughts = document.getElementById('thoughts');
const entriesDiv = document.getElementById('entries');

const newPasscode = document.getElementById('newPasscode');
const confirmPasscode = document.getElementById('confirmPasscode');
const setPasscodeError = document.getElementById('setPasscodeError');

const passcodeInput = document.getElementById('passcodeInput');
const passcodeError = document.getElementById('passcodeError');

function getPasscode() { return localStorage.getItem('wetinPasscode'); }

const setPasscodeScreen = document.getElementById('setPasscodeScreen');
const lockScreen = document.getElementById('lockScreen');
const mainContent = document.getElementById('mainContent');

const forgotPasscodeBtn = document.getElementById('forgotPasscode');
const forgotPasscodeModal = document.getElementById('forgotPasscodeModal');
const resetPasscodeBtn = document.getElementById('resetPasscodeBtn');
const rememberPasscodeBtn = document.getElementById('rememberPasscodeBtn');

const themeToggleBtn = document.getElementById('themeToggleBtn');

let entries = JSON.parse(localStorage.getItem('wetinEntries')) || [];

let idleTimeout;

const quotes = [
  "No forget say even Mad person dey rest sometimes! No go use work kill yourself ",
  "You strong pass this wahala 💪",
  "Na small small, e go better 🌱",
  "Talk your mind, body no be firewood 🧘",
  "Abeg no lock up, drop your gist 📝"
];

function showQuote() {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  entriesDiv.innerHTML = `<p>${randomQuote}</p>`;
}

function showFullEntry(entry) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const content = document.createElement('div');
  content.className = 'full-entry-modal';
  content.innerHTML = `
    <h3 style="margin-top:0;">Mood: ${entry.mood}</h3>
    <p style="white-space: pre-wrap; word-wrap: break-word;">${entry.text}</p>
    <small>${entry.date}</small>
    <br><br>
    <button id="closeModalBtn" class="modal-close-btn">Close</button>
  `;
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    overlay.remove();
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

function displayEntries(filterMood = 'all') {
  if (entries.length === 0) {
    showQuote();
    return;
  }
  let filtered = entries;
  if (filterMood !== 'all') {
    filtered = entries.filter(e => e.mood === filterMood);
  }
  if (filtered.length === 0) {
    entriesDiv.innerHTML = '<p>mumu, You put gist for here ?.</p>';
    return;
  }
  entriesDiv.innerHTML = filtered
    .map(
      (entry, idx) =>
        `<div class="entry" style="padding:10px; margin-bottom:10px; border-radius:8px; cursor:pointer;">
          <strong>${entry.mood}</strong> — <small>${entry.date}</small><br>
          <span>${entry.text.length > 50 ? entry.text.slice(0, 50) + '...' : entry.text}</span>
        </div>`
    )
    .join('');
  document.querySelectorAll('.entry').forEach((el, idx) => {
    el.addEventListener('click', () => {
      showFullEntry(filtered[idx]);
    });
  });
}

function saveEntries() {
  localStorage.setItem('wetinEntries', JSON.stringify(entries));
}

function resetIdleTimer() {
  if (idleTimeout) clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    lockJournal();
  }, 5 * 60 * 1000); // 5 minutes idle lock
}

function lockJournal() {
  mainContent.style.display = 'none';
  mainContent.classList.remove('active');
  document.body.classList.remove('unlocked');
  lockScreen.style.display = 'block';
  passcodeInput.value = '';
  passcodeError.style.display = 'none';
  clearIdleTimer();
}

function clearIdleTimer() {
  if (idleTimeout) clearTimeout(idleTimeout);
}

function showSetPasscodeScreen() {
  setPasscodeScreen.style.display = 'block';
  lockScreen.style.display = 'none';
  mainContent.style.display = 'none';
  newPasscode.value = '';
  confirmPasscode.value = '';
  setPasscodeError.style.display = 'none';
  document.body.classList.remove('unlocked');
  document.getElementById('hamburger').style.display = 'none';
  document.getElementById('sidebarOverlay').style.display = 'none';
}

function showLockScreen() {
  setPasscodeScreen.style.display = 'none';
  lockScreen.style.display = 'block';
  mainContent.style.display = 'none';
  passcodeInput.value = '';
  passcodeError.style.display = 'none';
  document.body.classList.remove('unlocked');
  document.getElementById('hamburger').style.display = 'none';
  document.getElementById('sidebarOverlay').style.display = 'none';
}

function showMainContent() {
  setPasscodeScreen.style.display = 'none';
  lockScreen.style.display = 'none';
  mainContent.style.display = 'block';
  mainContent.classList.add('active');
  document.body.classList.add('unlocked');
  document.getElementById('hamburger').style.display = 'block';
  document.getElementById('sidebarOverlay').style.display = 'none';
  displayEntries();
  resetIdleTimer();
}

function init() {
  if (!getPasscode()) {
    showSetPasscodeScreen();
  } else {
    showLockScreen();
  }
}

function applyTheme(theme) {
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(theme === 'light' ? 'light-mode' : 'dark-mode');
  themeToggleBtn.textContent = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('setPasscodeBtn').addEventListener('click', () => {
    if (newPasscode.value === '' || confirmPasscode.value === '') {
      setPasscodeError.textContent = 'alaye add passcode na!🙄';
      setPasscodeError.style.display = 'block';
      return;
    }
    if (newPasscode.value !== confirmPasscode.value) {
      setPasscodeError.textContent = 'Passcodes no match! 😐';
      setPasscodeError.style.display = 'block';
      return;
    }
    localStorage.setItem('wetinPasscode', newPasscode.value);
    setPasscodeError.style.display = 'none';
    // Update the passcode variable in memory
    // passcode = newPasscode.value; // This won't work because passcode is a const
    // Instead, call showLockScreen directly:
    showLockScreen();
  });

  document.getElementById('unlockBtn').addEventListener('click', () => {
  if (passcodeInput.value === getPasscode()) {
    passcodeError.style.display = 'none';
    showMainContent();
  } else {
    passcodeError.style.display = 'block';
  }
});

  forgotPasscodeBtn.addEventListener('click', () => {
    forgotPasscodeModal.style.display = 'flex';
  });

  resetPasscodeBtn.addEventListener('click', () => {
    localStorage.removeItem('wetinPasscode');
    localStorage.removeItem('wetinEntries');
    entries = [];
    forgotPasscodeModal.style.display = 'none';
    showSetPasscodeScreen();
  });

  rememberPasscodeBtn.addEventListener('click', () => {
    forgotPasscodeModal.style.display = 'none';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!mood.value || !thoughts.value) return;
    const entry = {
      mood: mood.value,
      text: thoughts.value.trim(),
      date: new Date().toLocaleString(),
    };
    entries.unshift(entry);
    saveEntries();
    displayEntries(document.getElementById('filterMood').value);
    form.reset();
    resetIdleTimer();
  });

  document.getElementById('clearAll').addEventListener('click', () => {
    if (confirm('You sure say you wan clear all your gist? This no go fit undo o!')) {
      entries = [];
      saveEntries();
      displayEntries();
    }
    resetIdleTimer();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    if (entries.length === 0) {
      alert('omo, No gist to export jare.');
      return;
    }
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wetin_dey_sup_gist.json';
    a.click();
    URL.revokeObjectURL(url);
    resetIdleTimer();
  });

  document.getElementById('lockNowBtn').addEventListener('click', () => {
    lockJournal();
  });

  document.getElementById('changePasscodeBtn').addEventListener('click', () => {
    showSetPasscodeScreen();
  });

  document.getElementById('filterMood').addEventListener('change', e => {
    displayEntries(e.target.value);
  });

  document.body.addEventListener('mousemove', resetIdleTimer);
  document.body.addEventListener('keydown', resetIdleTimer);

  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== hamburger &&
      !hamburger.contains(e.target)
    ) {
      sidebar.classList.remove('open');
      sidebarOverlay.style.display = 'none';
    }
  });

  // Theme logic
  const savedTheme = localStorage.getItem('wetinTheme') || 'dark';
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('wetinTheme', newTheme);
  });
});

(function trackUniqueUser() {
  const TRACKING_URL = "/api/track-user";
  let userId = localStorage.getItem('wds_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('wds_user_id', userId);
    fetch(TRACKING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
  }
})();


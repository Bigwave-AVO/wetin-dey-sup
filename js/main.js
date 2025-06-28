import { getPasscode, showSetPasscodeScreen, showLockScreen, showMainContent, initPasscodeFeature } from './passcode.js';
import { displayEntries, addEntry, clearEntries, getEntries, setEntries } from './entries.js';
import { initTheme } from './theme.js';
import { initSidebar } from './sidebar.js';

function lockJournal() {
  showLockScreen();
  localStorage.removeItem('wetinUnlocked'); // Add this line
}

function unlockJournal() {
  showMainContent(displayEntries, resetIdleTimer);
  localStorage.setItem('wetinUnlocked', 'true'); // Add this line
}

function resetIdleTimer() {
  if (window.idleTimeout) clearTimeout(window.idleTimeout);
  window.idleTimeout = setTimeout(() => {
    lockJournal();
  }, 5 * 60 * 1000); // 5 minutes
}

function clearIdleTimer() {
  if (window.idleTimeout) clearTimeout(window.idleTimeout);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();

  if (!getPasscode()) {
    showSetPasscodeScreen();
  } else {
    showLockScreen();
  }

  initPasscodeFeature(lockJournal, unlockJournal);

  // Entry form logic
  const form = document.getElementById('entryForm');
  const mood = document.getElementById('mood');
  const thoughts = document.getElementById('thoughts');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!mood.value || !thoughts.value) return;
    const entry = {
      mood: mood.value,
      text: thoughts.value.trim(),
      date: new Date().toLocaleString(),
    };
    addEntry(entry);
    displayEntries(document.getElementById('filterMood').value);
    form.reset();
    resetIdleTimer();
  });

  document.getElementById('clearAll').addEventListener('click', () => {
    if (confirm('You sure say you wan clear all your gist? This no go fit undo o!')) {
      clearEntries();
    }
    resetIdleTimer();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const entries = getEntries();
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

  document.getElementById('filterMood').addEventListener('change', e => {
    displayEntries(e.target.value);
  });

  document.body.addEventListener('mousemove', resetIdleTimer);
  document.body.addEventListener('keydown', resetIdleTimer);

  if (localStorage.getItem('wetinUnlocked') === 'true') {
    unlockJournal();
  }
});
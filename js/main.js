import { getPasscode, showSetPasscodeScreen, showLockScreen, showMainContent, initPasscodeFeature } from './passcode.js';
import { displayEntries, addEntry, clearEntries, getEntries, setEntries } from './entries.js';
import { initTheme } from './theme.js';
import { initSidebar } from './sidebar.js';

function showHamburger(show) {
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.style.display = show ? 'flex' : 'none';
}

function lockJournal() {
  showLockScreen();
  localStorage.removeItem('wetinUnlocked');
  showHamburger(false); // Hide hamburger when locked
}

function unlockJournal() {
  showMainContent(displayEntries, resetIdleTimer);
  localStorage.setItem('wetinUnlocked', 'true');
  showHamburger(true); // Show hamburger when unlocked
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

// --- Add language loader and update all UI text ---
function loadLanguage(lang) {
  fetch('translations.json')
    .then(res => res.json())
    .then(data => {
      const translations = data[lang];
      for (const key in translations) {
        const el = document.getElementById(key);
        if (el) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('data-i18n-placeholder')) {
              el.placeholder = translations[key];
            } else {
              el.value = translations[key];
            }
          } else {
            el.innerText = translations[key];
          }
        }
        // For select/option placeholders
        const option = document.querySelector('option#' + key);
        if (option) option.innerText = translations[key];
      }
      // For elements with data-i18n-placeholder
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[key]) el.placeholder = translations[key];
      });
    });
}

// --- Language toggle logic ---
const languageToggle = document.getElementById('languageToggle');
const defaultLang = localStorage.getItem('wetinLang') || 'en';
loadLanguage(defaultLang);
languageToggle.value = defaultLang;
languageToggle.addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('wetinLang', lang);
  loadLanguage(lang);
});

// --- Replace all alert/confirm text with translation keys ---
function t(key) {
  const lang = localStorage.getItem('wetinLang') || 'en';
  if (!window._translations) return key;
  return window._translations[lang][key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();

  if (!getPasscode()) {
    showSetPasscodeScreen();
    showHamburger(false);
  } else {
    showLockScreen();
    showHamburger(false);
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
    if (confirm(t('clearAllConfirm'))) {
      clearEntries();
    }
    resetIdleTimer();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const entries = getEntries();
    if (entries.length === 0) {
      alert(t('noGistToExport'));
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}

// Note: Google Authentication is now handled by Firebase in index.html
// This file focuses on the main app logic


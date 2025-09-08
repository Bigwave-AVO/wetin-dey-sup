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

// Google Auth & Drive logic
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file profile email openid';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let googleUser = null;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // will be set on sign-in
  });
  gisInited = true;
}

document.getElementById('googleSignInBtn').onclick = () => {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      alert('Sign-in failed!');
      return;
    }
    document.getElementById('googleSignInBtn').style.display = 'none';
    document.getElementById('googleSignOutBtn').style.display = '';
    document.getElementById('googleBackupBtn').style.display = '';
    document.getElementById('googleRestoreBtn').style.display = '';
    // Get user info
    const userInfo = await gapi.client.request({path: 'https://www.googleapis.com/oauth2/v3/userinfo'});
    googleUser = userInfo.result;
    alert('Signed in as ' + googleUser.name);
  };
  tokenClient.requestAccessToken({prompt: 'consent'});
};

document.getElementById('googleSignOutBtn').onclick = () => {
  google.accounts.oauth2.revoke(tokenClient.access_token, () => {
    document.getElementById('googleSignInBtn').style.display = '';
    document.getElementById('googleSignOutBtn').style.display = 'none';
    document.getElementById('googleBackupBtn').style.display = 'none';
    document.getElementById('googleRestoreBtn').style.display = 'none';
    googleUser = null;
    alert('Signed out!');
  });
};

document.getElementById('googleBackupBtn').onclick = async () => {
  const journalData = localStorage.getItem('journalEntries');
  if (!journalData) return alert('No journal data to backup!');
  const fileContent = new Blob([journalData], {type: 'application/json'});
  const metadata = {
    name: 'WetinDeySupJournalBackup.json',
    mimeType: 'application/json'
  };
  const accessToken = gapi.client.getToken().access_token;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', fileContent);

  fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: new Headers({'Authorization': 'Bearer ' + accessToken}),
    body: form,
  }).then((res) => res.json()).then((val) => {
    alert('Backup complete! File ID: ' + val.id);
  });
};

document.getElementById('googleRestoreBtn').onclick = async () => {
  const resp = await gapi.client.drive.files.list({
    q: "name='WetinDeySupJournalBackup.json' and trashed=false",
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
  });
  if (!resp.result.files || resp.result.files.length === 0) {
    alert('No backup found!');
    return;
  }
  const fileId = resp.result.files[0].id;
  const fileResp = await gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  });
  localStorage.setItem('journalEntries', JSON.stringify(fileResp.body));
  alert('Restore complete! Reload the app to see your journal.');
};

// Load Google API scripts
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;


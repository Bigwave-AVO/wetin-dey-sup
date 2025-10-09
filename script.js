/* Minimal, robust single-file app script
   - All DOM lookups happen inside DOMContentLoaded
   - Safe translation loader (tolerates // and block comments)
   - Entries stored in localStorage key "wetinEntries"
   - Passcode flows (set / lock / unlock / reset)
   - Simple voice-note support (attach recording to saved entry)
   - Defensive guards so missing DOM nodes won't throw
*/

const defaultTranslations = {
  appTitle: "What's Up?",
  themeToggleBtn: "Change Theme",
  changePasscodeBtn: "Change Passcode",
  exportBtn: "Export All Notes 📄",
  setPasscodeHeader: "🔐 Set a Passcode for your journal",
  newPasscode: "New Passcode",
  confirmPasscode: "Confirm Passcode",
  setPasscodeBtn: "Set Passcode",
  setPasscodeError_empty: "Please enter a passcode! 🙄",
  setPasscodeError_mismatch: "Passcodes do not match! 😐",
  lockScreenHeader: "🔐 Enter Passcode",
  passcodeInput: "Enter Passcode",
  unlockBtn: "Unlock Journal",
  passcodeError: "Incorrect passcode. Please try again!",
  forgotPasscode: "Forgot Passcode?",
  forgotPasscodeMsg: "You forgot your passcode? What do you want to do?",
  resetPasscodeBtn: "Reset Passcode (Clear All Notes)",
  rememberPasscodeBtn: "Try Again",
  lockNowBtn: "Lock Journal 🔒",
  moodLabel: "How are you feeling?",
  selectMood: "Select mood",
  moodHappy: "😄 Happy",
  moodSad: "😞 Sad",
  moodAngry: "😡 Angry",
  moodConfused: "😕 Confused",
  moodTired: "😩 Tired",
  moodChill: "😎 Chill",
  thoughts: "What's on your mind?",
  saveBtn: "Save Note",
  clearAll: "Clear All Notes 🗑️",
  filterMoodLabel: "Filter by mood:",
  filterAll: "All",
  filterHappy: "😄 Happy",
  filterSad: "😞 Sad",
  filterAngry: "😡 Angry",
  filterConfused: "😕 Confused",
  filterTired: "😩 Tired",
  filterChill: "😎 Chill",
  pastGistHeader: "Your Past Notes 📓",
  quote1: "Don't forget, even busy people need rest! Don't overwork yourself.",
  quote2: "You're stronger than your troubles 💪",
  quote3: "Step by step, things will get better 🌱",
  quote4: "Speak your mind, you're not a robot 🧘",
  quote5: "Don't keep it in, share your thoughts 📝",
  noEntries: "You haven't added any notes yet.",
  clearAllConfirm: "Are you sure you want to clear all your notes? This cannot be undone!",
  exportEmpty: "No notes to export.",
  modalCloseBtn: "Close",
  googleSignInText: "Sign in with Google",
  signOutBtn: "Sign Out",
  saveVoiceBtn: "Save Voice Note",
  saveTextBtn: "Save Text Note",
  entryTitleLabel: "Entry Title:",
  searchInput: "Search entries...",
  editModalTitle: "Edit Entry",
  saveEditBtn: "Save Changes",
  cancelEditBtn: "Cancel",
  editBtn: "Edit",
  deleteBtn: "Delete",
  replaceVoiceBtn: "Replace Voice Note"
};

let translations = { ...defaultTranslations };
let currentLang = localStorage.getItem('wetinLang') || 'en';

// DOM refs (populated on DOMContentLoaded)
let form, mood, thoughts, entriesDiv, entryTitle;
let newPasscode, confirmPasscode, setPasscodeError;
let passcodeInput, passcodeError;
let setPasscodeScreen, lockScreen, mainContent;
let forgotPasscodeBtn, forgotPasscodeModal, resetPasscodeBtn, rememberPasscodeBtn;
let themeToggleBtn, languageSelect, sidebar, hamburger, sidebarOverlay;
let recordBtn, recordStatus, saveVoiceBtn;
let googleSignInBtn, signOutBtn, userInfo, userPhoto, userName, googleSignInText;
let searchInput, clearSearchBtn, filterMood;
let editEntryModal, editForm, editEntryTitle, editMood, editThoughts, editVoiceControls, editAudioPlayer, replaceVoiceBtn, saveEditBtn, cancelEditBtn;

let entries = []; // in-memory entries list (most-recent-first)
let currentUser = null; // Firebase auth user

// ---------------------- Authentication ----------------------
function updateAuthUI(user) {
  currentUser = user;
  
  if (user) {
    // User is signed in
    if (userInfo) userInfo.style.display = 'block';
    if (googleSignInBtn) googleSignInBtn.style.display = 'none';
    if (userPhoto) userPhoto.src = user.photoURL || '';
    if (userName) userName.textContent = user.displayName || user.email || 'User';
  } else {
    // User is signed out
    if (userInfo) userInfo.style.display = 'none';
    if (googleSignInBtn) googleSignInBtn.style.display = 'flex';
  }
}

function handleGoogleSignIn() {
  console.log('handleGoogleSignIn called');
  console.log('window.googleSignIn available:', !!window.googleSignIn);
  console.log('window.firebaseAuth available:', !!window.firebaseAuth);
  
  if (window.googleSignIn) {
    window.googleSignIn()
      .then((result) => {
        console.log('Sign in successful:', result.user);
        updateAuthUI(result.user);
      })
      .catch((error) => {
        console.error('Sign in error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert('Sign in failed: ' + error.message);
      });
  } else {
    console.error('Google sign in function not available');
    alert('Firebase authentication not initialized. Please refresh the page.');
  }
}

function handleSignOut() {
  if (window.googleSignOut) {
    window.googleSignOut()
      .then(() => {
        console.log('Sign out successful');
        updateAuthUI(null);
      })
      .catch((error) => {
        console.error('Sign out error:', error);
      });
  } else {
    console.error('Google sign out function not available');
  }
}

function initializeAuth() {
  if (window.onAuthStateChanged && window.firebaseAuth) {
    window.onAuthStateChanged(window.firebaseAuth, (user) => {
      updateAuthUI(user);
    });
  } else {
    console.warn('Firebase auth not available yet');
    // Retry after a short delay
    setTimeout(initializeAuth, 1000);
  }
}

// ---------------------- Translations ----------------------
function safeParseTranslations(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // remove // single-line and /* */ block comments then parse
    const cleaned = text.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return JSON.parse(cleaned);
  }
}

function setText(key) {
  const el = document.getElementById(key) || document.querySelector(`[data-i18n="${key}"]`);
  if (!el) {
    console.warn('Element not found for key:', key);
    return;
  }
  const value = translations[key];
  if (value === undefined) {
    console.warn('Translation not found for key:', key);
    return;
  }
  const tag = el.tagName && el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    el.placeholder = value;
  } else if (tag === 'OPTION') {
    el.textContent = value;
  } else {
    el.textContent = value;
  }
  console.log(`Set ${key}: "${value}"`);
}

function populateAllText() {
  // Use all available translation keys
  const allKeys = Object.keys(translations);
  allKeys.forEach(setText);
  console.log('Populated text for keys:', allKeys);
}

function loadLanguage(lang) {
  console.log('Loading language:', lang);
  
  // try fetch translations.json, tolerant of comments
  fetch('translations.json', { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch translations.json: ' + res.status);
      return res.text();
    })
    .then(text => {
      const raw = safeParseTranslations(text);
      const chosen = raw && raw[lang] ? lang : (raw && raw['pidgin'] ? 'pidgin' : (raw && raw['en'] ? 'en' : 'en'));
      
      // Completely replace translations with the chosen language, not merge
      if (raw && raw[chosen]) {
        translations = { ...raw[chosen] };
      } else {
        translations = { ...defaultTranslations };
      }
      
      currentLang = chosen;
      localStorage.setItem('wetinLang', chosen);
      populateAllText();
      updateLanguageUI(chosen);
      
      console.log('Language loaded successfully:', chosen, 'Translations:', translations);
    })
    .catch(err => {
      console.warn('Could not load translations.json, using defaults.', err);
      translations = { ...defaultTranslations };
      populateAllText();
      updateLanguageUI(currentLang);
    });
}

window.changeLanguage = function(lang) { if (lang) loadLanguage(lang); };

function updateLanguageUI(lang) {
  if (languageSelect) {
    try { 
      // Only update if the value is different to prevent reset
      if (languageSelect.value !== lang) {
        languageSelect.value = lang;
      }
    } catch (e) {
      console.warn('Error updating language select:', e);
    }
  }
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active-lang', btn.getAttribute('data-lang') === lang);
  });
}

function attachLanguageButtons() {
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.removeEventListener('click', onLangClick);
    btn.addEventListener('click', onLangClick);
  });
  function onLangClick(e) {
    const lang = e.currentTarget.getAttribute('data-lang');
    if (lang) {
      console.log('Language button clicked:', lang);
      loadLanguage(lang);
    }
  }
  // Note: languageSelect event listener is handled separately in DOMContentLoaded
}

// ---------------------- Storage / entries ----------------------
const STORAGE_KEY = 'wetinEntries';
const VERSION_KEY = 'wetinAppVersion';
const CURRENT_VERSION = '2.0.0'; // Increment this for each major update

// Data migration system
function migrateData() {
  const currentStoredVersion = localStorage.getItem(VERSION_KEY);
  
  if (!currentStoredVersion) {
    // First time user or very old version
    console.log('First time user or very old version detected');
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    return;
  }
  
  if (currentStoredVersion !== CURRENT_VERSION) {
    console.log(`Migrating from version ${currentStoredVersion} to ${CURRENT_VERSION}`);
    
    // Backup existing data before migration
    const entries = loadEntries();
    if (entries.length > 0) {
      const backupKey = `wetinEntries_backup_${currentStoredVersion}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(entries));
      console.log(`Data backed up to ${backupKey}`);
    }
    
    // Perform version-specific migrations
    if (currentStoredVersion === '1.0.0') {
      migrateFromV1ToV2();
    }
    
    // Update version
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    console.log('Data migration completed');
  }
}

function migrateFromV1ToV2() {
  // Example migration: Add new fields to existing entries
  const entries = loadEntries();
  const migratedEntries = entries.map(entry => {
    return {
      ...entry,
      version: '2.0.0',
      migratedAt: new Date().toISOString()
    };
  });
  
  if (migratedEntries.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedEntries));
    console.log(`Migrated ${migratedEntries.length} entries to version 2.0.0`);
  }
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { console.warn('Failed loading entries:', e); }
  return [];
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) { console.error('Failed saving entries:', e); }
}

function displayEntries(filter = 'all', searchTerm = '') {
  if (!entriesDiv) return;
  entriesDiv.innerHTML = '';
  
  let list = entries.filter(en => {
    // Apply mood filter
    if (filter !== 'all' && en.mood !== filter) return false;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = en.title ? en.title.toLowerCase().includes(searchLower) : false;
      const textMatch = en.text ? en.text.toLowerCase().includes(searchLower) : false;
      return titleMatch || textMatch;
    }
    
    return true;
  });
  
  if (list.length === 0) {
    const noEntries = document.createElement('div');
    noEntries.className = 'no-entries';
    noEntries.textContent = searchTerm ? 'No entries found matching your search.' : translations['noEntries'];
    noEntries.style.textAlign = 'center';
    noEntries.style.color = '#888';
    noEntries.style.padding = '2rem';
    entriesDiv.appendChild(noEntries);
    return;
  }
  
  list.forEach((en, i) => {
    const el = document.createElement('div');
    el.className = 'entry';
    el.setAttribute('data-entry-id', i);
    
    // Add expand indicator
    const expandIndicator = document.createElement('div');
    expandIndicator.className = 'entry-expand-indicator';
    expandIndicator.innerHTML = '▼';
    el.appendChild(expandIndicator);
    
    // Add type indicator
    const typeIndicator = document.createElement('small');
    typeIndicator.textContent = en.type === 'voice' ? '🎤 Voice Note' : '📝 Text Note';
    typeIndicator.style.color = en.type === 'voice' ? '#4285f4' : '#d35400';
    typeIndicator.style.fontWeight = 'bold';
    el.appendChild(typeIndicator);
    
    // Add title if exists
    if (en.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'entry-title';
      titleEl.textContent = en.title;
      el.appendChild(titleEl);
    }
    
    // Add mood
    const moodEl = document.createElement('div');
    moodEl.className = 'entry-mood';
    moodEl.textContent = en.mood ? en.mood.toUpperCase() : '';
    el.appendChild(moodEl);
    
    // Add date
    const date = document.createElement('small');
    date.textContent = en.date || '';
    date.style.color = '#888';
    el.appendChild(date);

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'entry-content collapsed';

    // Handle voice entries
    if (en.type === 'voice' && en.audioData) {
      const wrap = document.createElement('div');
      wrap.className = 'audio-wrap';
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.preload = 'none';
      audio.src = en.audioData;
      wrap.appendChild(audio);
      contentWrapper.appendChild(wrap);
    }

    // Handle text entries
    if (en.type === 'text' && en.text) {
      const textPreview = document.createElement('div');
      textPreview.className = 'entry-text-preview';
      textPreview.textContent = en.text;
      contentWrapper.appendChild(textPreview);
      
      const textFull = document.createElement('div');
      textFull.className = 'entry-text-full';
      textFull.textContent = en.text;
      textFull.style.display = 'none';
      contentWrapper.appendChild(textFull);
    }

    el.appendChild(contentWrapper);

    // Add action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'entry-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = translations['editBtn'] || 'Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(en);
    });
    actionsDiv.appendChild(editBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = translations['deleteBtn'] || 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteEntry(en);
    });
    actionsDiv.appendChild(deleteBtn);
    
    el.appendChild(actionsDiv);
    
    // Add click handler for expand/collapse
    el.addEventListener('click', () => toggleEntryExpansion(el, en));
    
    entriesDiv.appendChild(el);
  });
}

// ---------------------- Passcode / UI screens ----------------------
function getPasscode() {
  return localStorage.getItem('wetinPasscode') || null;
}

function showSetPasscodeScreen() {
  if (setPasscodeScreen) setPasscodeScreen.style.display = 'block';
  if (lockScreen) lockScreen.style.display = 'none';
  if (mainContent) mainContent.style.display = 'none';
  document.body.classList.remove('unlocked');
  
  // Ensure hamburger is hidden when setting passcode
  if (hamburger) hamburger.style.display = 'none';
}

function showLockScreen() {
  if (setPasscodeScreen) setPasscodeScreen.style.display = 'none';
  if (lockScreen) lockScreen.style.display = 'block';
  if (mainContent) mainContent.style.display = 'none';
  document.body.classList.remove('unlocked');
  
  // Ensure hamburger is hidden when locked
  if (hamburger) hamburger.style.display = 'none';
}

function showMainContent() {
  if (setPasscodeScreen) setPasscodeScreen.style.display = 'none';
  if (lockScreen) lockScreen.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';
  document.body.classList.add('unlocked');
  
  // Show hamburger when unlocked
  if (hamburger) hamburger.style.display = 'flex';
}

function lockJournal() {
  showLockScreen();
  // no other action required
}

// ---------------------- Voice recording (attach-on-submit) ----------------------
let _mediaRecorder = null;
let _audioChunks = [];
let _currentAudioData = null; // data URL
let _currentAudioMime = 'audio/webm';

function _blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _audioChunks = [];
    _mediaRecorder = new MediaRecorder(stream);
    _mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data && e.data.size > 0) _audioChunks.push(e.data);
    });
    _mediaRecorder.addEventListener('stop', async () => {
      const blob = new Blob(_audioChunks, { type: _mediaRecorder.mimeType || _currentAudioMime });
      _currentAudioMime = blob.type || _currentAudioMime;
      _currentAudioData = await _blobToDataURL(blob);
      try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
      _updateRecordUI(false);
      console.log('Recorded audio bytes:', blob.size);
    });
    _mediaRecorder.start();
    _updateRecordUI(true);
  } catch (err) {
    console.error('Microphone access error:', err);
    alert('Microphone access required to record voice notes.');
    _updateRecordUI(false);
  }
}

function stopRecording() {
  if (_mediaRecorder && _mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
  else _updateRecordUI(false);
}

function toggleRecording() {
  if (!recordBtn) return;
  const isRecording = recordBtn.getAttribute('data-recording') === 'true';
  if (isRecording) stopRecording();
  else startRecording();
}

function _updateRecordUI(isRecording) {
  if (!recordBtn || !recordStatus) return;
  recordBtn.setAttribute('data-recording', isRecording ? 'true' : 'false');
  recordBtn.setAttribute('aria-pressed', isRecording ? 'true' : 'false');
  if (isRecording) {
    recordBtn.classList.add('recording');
    recordStatus.textContent = 'Recording…';
    if (saveVoiceBtn) saveVoiceBtn.style.display = 'none';
  } else {
    recordBtn.classList.remove('recording');
    if (_currentAudioData) {
      recordStatus.textContent = 'Ready to Save';
      if (saveVoiceBtn) saveVoiceBtn.style.display = 'inline-block';
    } else {
      recordStatus.textContent = 'Start';
      if (saveVoiceBtn) saveVoiceBtn.style.display = 'none';
    }
  }
}

function saveVoiceNote() {
  if (!_currentAudioData) {
    alert('No voice note recorded. Please record first.');
    return;
  }
  
  if (!mood || !mood.value) {
    alert('Please select a mood for your voice note.');
    return;
  }
  
  const voiceEntry = {
    type: 'voice',
    title: entryTitle ? entryTitle.value.trim() : '',
    mood: mood.value,
    audioData: _currentAudioData,
    audioMime: _currentAudioMime,
    date: new Date().toLocaleString(),
    version: CURRENT_VERSION
  };
  
  entries.unshift(voiceEntry);
  saveEntries();
  
  // Clear the current audio buffer and form
  _currentAudioData = null;
  _currentAudioMime = 'audio/webm';
  _updateRecordUI(false);
  if (entryTitle) entryTitle.value = '';
  if (mood) mood.value = '';
  
  // Refresh the display
  const filterVal = filterMood ? filterMood.value : 'all';
  const searchVal = searchInput ? searchInput.value : '';
  displayEntries(filterVal, searchVal);
  
  console.log('Voice note saved successfully');
}

// ---------------------- Edit and Delete Functions ----------------------
let currentEditingEntry = null;

function openEditModal(entry) {
  currentEditingEntry = entry;
  
  if (editEntryTitle) editEntryTitle.value = entry.title || '';
  if (editMood) editMood.value = entry.mood || '';
  if (editThoughts) editThoughts.value = entry.text || '';
  
  // Handle voice entries
  if (entry.type === 'voice') {
    if (editVoiceControls) editVoiceControls.style.display = 'block';
    if (editThoughts) editThoughts.style.display = 'none';
    if (editAudioPlayer) {
      editAudioPlayer.innerHTML = '';
      if (entry.audioData) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = entry.audioData;
        editAudioPlayer.appendChild(audio);
      }
    }
  } else {
    if (editVoiceControls) editVoiceControls.style.display = 'none';
    if (editThoughts) editThoughts.style.display = 'block';
  }
  
  if (editEntryModal) {
    editEntryModal.style.display = 'flex';
    editEntryModal.classList.remove('modal-hidden');
  }
}

function closeEditModal() {
  currentEditingEntry = null;
  if (editEntryModal) {
    editEntryModal.style.display = 'none';
    editEntryModal.classList.add('modal-hidden');
  }
}

function saveEditedEntry() {
  if (!currentEditingEntry) return;
  
  const index = entries.indexOf(currentEditingEntry);
  if (index === -1) return;
  
  // Update the entry
  currentEditingEntry.title = editEntryTitle ? editEntryTitle.value.trim() : '';
  currentEditingEntry.mood = editMood ? editMood.value : '';
  
  if (currentEditingEntry.type === 'text') {
    currentEditingEntry.text = editThoughts ? editThoughts.value.trim() : '';
  }
  
  // Update date to show it was edited
  currentEditingEntry.lastEdited = new Date().toLocaleString();
  
  entries[index] = currentEditingEntry;
  saveEntries();
  
  // Refresh display
  const filterVal = filterMood ? filterMood.value : 'all';
  const searchVal = searchInput ? searchInput.value : '';
  displayEntries(filterVal, searchVal);
  
  closeEditModal();
  console.log('Entry updated successfully');
}

function deleteEntry(entry) {
  if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return;
  
  const index = entries.indexOf(entry);
  if (index > -1) {
    entries.splice(index, 1);
    saveEntries();
    
    // Refresh display
    const filterVal = filterMood ? filterMood.value : 'all';
    const searchVal = searchInput ? searchInput.value : '';
    displayEntries(filterVal, searchVal);
    
    console.log('Entry deleted successfully');
  }
}

// ---------------------- Search Functionality ----------------------
function performSearch() {
  const searchTerm = searchInput ? searchInput.value.trim() : '';
  const filterVal = filterMood ? filterMood.value : 'all';
  
  // Show/hide clear button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
  }
  
  displayEntries(filterVal, searchTerm);
}

function clearSearch() {
  if (searchInput) searchInput.value = '';
  if (clearSearchBtn) clearSearchBtn.style.display = 'none';
  const filterVal = filterMood ? filterMood.value : 'all';
  displayEntries(filterVal, '');
}

// ---------------------- Entry Expansion Functions ----------------------
function toggleEntryExpansion(entryElement, entry) {
  const isExpanded = entryElement.classList.contains('expanded');
  const contentWrapper = entryElement.querySelector('.entry-content');
  const textPreview = entryElement.querySelector('.entry-text-preview');
  const textFull = entryElement.querySelector('.entry-text-full');
  
  if (isExpanded) {
    // Collapse
    entryElement.classList.remove('expanded');
    contentWrapper.classList.remove('expanded');
    contentWrapper.classList.add('collapsed');
    
    if (textPreview && textFull) {
      textPreview.style.display = 'block';
      textFull.style.display = 'none';
    }
  } else {
    // Expand
    entryElement.classList.add('expanded');
    contentWrapper.classList.remove('collapsed');
    contentWrapper.classList.add('expanded');
    
    if (textPreview && textFull) {
      textPreview.style.display = 'none';
      textFull.style.display = 'block';
    }
  }
}

// ---------------------- Small utilities ----------------------
function safeAddListener(idOrEl, evt, fn) {
  const el = (typeof idOrEl === 'string') ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  el.addEventListener(evt, fn);
}

// ---------------------- DOM wiring ----------------------
document.addEventListener('DOMContentLoaded', () => {
  // assign DOM refs
  form = document.getElementById('entryForm');
  mood = document.getElementById('mood');
  thoughts = document.getElementById('thoughts');
  entriesDiv = document.getElementById('entries');
  entryTitle = document.getElementById('entryTitle');

  newPasscode = document.getElementById('newPasscode');
  confirmPasscode = document.getElementById('confirmPasscode');
  setPasscodeError = document.getElementById('setPasscodeError');

  passcodeInput = document.getElementById('passcodeInput');
  passcodeError = document.getElementById('passcodeError');

  setPasscodeScreen = document.getElementById('setPasscodeScreen');
  lockScreen = document.getElementById('lockScreen');
  mainContent = document.getElementById('mainContent');

  forgotPasscodeBtn = document.getElementById('forgotPasscode');
  forgotPasscodeModal = document.getElementById('forgotPasscodeModal');
  resetPasscodeBtn = document.getElementById('resetPasscodeBtn');
  rememberPasscodeBtn = document.getElementById('rememberPasscodeBtn');

  themeToggleBtn = document.getElementById('themeToggleBtn');
  languageSelect = document.getElementById('languageSelect');

  sidebar = document.getElementById('sidebar');
  hamburger = document.getElementById('hamburger');
  sidebarOverlay = document.getElementById('sidebarOverlay');

  recordBtn = document.getElementById('recordBtn');
  recordStatus = document.getElementById('recordStatus');
  saveVoiceBtn = document.getElementById('saveVoiceBtn');

  // Auth elements
  googleSignInBtn = document.getElementById('googleSignInBtn');
  signOutBtn = document.getElementById('signOutBtn');
  userInfo = document.getElementById('userInfo');
  userPhoto = document.getElementById('userPhoto');
  userName = document.getElementById('userName');
  googleSignInText = document.getElementById('googleSignInText');

  // Search and filter elements
  searchInput = document.getElementById('searchInput');
  clearSearchBtn = document.getElementById('clearSearchBtn');
  filterMood = document.getElementById('filterMood');

  // Edit modal elements
  editEntryModal = document.getElementById('editEntryModal');
  editForm = document.getElementById('editForm');
  editEntryTitle = document.getElementById('editEntryTitle');
  editMood = document.getElementById('editMood');
  editThoughts = document.getElementById('editThoughts');
  editVoiceControls = document.getElementById('editVoiceControls');
  editAudioPlayer = document.getElementById('editAudioPlayer');
  replaceVoiceBtn = document.getElementById('replaceVoiceBtn');
  saveEditBtn = document.getElementById('saveEditBtn');
  cancelEditBtn = document.getElementById('cancelEditBtn');

  // translations + language wiring
  attachLanguageButtons();
  loadLanguage(currentLang);

  // load entries
  entries = loadEntries();
  // if there is no passcode set, show set-passcode screen, else lock screen
  if (!getPasscode()) showSetPasscodeScreen();
  else showLockScreen();

  // safe listeners
  safeAddListener('setPasscodeBtn', 'click', () => {
    if (!newPasscode || !confirmPasscode) return;
    if (!newPasscode.value || !confirmPasscode.value) {
      if (setPasscodeError) { setPasscodeError.textContent = translations['setPasscodeError_empty']; setPasscodeError.style.display = 'block'; }
      return;
    }
    if (newPasscode.value !== confirmPasscode.value) {
      if (setPasscodeError) { setPasscodeError.textContent = translations['setPasscodeError_mismatch']; setPasscodeError.style.display = 'block'; }
      return;
    }
    localStorage.setItem('wetinPasscode', newPasscode.value);
    if (setPasscodeError) setPasscodeError.style.display = 'none';
    showLockScreen();
  });

  safeAddListener('unlockBtn', 'click', () => {
    if (!passcodeInput) return;
    if (passcodeInput.value === getPasscode()) {
      if (passcodeError) passcodeError.style.display = 'none';
      showMainContent();
    } else {
      if (passcodeError) { passcodeError.textContent = translations['passcodeError']; passcodeError.style.display = 'block'; }
    }
  });

  if (forgotPasscodeBtn && forgotPasscodeModal) {
    forgotPasscodeBtn.addEventListener('click', () => { 
      forgotPasscodeModal.style.display = 'flex';
      forgotPasscodeModal.classList.remove('modal-hidden');
    });
  }
  safeAddListener('modalCloseBtn', 'click', () => { 
    if (forgotPasscodeModal) {
      forgotPasscodeModal.style.display = 'none';
      forgotPasscodeModal.classList.add('modal-hidden');
    }
  });

  if (resetPasscodeBtn) {
    resetPasscodeBtn.addEventListener('click', () => {
      localStorage.removeItem('wetinPasscode');
      entries = [];
      saveEntries();
      if (forgotPasscodeModal) {
        forgotPasscodeModal.style.display = 'none';
        forgotPasscodeModal.classList.add('modal-hidden');
      }
      showSetPasscodeScreen();
    });
  }
  if (rememberPasscodeBtn) safeAddListener(rememberPasscodeBtn, 'click', () => { 
    if (forgotPasscodeModal) {
      forgotPasscodeModal.style.display = 'none';
      forgotPasscodeModal.classList.add('modal-hidden');
    }
  });

  // form submit - save text entry only (voice notes saved separately)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!mood || !thoughts) return;
      if (!mood.value || !thoughts.value) return;
      const ent = {
        type: 'text',
        title: entryTitle ? entryTitle.value.trim() : '',
        mood: mood.value,
        text: thoughts.value.trim(),
        date: new Date().toLocaleString(),
        version: CURRENT_VERSION
      };

      entries.unshift(ent);
      saveEntries();
      const filterVal = filterMood ? filterMood.value : 'all';
      displayEntries(filterVal);
      form.reset();
      console.log('Text entry saved successfully');
    });
  }

  safeAddListener('clearAll', 'click', () => {
    if (!confirm(translations['clearAllConfirm'])) return;
    entries = [];
    saveEntries();
    displayEntries();
    if (typeof resetIdleTimer === 'function') resetIdleTimer();
  });

  safeAddListener('exportBtn', 'click', () => {
    if (!Array.isArray(entries) || entries.length === 0) { alert(translations['exportEmpty']); return; }
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wetin_dey_sup_gist.json';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof resetIdleTimer === 'function') resetIdleTimer();
  });

  safeAddListener('lockNowBtn', 'click', () => { lockJournal(); });

  safeAddListener('changePasscodeBtn', 'click', () => { showSetPasscodeScreen(); });

  const filterEl = document.getElementById('filterMood');
  if (filterEl) filterEl.addEventListener('change', e => displayEntries(e.target.value));

  // hamburger/sidebar
  if (hamburger && sidebar && sidebarOverlay) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    });
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.style.display = 'none';
    });
  }

  // theme toggle
  const savedTheme = localStorage.getItem('wetinTheme') || 'dark';
  applyTheme(savedTheme);
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('wetinTheme', newTheme);
  });

  // language select / buttons
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      console.log('Language select changed to:', e.target.value);
      loadLanguage(e.target.value);
    });
  }
  attachLanguageButtons();

  // voice button
  if (recordBtn) recordBtn.addEventListener('click', (ev) => { ev.preventDefault(); toggleRecording(); });
  if (saveVoiceBtn) saveVoiceBtn.addEventListener('click', saveVoiceNote);

  // Auth event listeners
  if (googleSignInBtn) googleSignInBtn.addEventListener('click', handleGoogleSignIn);
  if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);

  // Search and filter event listeners
  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keyup', performSearch);
  }
  if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
  if (filterMood) filterMood.addEventListener('change', performSearch);

  // Edit modal event listeners
  if (editForm) editForm.addEventListener('submit', (e) => { e.preventDefault(); saveEditedEntry(); });
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
  if (editEntryModal) {
    editEntryModal.addEventListener('click', (e) => {
      if (e.target === editEntryModal) closeEditModal();
    });
  }

  // Initialize data migration
  migrateData();

  // Initialize authentication
  initializeAuth();

  // initial render
  displayEntries(document.getElementById('filterMood') ? document.getElementById('filterMood').value : 'all');
});

// ---------------------- Theme helper ----------------------
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  }
}

// ---------------------- Service worker registration (safe) ----------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker?.register('service-worker.js').catch(() => {});
  });
}

// ---------------------- Simple unique-tracking (non-blocking) ----------------------
(function trackUniqueUser() {
  // minimal non-blocking beacon - optional endpoint; keep no-op if not configured
  try {
    // example: navigator.sendBeacon('/api/track-user', JSON.stringify({ ts: Date.now() }));
  } catch (e) {}
})();


let entries = JSON.parse(localStorage.getItem('wetinEntries')) || [];
// Replace quotes array with translation keys
const quotes = [
  'quote1',
  'quote2',
  'quote3',
  'quote4',
  'quote5'
];

let editingIndex = null; // Track which gist is being edited

export function showQuote() {
  const entriesDiv = document.getElementById('entries');
  const lang = localStorage.getItem('wetinLang') || 'en';
  fetch('translations.json').then(res => res.json()).then(data => {
    const translations = data[lang];
    const randomKey = quotes[Math.floor(Math.random() * quotes.length)];
    entriesDiv.innerHTML = `<p>${translations[randomKey]}</p>`;
  });
}

export function showFullEntry(entry, idx) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const content = document.createElement('div');
  content.className = 'full-entry-modal';
  const lang = localStorage.getItem('wetinLang') || 'en';
  fetch('translations.json').then(res => res.json()).then(data => {
    const translations = data[lang];
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin-top:0;">${translations['moodLabel']}: ${entry.mood}</h3>
        <button class="editGistBtn" title="${translations['editTooltip']}" style="margin-left:1em;">${translations['editBtn']}</button>
      </div>
      <p style="white-space: pre-wrap; word-wrap: break-word;">${entry.text}</p>
      <small>${entry.date}</small>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.5em;">
        <button id="closeModalBtn" class="modal-close-btn">${translations['closeBtn']}</button>
        <button class="deleteGistBtn" title="${translations['deleteTooltip']}">${translations['deleteBtn']}</button>
      </div>
    `;
  });
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Edit button in modal
  content.querySelector('.editGistBtn').onclick = () => {
    document.getElementById('mood').value = entry.mood;
    document.getElementById('thoughts').value = entry.text;
    editingIndex = idx;
    overlay.remove();
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  // Delete button in modal with confirmation
  content.querySelector('.deleteGistBtn').onclick = () => {
    if (confirm(translations['deleteGistConfirm'])) {
      entries.splice(idx, 1);
      saveEntries();
      displayEntries();
      overlay.remove();
    }
  };

  // Close button
  document.getElementById('closeModalBtn').onclick = () => overlay.remove();

  // Close modal when clicking outside
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
}

export function displayEntries(filterMood = 'all') {
  const entriesDiv = document.getElementById('entries');
  if (entries.length === 0) {
    showQuote();
    return;
  }
  let filtered = entries;
  if (filterMood !== 'all') {
    filtered = entries.filter(e => e.mood === filterMood);
  }
  if (filtered.length === 0) {
    entriesDiv.innerHTML = `<p>${translations['noGistYet']}</p>`;
    return;
  }
  entriesDiv.innerHTML = filtered
    .map(
      (entry, idx) =>
        `<div class="entry" style="padding:10px; margin-bottom:10px; border-radius:8px; cursor:pointer;" data-idx="${idx}">
          <strong>${entry.mood}</strong> — <small>${entry.date}</small><br>
          <span>${entry.text.length > 50 ? entry.text.slice(0, 50) + '...' : entry.text}</span>
        </div>`
    )
    .join('');
  document.querySelectorAll('.entry').forEach((el, i) => {
    el.addEventListener('click', () => {
      showFullEntry(filtered[i], entries.indexOf(filtered[i]));
    });
  });
}

export function saveEntries() {
  localStorage.setItem('wetinEntries', JSON.stringify(entries));
}

export function clearEntries() {
  entries = [];
  saveEntries();
  displayEntries();
}

export function addEntry(entry) {
  if (editingIndex !== null && entries[editingIndex]) {
    // Update existing entry
    entries[editingIndex] = {
      ...entries[editingIndex],
      mood: entry.mood,
      text: entry.text,
      date: new Date().toLocaleString()
    };
    editingIndex = null;
  } else {
    // Add new entry
    entries.unshift({
      ...entry,
      date: new Date().toLocaleString()
    });
  }
  saveEntries();
  displayEntries();
}

export function getEntries() {
  return entries;
}

export function setEntries(newEntries) {
  entries = newEntries;
  saveEntries();
}
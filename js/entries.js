let entries = JSON.parse(localStorage.getItem('wetinEntries')) || [];
const quotes = [
  "No forget say even Mad person dey rest sometimes! No go use work kill yourself ",
  "You strong pass this wahala 💪",
  "Na small small, e go better 🌱",
  "Talk your mind, body no be firewood 🧘",
  "Abeg no lock up, drop your gist 📝"
];

let editingIndex = null; // Track which gist is being edited

export function showQuote() {
  const entriesDiv = document.getElementById('entries');
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  entriesDiv.innerHTML = `<p>${randomQuote}</p>`;
}

export function showFullEntry(entry, idx) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const content = document.createElement('div');
  content.className = 'full-entry-modal';
  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin-top:0;">Mood: ${entry.mood}</h3>
      <button class="editGistBtn" title="Edit" style="margin-left:1em;">Edit</button>
    </div>
    <p style="white-space: pre-wrap; word-wrap: break-word;">${entry.text}</p>
    <small>${entry.date}</small>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.5em;">
      <button id="closeModalBtn" class="modal-close-btn">Close</button>
      <button class="deleteGistBtn" title="Delete">Delete</button>
    </div>
  `;
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
    if (confirm('Oga open your eyes o, you sure say you wan delete this gist? anno wan hear stories wey dey touch later o')) {
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
    entriesDiv.innerHTML = '<p>You dey nau, abi You put gist for here ?.</p>';
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
export function applyTheme(theme) {
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(theme === 'light' ? 'light-mode' : 'dark-mode');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  }
  localStorage.setItem('wetinTheme', theme);
}

export function initTheme() {
  const savedTheme = localStorage.getItem('wetinTheme') || 'dark';
  applyTheme(savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-mode');
      const newTheme = isLight ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }
}
export function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const menuDrawer = document.getElementById('menuDrawer');

  hamburger.onclick = (e) => {
    e.stopPropagation();
    menuDrawer.classList.toggle('open');
    hamburger.style.display = menuDrawer.classList.contains('open') ? 'none' : 'flex';
  };

  document.body.onclick = (e) => {
    if (
      menuDrawer.classList.contains('open') &&
      !menuDrawer.contains(e.target) &&
      e.target !== hamburger &&
      !hamburger.contains(e.target)
    ) {
      menuDrawer.classList.remove('open');
      hamburger.style.display = 'flex';
    }
  };

  menuDrawer.onclick = (e) => {
    e.stopPropagation();
  };
}
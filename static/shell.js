/* Mobiles Menue der Kopfzeile. Wird von allen Seiten geladen.
   Die Startseite ergaenzt darueber hinaus den Konto-Kasten (mmAccountBox). */
function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu');
  const b = document.getElementById('navBurger');
  if (!m) return;
  const offen = m.classList.toggle('open');
  if (b) b.classList.toggle('open', offen);
  document.body.style.overflow = offen ? 'hidden' : '';
}

function closeMobileMenu() {
  const m = document.getElementById('mobileMenu');
  const b = document.getElementById('navBurger');
  if (m) m.classList.remove('open');
  if (b) b.classList.remove('open');
  document.body.style.overflow = '';
}

// Menue schliesst sich, sobald ein Ziel auf derselben Seite angesprungen wird
document.addEventListener('click', (e) => {
  const a = e.target.closest('.mobile-menu a');
  if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('#')) closeMobileMenu();
});

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


/* Suche in der Kopfzeile. Auf der Startseite setzt sie den Filter des
   Sortiments, von jeder anderen Seite springt sie mit dem Begriff dorthin. */
function suchen(e) {
  e.preventDefault();
  const feld = document.getElementById('navSuche');
  const begriff = (feld && feld.value || '').trim();
  const filter = document.getElementById('filterSearch');
  if (filter) {
    filter.value = begriff;
    if (typeof applyFilters === 'function') applyFilters();
    const ziel = document.querySelector('.section-head') || document.querySelector('.products');
    if (ziel) ziel.scrollIntoView({ behavior: 'smooth' });
  } else {
    location.href = '/?suche=' + encodeURIComponent(begriff) + '#sortiment';
  }
  return false;
}

/* Begriff aus der Adresse uebernehmen, wenn man von einer Unterseite kommt */
document.addEventListener('DOMContentLoaded', function () {
  const begriff = new URLSearchParams(location.search).get('suche');
  if (!begriff) return;
  const feld = document.getElementById('navSuche');
  const filter = document.getElementById('filterSearch');
  if (feld) feld.value = begriff;
  if (filter) {
    filter.value = begriff;
    if (typeof applyFilters === 'function') applyFilters();
  }
});

/* ══════════════════════════════════════════════════════════════════
   PALETTENWAEHLER
   Setzt data-theme am <html>-Element; die Farbwerte selbst stehen in
   shell.css. Hier stehen nur Anzeigename und die drei Vorschaupunkte.
   Die Wahl liegt im localStorage und gilt darum je Geraet.
   ══════════════════════════════════════════════════════════════════ */

const BK_PALETTEN = [
  { schluessel: 'mitternacht', name: 'Mitternachtsblau', punkte: ['#17233f', '#2a3d66', '#c39a4d'] },
  { schluessel: 'marine',      name: 'Marineblau',       punkte: ['#1b3a5f', '#2c5688', '#c8a35a'] },
  { schluessel: 'wald',        name: 'Waldgrün',         punkte: ['#24502f', '#346b3e', '#c39a4d'] },
  { schluessel: 'burgund',     name: 'Burgunder',        punkte: ['#5b1d2a', '#7d2c3c', '#c39a4d'] },
  { schluessel: 'schiefer',    name: 'Schiefer',         punkte: ['#2b3440', '#3e4b5c', '#b9924a'] },
  { schluessel: 'espresso',    name: 'Espresso',         punkte: ['#432b1f', '#61402d', '#c39a4d'] },
];
const BK_PALETTE_STANDARD = 'mitternacht';
const BK_PALETTE_SPEICHER = 'bk_palette';

function bkPaletteBekannt(schluessel) {
  return BK_PALETTEN.some((p) => p.schluessel === schluessel);
}

function bkPaletteAktuell() {
  let gewaehlt = null;
  try { gewaehlt = localStorage.getItem(BK_PALETTE_SPEICHER); } catch (e) { /* Speicher gesperrt */ }
  return bkPaletteBekannt(gewaehlt) ? gewaehlt : BK_PALETTE_STANDARD;
}

/* Das Wortbild traegt die Markenfarbe als feste Flaeche, darum gibt es je
   Palette eine eigene Datei (tools/logos_faerben.py erzeugt sie).
   Getauscht wird nur der Dateiname: so bleibt der Ordner erhalten, egal ob die
   Seite absolut (/static/...) oder relativ ausgeliefert wird (Vorschau auf
   GitHub Pages liegt in einem Unterordner). */
function bkLogosTauschen(schluessel) {
  document.querySelectorAll('img[data-logo]').forEach((bild) => {
    const rolle = bild.getAttribute('data-logo');
    const teile = (bild.getAttribute('src') || '').split('?v=');
    const ordner = teile[0].slice(0, teile[0].lastIndexOf('/') + 1);
    if (!ordner) return;
    bild.setAttribute('src',
      ordner + rolle + '-' + schluessel + '.svg' + (teile[1] ? '?v=' + teile[1] : ''));
  });
}

function bkPaletteAnwenden(schluessel, merken) {
  if (!bkPaletteBekannt(schluessel)) schluessel = BK_PALETTE_STANDARD;
  document.documentElement.setAttribute('data-theme', schluessel);
  bkLogosTauschen(schluessel);

  // Adressleiste mobiler Browser mitfaerben
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const farbe = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    if (farbe) meta.setAttribute('content', farbe);
  }
  if (merken) {
    try { localStorage.setItem(BK_PALETTE_SPEICHER, schluessel); } catch (e) { /* Speicher gesperrt */ }
  }
  bkPaletteMenueAktualisieren(schluessel);
}

function bkPaletteMenueAktualisieren(schluessel) {
  document.querySelectorAll('.palette-item').forEach((knopf) => {
    knopf.setAttribute('aria-checked', String(knopf.dataset.palette === schluessel));
  });
  const punkte = (BK_PALETTEN.find((p) => p.schluessel === schluessel) || BK_PALETTEN[0]).punkte;
  const anzeige = document.querySelector('.palette-toggle .palette-dots');
  if (anzeige) anzeige.innerHTML = bkPunkteHtml(punkte);
}

function bkPunkteHtml(punkte) {
  return punkte.map((f) => '<i style="background:' + f + '"></i>').join('');
}

function bkPaletteMenueOeffnen(offen) {
  const menue = document.getElementById('paletteMenu');
  const knopf = document.getElementById('paletteToggle');
  if (!menue || !knopf) return;
  menue.hidden = !offen;
  knopf.setAttribute('aria-expanded', String(offen));
}

function bkPaletteAufbauen() {
  const liste = document.getElementById('paletteList');
  const knopf = document.getElementById('paletteToggle');
  if (!liste || !knopf) return;

  liste.innerHTML = BK_PALETTEN.map((p) =>
    '<button type="button" class="palette-item" role="radio" aria-checked="false" ' +
    'data-palette="' + p.schluessel + '">' +
    '<span class="palette-dots">' + bkPunkteHtml(p.punkte) + '</span>' +
    '<span class="name">' + p.name + '</span></button>').join('');

  liste.addEventListener('click', (e) => {
    const ziel = e.target.closest('.palette-item');
    if (!ziel) return;
    bkPaletteAnwenden(ziel.dataset.palette, true);
    bkPaletteMenueOeffnen(false);
  });

  knopf.addEventListener('click', (e) => {
    e.stopPropagation();
    bkPaletteMenueOeffnen(document.getElementById('paletteMenu').hidden);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.palette-picker')) bkPaletteMenueOeffnen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') bkPaletteMenueOeffnen(false);
  });

  bkPaletteAnwenden(bkPaletteAktuell(), false);
}

document.addEventListener('DOMContentLoaded', bkPaletteAufbauen);

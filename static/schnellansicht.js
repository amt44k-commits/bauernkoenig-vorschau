/* ══════════════════════════════════════════════════════════════════
   SCHNELLANSICHT
   Klick auf eine Produktkarte oeffnet ein Fenster statt die Seite zu
   wechseln. Von Startseite und Sortiment genutzt.

   Die Produktseite bleibt daneben bestehen: die Pflichtangaben nach
   Lebensmittelinformationsverordnung muessen verlinkbar sein, und ein
   Fenster kann man niemandem schicken. Mittelklick, Strg-Klick und
   "in neuem Tab oeffnen" gehen deshalb weiter auf die Seite.
   ══════════════════════════════════════════════════════════════════ */

var saAktiv = null;      // Produkt im Fenster
var saGramm = null;      // gewaehlte Menge
var saVorherFokus = null;

function saProdukt(id) {
  var liste = window.products || [];
  for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
  return null;
}

function saEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (z) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z];
  });
}

function saGrammStufen() {
  return (window.GRAMM_OPTIONEN && window.GRAMM_OPTIONEN.length)
    ? window.GRAMM_OPTIONEN : [100, 200, 300, 500];
}

function schnellansichtOeffnen(id) {
  var p = saProdukt(id);
  if (!p) { location.href = '/bauernkoenig-vorschau/produkt/' + id + '/'; return; }
  saAktiv = p;
  var nachGewicht = /100\s*g/i.test(p.unit || '');
  saGramm = nachGewicht ? saGrammStufen()[0] : null;

  var kat = (window.KATEGORIEN || {})[p.cat] || {};
  var stufen = nachGewicht ? saGrammStufen().map(function (g, i) {
    return '<button type="button" class="sa-menge' + (i === 0 ? ' aktiv' : '') + '"'
      + ' data-gramm="' + g + '" onclick="saMenge(this)">' + g + ' g</button>';
  }).join('') : '';

  var angaben = [
    ['Bezeichnung', p.verkehrsbezeichnung || p.name],
    ['Zutaten', p.zutaten],
    ['Allergene', p.allergene],
    ['Nettofüllmenge', p.netto_g ? p.netto_g + ' g' : p.unit],
    ['Herkunft', p.herkunft],
    ['Lagerung', p.lagerung]
  ].filter(function (z) { return z[1]; })
    .map(function (z) {
      return '<div><dt>' + saEsc(z[0]) + '</dt><dd>' + saEsc(z[1]) + '</dd></div>';
    }).join('');

  var merkmale = (p.details || []).length
    ? '<ul class="sa-merkmale">' + p.details.map(function (d) {
        return '<li>' + saEsc(d) + '</li>'; }).join('') + '</ul>'
    : '';

  document.getElementById('saInhalt').innerHTML =
    '<div class="sa-bild">' + (p.img
      ? '<img src="' + saEsc(p.img) + '" alt="' + saEsc(p.name) + '">' : '') +
      '<span class="karte-chip"><svg class="ico"><use href="#ic-'
        + saEsc(kat.icon || 'box') + '"/></svg>' + saEsc(kat.label || p.cat) + '</span>' +
      (p.badge ? '<span class="karte-badge">' + saEsc(p.badge) + '</span>' : '') +
    '</div>' +
    '<div class="sa-text">' +
      '<h2 id="saName">' + saEsc(p.name) + '</h2>' +
      '<p class="sa-kurz">' + saEsc(p.desc) + '</p>' +
      '<div class="sa-preisblock">' +
        '<span class="sa-preis" id="saPreis">' + eurBk(p.price) + '</span>' +
        (p.grundpreis ? '<span class="sa-grund">' + eurBk(p.grundpreis) + ' / kg</span>' : '') +
        '<span class="sa-mwst">inkl. MwSt., zuzüglich Versand</span>' +
      '</div>' +
      (stufen ? '<div class="sa-mengen"><span class="sa-label">Menge</span><div>' + stufen + '</div></div>' : '') +
      '<div class="sa-lager' + (p.stock > 0 ? '' : ' leer') + '">'
        + (p.stock > 0 ? 'Auf Lager, sofort versandfertig' : 'Derzeit vergriffen') + '</div>' +
      '<div class="sa-aktionen">' +
        (p.stock > 0
          ? '<button type="button" class="btn btn-voll" onclick="saKaufen()">'
            + '<svg class="ico"><use href="#ic-cart"/></svg>In den Warenkorb</button>'
          : '<button type="button" class="btn btn-voll" disabled>Derzeit vergriffen</button>') +
        '<a class="btn btn-rand" href="/bauernkoenig-vorschau/produkt/' + p.id + '/">Alle Angaben</a>' +
      '</div>' +
      merkmale +
      (angaben ? '<dl class="sa-angaben">' + angaben + '</dl>'
               : '<p class="sa-hinweis">Die vollständigen Pflichtangaben stehen auf der '
                 + '<a href="/bauernkoenig-vorschau/produkt/' + p.id + '/">Produktseite</a>.</p>') +
    '</div>';

  saVorherFokus = document.activeElement;
  var overlay = document.getElementById('saOverlay');
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  var zu = overlay.querySelector('.sa-zu');
  if (zu) zu.focus();
}

function schnellansichtSchliessen() {
  var overlay = document.getElementById('saOverlay');
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  document.body.style.overflow = '';
  saAktiv = null;
  if (saVorherFokus && saVorherFokus.focus) saVorherFokus.focus();
}

function saMenge(knopf) {
  document.querySelectorAll('.sa-menge').forEach(function (b) { b.classList.remove('aktiv'); });
  knopf.classList.add('aktiv');
  saGramm = parseInt(knopf.dataset.gramm, 10);
  var feld = document.getElementById('saPreis');
  if (feld && saAktiv) feld.textContent = eurBk(Math.round(saAktiv.price * saGramm) / 100);
}

function saKaufen() {
  if (!saAktiv) return;
  addToCart(saAktiv.id, saGramm);
  schnellansichtSchliessen();
}

document.addEventListener('DOMContentLoaded', function () {
  // Klick auf eine Karte faengt das Fenster ab. Mittelklick, Strg-Klick und
  // das Kontextmenue bleiben unberuehrt, damit man die Seite weiterhin in
  // einem neuen Tab oeffnen und den Verweis kopieren kann.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Nicht auf den Anfang der Adresse pruefen: in der statischen Vorschau
    // tragen alle Verweise ein Praefix (/bauernkoenig-vorschau/produkt/3/).
    var a = e.target.closest('a[href*="/produkt/"]');
    if (!a) return;
    // In der Warenkorbschublade und auf der Kasse fuehrt der Verweis weiter
    // zur Seite: dort stoert ein Fenster ueber dem Fenster.
    if (e.target.closest('.drawer, .ka-posten')) return;
    var treffer = /\/produkt\/(\d+)\/?$/.exec(a.getAttribute('href') || '');
    var id = treffer ? parseInt(treffer[1], 10) : 0;
    if (!id || !saProdukt(id)) return;
    e.preventDefault();
    schnellansichtOeffnen(id);
  });

  var overlay = document.getElementById('saOverlay');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) schnellansichtSchliessen();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') schnellansichtSchliessen();
  });
});

/* ══════════════════════════════════════════════════════════════════
   PRODUKTFENSTER
   Aufbau unveraendert aus der alten HTML-Fassung (Stand vor dem
   Seiten-Umbau). Klick auf eine Produktkarte oeffnet das Fenster,
   statt die Seite zu wechseln.

   Die eigene Produktseite bleibt daneben bestehen und ist aus dem
   Fenster heraus verlinkt: die Pflichtangaben nach LMIV muessen
   verlinkbar sein, und Suchmaschinen sehen ein Fenster nicht.
   Mittelklick und Strg-Klick auf die Karte oeffnen deshalb weiter
   die Seite.
   ══════════════════════════════════════════════════════════════════ */

var pdProduct = null;
var pdSelectedGrams = null;

function pdFinden(id) {
  var liste = window.products || [];
  for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
  return null;
}

function pdEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (z) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z];
  });
}

function pdKatSymbol(c) {
  var k = ((window.KATEGORIEN || {})[c] || {}).icon || 'box';
  return '<svg class="ico"><use href="#ic-' + k + '"/></svg>';
}

function pdKatName(c) {
  return ((window.KATEGORIEN || {})[c] || {}).label || c;
}

/* Grundpreis je Kilogramm. Pflicht, sobald nach Gewicht verkauft wird. */
function grundpreisText(p) {
  if (!p || !p.grundpreis) return '';
  return eurBk(p.grundpreis) + ' / kg';
}

/* Pflichtangaben nach Lebensmittelinformationsverordnung. Unveraendert
   aus der alten Fassung: die Zeilen erscheinen nur, wenn der Betrieb sie
   gepflegt hat, der Widerrufshinweis immer. */
function pflichtangabenHTML(p) {
  var zeilen = [];
  if (p.verkehrsbezeichnung) zeilen.push(['Bezeichnung', pdEsc(p.verkehrsbezeichnung)]);
  if (p.zutaten) zeilen.push(['Zutaten', pdEsc(p.zutaten)]);
  if (p.allergene) zeilen.push(['Allergene', '<strong>' + pdEsc(p.allergene) + '</strong>']);
  if (p.netto_g) zeilen.push(['Nettofüllmenge', p.netto_g >= 1000
    ? (p.netto_g / 1000).toFixed(2).replace('.', ',') + ' kg' : p.netto_g + ' g']);
  if (p.herkunft) zeilen.push(['Herkunft', pdEsc(p.herkunft)]);
  if (p.lagerung) zeilen.push(['Aufbewahrung', pdEsc(p.lagerung)]);
  if (p.hersteller) zeilen.push(['Hersteller', pdEsc(p.hersteller)]);
  if (p.alkohol_vol) zeilen.push(['Alkoholgehalt', pdEsc(p.alkohol_vol) + ' % vol']);

  var nw = p.naehrwerte || {};
  var nwZeilen = Object.keys(nw).length
    ? '<table class="pd-nw"><caption>Durchschnittliche Nährwerte je 100 g</caption><tbody>'
      + Object.keys(nw).map(function (k) {
          return '<tr><td>' + pdEsc(k) + '</td><td>' + pdEsc(nw[k]) + '</td></tr>'; }).join('')
      + '</tbody></table>'
    : '';

  var widerruf = p.verderblich
    ? '<p class="pd-widerruf">Frischware: Vom Widerrufsrecht ausgenommen, weil sie schnell '
      + 'verderben kann. Näheres in der <a href="/bauernkoenig-vorschau/widerruf/">Widerrufsbelehrung</a>.</p>'
    : '<p class="pd-widerruf">Für dieses Produkt gilt das gesetzliche Widerrufsrecht von '
      + '14 Tagen. Näheres in der <a href="/bauernkoenig-vorschau/widerruf/">Widerrufsbelehrung</a>.</p>';

  if (!zeilen.length && !nwZeilen) return '<div class="pd-pflicht">' + widerruf + '</div>';
  return '<div class="pd-pflicht">'
    + '<div class="pd-details-title">Produktinformationen</div>'
    + '<dl class="pd-pflicht-liste">'
    + zeilen.map(function (z) { return '<dt>' + z[0] + '</dt><dd>' + z[1] + '</dd>'; }).join('')
    + '</dl>' + nwZeilen + widerruf + '</div>';
}

function openDetail(id) {
  var p = pdFinden(id);
  if (!p) { location.href = '/bauernkoenig-vorschau/produkt/' + id + '/'; return; }
  pdProduct = p;

  var per100 = /100\s*g/i.test(p.unit || '');
  var stufen = (window.GRAMM_OPTIONEN && window.GRAMM_OPTIONEN.length)
    ? window.GRAMM_OPTIONEN : [100, 200, 300, 500];
  pdSelectedGrams = per100 ? stufen[0] : null;

  var stockMsg = p.stock <= 0 ? 'Derzeit vergriffen'
    : (p.stock <= 5 ? 'Nur noch ' + p.stock : p.stock + ' auf Lager');

  var weightHtml = per100 ? '<div class="pd-weight">'
    + '<span class="pd-weight-label">Menge wählen</span>'
    + '<div class="pd-weight-opts" id="pdWeightOpts">'
    + stufen.map(function (g, idx) {
        return '<button class="pd-weight-btn' + (idx === 0 ? ' active' : '') + '"'
          + ' data-g="' + g + '" onclick="selectWeight(' + g + ',this,' + p.price + ')">'
          + g + ' g</button>'; }).join('')
    + '</div></div>' : '';

  var verwandt = (window.products || []).filter(function (x) {
    return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
  var relatedHtml = verwandt.length ? '<div class="pd-related">'
    + '<div class="pd-related-title">Passt dazu</div>'
    + '<div class="pd-related-row">' + verwandt.map(function (r) {
        return '<div class="pd-rel-card" onclick="openDetail(' + r.id + ')">'
          + '<div class="pd-rel-img">' + (r.img ? '<img src="' + pdEsc(r.img) + '" alt="'
            + pdEsc(r.name) + '">' : '') + '</div>'
          + '<div class="pd-rel-info"><div class="pd-rel-name">' + pdEsc(r.name) + '</div>'
          + '<div class="pd-rel-price">' + eurBk(r.price) + '</div></div></div>'; }).join('')
    + '</div></div>' : '';

  document.getElementById('pdModal').innerHTML =
    '<div class="pd-head"><span class="pd-breadcrumb">' + pdKatSymbol(p.cat) + ' '
      + pdEsc(pdKatName(p.cat)) + ' <span>/ ' + pdEsc(p.name) + '</span></span>'
      + '<button class="close-btn" onclick="closeDetail()" aria-label="Schließen">&#10005;</button></div>'
    + '<div class="pd-body">'
      + '<div class="pd-gallery">'
        + '<div class="pd-main-img" id="pdMainImg">'
        + (p.img ? '<img src="' + pdEsc(p.img) + '" alt="' + pdEsc(p.name) + '">' : '')
        + '</div>'
      + '</div>'
      + '<div class="pd-info">'
        + '<div class="pd-badge-row">'
        + (p.badge ? '<span class="pd-badge ' + (p.cat === 'kaese' ? '' : 'gold') + '">'
            + pdEsc(p.badge) + '</span>' : '')
        + '<span class="pd-category">' + pdKatSymbol(p.cat) + ' ' + pdEsc(pdKatName(p.cat))
        + '</span></div>'
        + '<h2 class="pd-name">' + pdEsc(p.name) + '</h2>'
        + '<div class="pd-price" id="pdPrice">' + eurBk(p.price) + '</div>'
        + '<div class="pd-unit">' + pdEsc(p.unit)
          + (p.grundpreis ? ' &middot; <span id="pdGrundpreis">' + grundpreisText(p) + '</span>' : '')
        + '</div>'
        + '<div class="pd-mwst">inkl. MwSt., zuzüglich <a href="/bauernkoenig-vorschau/versand/">Versand</a></div>'
        + '<div class="pd-stock' + (p.stock <= 5 ? ' low' : '') + '">' + stockMsg + '</div>'
        + '<p class="pd-desc">' + pdEsc(p.desc) + '</p>'
        + weightHtml
        + '<div class="pd-actions">'
          + (p.stock > 0
            ? '<button class="pd-add-btn" onclick="addToCart(' + p.id
              + ',pdSelectedGrams);closeDetail()">+ In den Warenkorb</button>'
            : '<button class="pd-add-btn" disabled>Derzeit vergriffen</button>')
        + '</div>'
        + '<p class="pd-seite">Alle Angaben auf der '
          + '<a href="/bauernkoenig-vorschau/produkt/' + p.id + '/">Produktseite</a></p>'
        + ((p.details || []).length ? '<div class="pd-details">'
            + '<div class="pd-details-title">Details</div><ul class="pd-details-list">'
            + p.details.map(function (d) { return '<li>' + pdEsc(d) + '</li>'; }).join('')
            + '</ul></div>' : '')
        + pflichtangabenHTML(p)
      + '</div>'
      + relatedHtml
    + '</div>';

  var overlay = document.getElementById('pdOverlay');
  overlay.classList.add('open');
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  var overlay = document.getElementById('pdOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  pdProduct = null;
}

function handlePdOverlayClick(e) {
  if (e.target === document.getElementById('pdOverlay')) closeDetail();
}

function selectWeight(g, btn, base) {
  pdSelectedGrams = g;
  document.querySelectorAll('#pdWeightOpts .pd-weight-btn').forEach(function (b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  document.getElementById('pdPrice').textContent = eurBk(base * g / 100);
}

document.addEventListener('DOMContentLoaded', function () {
  // Klick auf eine Karte oeffnet das Fenster. Mittelklick, Strg-Klick und das
  // Kontextmenue bleiben unberuehrt, damit die Seite weiter in einem neuen Tab
  // geoeffnet und der Verweis kopiert werden kann.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey
        || e.shiftKey || e.altKey) return;
    // Nicht auf den Anfang der Adresse pruefen: in der statischen Vorschau
    // tragen alle Verweise ein Praefix (/bauernkoenig-vorschau/produkt/3/).
    var a = e.target.closest('a[href*="/produkt/"]');
    if (!a) return;
    // In der Warenkorbschublade, auf der Kasse und im Fenster selbst fuehrt
    // der Verweis weiter zur Seite.
    if (e.target.closest('.drawer, .ka-posten, .pd-overlay')) return;
    var treffer = /\/produkt\/(\d+)\/?$/.exec(a.getAttribute('href') || '');
    var id = treffer ? parseInt(treffer[1], 10) : 0;
    if (!id || !pdFinden(id)) return;
    e.preventDefault();
    openDetail(id);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDetail();
  });
});

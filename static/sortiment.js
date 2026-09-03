/* ══════════════════════════════════════════════════════════════════
   SORTIMENTSSEITE: Suche, Kategorie, Sortierung, Nachladen

   Die Karten stehen fertig im HTML (serverseitig gebaut, damit sie
   auch ohne JavaScript und fuer Suchmaschinen da sind). Hier werden
   sie nur ein- und ausgeblendet und umsortiert.
   ══════════════════════════════════════════════════════════════════ */

/* Wie viele Artikel auf einmal sichtbar sind: fuenf volle Zeilen. Die Zahl
   haengt an der Spaltenzahl, sonst bleibt in der letzten Zeile eine Luecke,
   sobald das Fenster nicht gerade fuenf Spalten hergibt. */
var ZEILEN = 5;
var SEITE = 25;
var gezeigt = SEITE;

function seitengroesse() {
    var raster = document.getElementById('raster');
    if (!raster) return 25;
    var spalten = getComputedStyle(raster).gridTemplateColumns
        .split(' ').filter(function (x) { return parseFloat(x) > 0; }).length;
    return Math.max(spalten, 1) * ZEILEN;
}
var karten = [];
var stand = { suche: '', cat: 'all', sort: '' };

document.addEventListener('DOMContentLoaded', function () {
  karten = Array.prototype.slice.call(document.querySelectorAll('#raster .ware'));
  SEITE = seitengroesse();
  gezeigt = SEITE;

  // Beim Ändern der Fensterbreite ändert sich die Spaltenzahl mit.
  var uhr;
  window.addEventListener('resize', function () {
    clearTimeout(uhr);
    uhr = setTimeout(function () {
      var neu = seitengroesse();
      if (neu === SEITE) return;
      // Bereits nachgeladene Zeilen behalten, nur auf volle Zeilen runden.
      var zeilen = Math.max(1, Math.round(gezeigt / SEITE));
      SEITE = neu;
      gezeigt = SEITE * zeilen;
      anwenden();
    }, 180);
  });

  var suchfeld = document.getElementById('filterSearch');
  var sortfeld = document.getElementById('filterSort');

  // Vorgaben aus der Adresse: /sortiment?kategorie=kaese&suche=speck
  var param = new URLSearchParams(location.search);
  var vorgabeKat = param.get('kategorie');
  var vorgabeSuche = param.get('suche');
  if (vorgabeSuche) { stand.suche = vorgabeSuche.toLowerCase(); if (suchfeld) suchfeld.value = vorgabeSuche; }
  if (vorgabeKat) {
    var chip = document.querySelector('.tab[data-cat="' + CSS.escape(vorgabeKat) + '"]');
    if (chip) { stand.cat = vorgabeKat; chipMarkieren(chip); }
  }

  document.querySelectorAll('.tab').forEach(function (c) {
    c.addEventListener('click', function () {
      stand.cat = c.dataset.cat;
      chipMarkieren(c);
      gezeigt = SEITE;
      anwenden();
    });
  });

  if (suchfeld) {
    suchfeld.addEventListener('input', function () {
      stand.suche = suchfeld.value.trim().toLowerCase();
      gezeigt = SEITE;
      anwenden();
    });
  }
  if (sortfeld) {
    sortfeld.addEventListener('change', function () {
      stand.sort = sortfeld.value;
      anwenden();
    });
  }
  var mehr = document.getElementById('mehrKnopf');
  if (mehr) mehr.addEventListener('click', function () { gezeigt += SEITE; anwenden(); });

  anwenden();
});

function chipMarkieren(aktiv) {
  document.querySelectorAll('.tab').forEach(function (c) {
    c.classList.toggle('aktiv', c === aktiv);
  });
}

function filterZuruecksetzen() {
  stand = { suche: '', cat: 'all', sort: '' };
  var s = document.getElementById('filterSearch'); if (s) s.value = '';
  var o = document.getElementById('filterSort'); if (o) o.value = '';
  var alle = document.querySelector('.tab[data-cat="all"]');
  if (alle) chipMarkieren(alle);
  gezeigt = SEITE;
  anwenden();
}

function passt(k) {
  if (stand.cat !== 'all' && k.dataset.cat !== stand.cat) return false;
  if (stand.suche && k.dataset.text.indexOf(stand.suche) === -1) return false;
  return true;
}

function anwenden() {
  var treffer = karten.filter(passt);

  // Sortierung ueber die Reihenfolge im Raster, ohne die Karten neu zu bauen.
  if (stand.sort === 'preis-auf') {
    treffer.sort(function (a, b) { return a.dataset.preis - b.dataset.preis; });
  } else if (stand.sort === 'preis-ab') {
    treffer.sort(function (a, b) { return b.dataset.preis - a.dataset.preis; });
  } else if (stand.sort === 'name') {
    treffer.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name, 'de'); });
  }

  karten.forEach(function (k) { k.hidden = true; k.style.order = ''; });
  treffer.slice(0, gezeigt).forEach(function (k, i) {
    k.hidden = false;
    k.style.order = i;
  });

  var zahl = document.getElementById('trefferZahl');
  if (zahl) zahl.textContent = treffer.length;

  var leer = document.getElementById('keineTreffer');
  if (leer) leer.hidden = treffer.length > 0;

  var bereich = document.getElementById('mehrBereich');
  var knopf = document.getElementById('mehrKnopf');
  var text = document.getElementById('mehrText');
  var sichtbar = Math.min(gezeigt, treffer.length);
  if (bereich) bereich.hidden = treffer.length === 0;
  if (knopf) knopf.hidden = sichtbar >= treffer.length;
  if (text) {
    text.textContent = treffer.length
      ? sichtbar + ' von ' + treffer.length + ' Artikeln angezeigt'
      : '';
  }
}

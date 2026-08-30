/* ══════════════════════════════════════════════════════════════════
   PRODUKTFENSTER
   Klick auf Bild oder Titel oeffnet ein Fenster wie im echten Shop.
   Bei Ware nach Gewicht sind 100 g, 250 g, 500 g und 1 kg waehlbar,
   der Preis rechnet mit. Bestellen geht hier nicht, der Entwurf sagt
   das beim Klick.
   Die Produktdaten stehen als BK_PRODUKTE im Seitenkopf.
   ══════════════════════════════════════════════════════════════════ */

(function () {
  var MENGEN = [100, 250, 500, 1000];
  var offen = null;      // gerade gezeigtes Produkt
  var menge = null;      // gewaehlte Menge in Gramm

  function euro(cent) {
    return '€ ' + (cent / 100).toFixed(2).replace('.', ',');
  }

  function jeKilo(p) {
    if (!p.netto) return '';
    return '€ ' + ((p.preis * 1000 / p.netto) / 100).toFixed(2).replace('.', ',') + ' / kg';
  }

  function mengeBeschriften(g) {
    return g >= 1000 ? (g / 1000) + ' kg' : g + ' g';
  }

  function preisFuer(p, gramm) {
    if (!p.netto || !gramm) return p.preis;
    return Math.round(p.preis * gramm / p.netto);
  }

  function symbol(name) {
    return '<svg aria-hidden="true"><use href="#ic-' + name + '"/></svg>';
  }

  function lagerZeile(p) {
    if (p.lager === 0) return '<div class="pd-lager aus">Ausverkauft</div>';
    if (p.lager <= 5) return '<div class="pd-lager knapp">Nur noch ' + p.lager + ' Stück</div>';
    return '<div class="pd-lager">Auf Lager</div>';
  }

  function pflichtangaben(p) {
    var zeilen = '';
    if (p.herkunft) zeilen += '<dt>Herkunft</dt><dd>' + p.herkunft + '</dd>';
    if (p.zutaten) zeilen += '<dt>Zutaten</dt><dd>' + p.zutaten + '</dd>';
    if (p.allergene) zeilen += '<dt>Allergene</dt><dd>' + p.allergene + '</dd>';
    if (p.lagerung) zeilen += '<dt>Lagerung</dt><dd>' + p.lagerung + '</dd>';
    return zeilen ? '<dl class="pd-pflicht">' + zeilen + '</dl>' : '';
  }

  function mengenwahl(p) {
    if (!p.netto) return '';
    var knoepfe = MENGEN.map(function (g, i) {
      return '<button type="button" class="pd-menge-knopf' + (i === 0 ? ' aktiv' : '') +
             '" data-g="' + g + '">' + mengeBeschriften(g) + '</button>';
    }).join('');
    return '<div class="pd-menge"><div class="pd-menge-titel">Menge wählen</div>' +
           '<div class="pd-menge-reihe" id="pdMengen">' + knoepfe + '</div></div>';
  }

  function zeichnen(p) {
    menge = p.netto ? MENGEN[0] : null;
    var grund = jeKilo(p);
    return '' +
      '<div class="pd-kopf">' +
        '<span class="pd-pfad">' + symbol(p.symbol) + p.kategorie +
          ' <b>/ ' + p.name + '</b></span>' +
        '<button type="button" class="pd-zu" aria-label="Schließen">✕</button>' +
      '</div>' +
      '<div class="pd-koerper">' +
        '<div class="pd-bild"><img src="' + p.bild + '" alt="' + p.name + '"></div>' +
        '<div class="pd-angaben">' +
          '<h2 class="pd-name">' + p.name + '</h2>' +
          '<div class="pd-preis" id="pdPreis">' + euro(preisFuer(p, menge)) + '</div>' +
          '<div class="pd-einheit" id="pdEinheit">' + p.einheit +
            (grund ? ' · ' + grund : '') + '</div>' +
          '<div class="pd-mwst">inkl. MwSt. zzgl. Versand</div>' +
          lagerZeile(p) +
          '<p class="pd-text">' + p.text + '</p>' +
          mengenwahl(p) +
          '<button type="button" class="pd-korb">+ In den Warenkorb</button>' +
          pflichtangaben(p) +
        '</div>' +
      '</div>';
  }

  function oeffnen(index) {
    var p = (window.BK_PRODUKTE || [])[index];
    if (!p) return;
    offen = p;
    var overlay = document.getElementById('pdOverlay');
    overlay.querySelector('.pd-fenster').innerHTML = zeichnen(p);
    overlay.classList.add('offen');
    document.body.style.overflow = 'hidden';
  }

  function schliessen() {
    var overlay = document.getElementById('pdOverlay');
    if (overlay) overlay.classList.remove('offen');
    document.body.style.overflow = '';
    offen = null;
  }

  function mengeWaehlen(knopf) {
    menge = parseInt(knopf.dataset.g, 10);
    document.querySelectorAll('#pdMengen .pd-menge-knopf').forEach(function (k) {
      k.classList.toggle('aktiv', k === knopf);
    });
    var preis = document.getElementById('pdPreis');
    if (preis && offen) preis.textContent = euro(preisFuer(offen, menge));
    var einheit = document.getElementById('pdEinheit');
    if (einheit && offen) {
      var grund = jeKilo(offen);
      einheit.textContent = mengeBeschriften(menge) + (grund ? ' · ' + grund : '');
    }
  }

  document.addEventListener('click', function (e) {
    var oeffner = e.target.closest('[data-bk-detail]');
    if (oeffner) {
      e.preventDefault();
      oeffnen(parseInt(oeffner.dataset.bkDetail, 10));
      return;
    }
    if (e.target.closest('.pd-zu') || e.target.id === 'pdOverlay') { schliessen(); return; }
    var mengenknopf = e.target.closest('.pd-menge-knopf');
    if (mengenknopf) { mengeWaehlen(mengenknopf); return; }
    if (e.target.closest('.pd-korb')) {
      alert('Das ist ein Entwurf zum Anschauen. Bestellen geht nur im echten Shop.');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') schliessen();
  });
})();

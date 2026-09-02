/* ══════════════════════════════════════════════════════════════════
   KASSE
   Zeigt den Warenkorb aus dem Speicher des Browsers und schickt die
   Bestellung an /api/bestellung. Die Betraege hier sind Anzeige, der
   Server rechnet sie beim Bestellen neu. Weicht etwas ab, gilt der
   Server.
   ══════════════════════════════════════════════════════════════════ */

var rabatt = { code: '', cents: 0 };

document.addEventListener('DOMContentLoaded', function () {
  zeichnen();
  // Wird im Drawer etwas geaendert, rechnet die Kasse mit.
  window.onCartChange = zeichnen;

  document.querySelectorAll('.ka-option input[type=radio]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.querySelectorAll('.ka-option').forEach(function (o) {
        var eigen = o.querySelector('input[type=radio]');
        if (eigen && eigen.name === r.name) o.classList.toggle('gewaehlt', eigen.checked);
      });
    });
  });
});

function centsAusEuro(v) { return Math.round(v * 100); }

function zeichnen() {
  var ziel = document.getElementById('kaPosten');
  if (!ziel) return;

  if (!cart.length) {
    ziel.innerHTML = '<p class="ka-leer">Dein Warenkorb ist leer.' +
      '<a class="btn btn-rand" href="/sortiment">Zum Sortiment</a></p>';
  } else {
    ziel.innerHTML = cart.map(function (i) {
      return '<div class="posten">' +
        '<a class="posten-bild" href="/produkt/' + i.id + '">' +
          (i.img ? '<img src="' + esc(i.img) + '" alt="">' : '') + '</a>' +
        '<div class="posten-mitte">' +
          '<a class="posten-name" href="/produkt/' + i.id + '">' + esc(i.name) + '</a>' +
          '<div class="posten-menge">' + esc(i.unitLabel) + '</div>' +
          (i.grundpreis ? '<div class="posten-grund">' + eurBk(i.grundpreis) + ' / kg</div>' : '') +
          '<div class="posten-steller">' +
            '<button type="button" onclick="changeQty(\'' + i.key + '\',-1)" aria-label="Weniger">' +
              '<svg class="ico"><use href="#ic-minus"/></svg></button>' +
            '<span class="zahl">' + i.qty + '</span>' +
            '<button type="button" onclick="changeQty(\'' + i.key + '\',1)" aria-label="Mehr">' +
              '<svg class="ico"><use href="#ic-plus"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="posten-rechts">' +
          '<span class="posten-preis">' + eurBk(i.price * i.qty) + '</span>' +
          '<button type="button" class="posten-weg" onclick="removeItem(\'' + i.key + '\')">' +
            '<svg class="ico"><use href="#ic-trash"/></svg>Entfernen</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  var zahl = document.getElementById('postenZahl');
  if (zahl) zahl.textContent = cart.length ? cartAnzahl() + ' Artikel' : '';

  rechnen();
}

function rechnen() {
  var zwischen = centsAusEuro(cartTotal());
  var abzug = 0;
  if (rabatt.cents) abzug = Math.min(rabatt.cents, zwischen);
  var versand = (VERSANDFREI_AB && zwischen >= VERSANDFREI_AB) ? 0 : VERSAND_CENTS;
  if (!cart.length) versand = 0;
  var gesamt = Math.max(0, zwischen - abzug) + versand;
  var ust = Math.round(gesamt - gesamt / (1 + UST_SATZ));

  setzen('sumZwischen', eurBk(zwischen / 100));
  setzen('sumVersand', cart.length ? (versand === 0 ? 'kostenfrei' : eurBk(versand / 100)) : '–');
  setzen('versandPreis', cart.length ? (versand === 0 ? 'kostenfrei' : eurBk(versand / 100)) : '–');
  setzen('sumGesamt', eurBk(gesamt / 100));
  setzen('sumUst', eurBk(ust / 100));

  var zeile = document.getElementById('zeileRabatt');
  if (zeile) {
    zeile.hidden = !abzug;
    setzen('rabattCode', rabatt.code);
    setzen('sumRabatt', '−' + eurBk(abzug / 100));
  }
  var knopf = document.getElementById('bestellKnopf');
  if (knopf) knopf.disabled = cart.length === 0;
}

function setzen(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function gutscheinPruefen() {
  var feld = document.getElementById('gutscheinCode');
  var info = document.getElementById('gutscheinInfo');
  var code = (feld.value || '').trim().toUpperCase();
  if (!code) return;
  fetch('/api/gutschein/' + encodeURIComponent(code))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.ok) {
        rabatt = { code: '', cents: 0 };
        zeigeInfo(info, 'Diesen Gutscheincode kennen wir nicht.', false);
      } else {
        var zwischen = centsAusEuro(cartTotal());
        rabatt.code = d.code;
        rabatt.cents = d.type === 'pct' ? Math.round(zwischen * d.value / 100) : d.value;
        zeigeInfo(info, 'Gutschein ' + d.code + ' angerechnet.', true);
      }
      rechnen();
    })
    .catch(function () {
      zeigeInfo(info, 'Der Gutschein konnte gerade nicht geprüft werden.', false);
    });
}

function zeigeInfo(el, text, gut) {
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  el.classList.toggle('gut', !!gut);
}

function fehler(text) {
  var el = document.getElementById('kaFehler');
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
  if (text) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function bestellen(e) {
  e.preventDefault();
  fehler('');
  if (!cart.length) { fehler('Der Warenkorb ist leer.'); return false; }

  var gewaehlt = document.querySelector('.ka-option input[name=zahlung]:checked');
  if (!gewaehlt) { fehler('Bitte eine Zahlungsart wählen.'); return false; }

  var wert = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
  var daten = {
    items: cart.map(function (i) { return { id: i.id, qty: i.qty, grams: i.grams }; }),
    pay: gewaehlt.value,
    voucher: rabatt.code,
    delivery_date: wert('wunschtermin'),
    customer: {
      first_name: wert('fVorname'), last_name: wert('fNachname'),
      email: wert('fMail'), phone: wert('fTel'),
      street: wert('fStrasse'), plz: wert('fPlz'), city: wert('fOrt'),
      country: 'Österreich', note: wert('fNotiz')
    }
  };

  var knopf = document.getElementById('bestellKnopf');
  knopf.disabled = true;
  var alt = knopf.innerHTML;
  knopf.textContent = 'Bestellung wird geprüft …';

  fetch('/api/bestellung', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(daten)
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (a) {
      if (!a.d.ok) {
        knopf.disabled = false; knopf.innerHTML = alt;
        fehler(a.d.error || 'Die Bestellung konnte nicht abgeschlossen werden.');
        return;
      }
      cartLeeren();
      if (a.d.redirect) { location.href = a.d.redirect; return; }
      location.href = '/bestellung/erfolg?order=' + a.d.order_id + '&t=' + a.d.token;
    })
    .catch(function () {
      knopf.disabled = false; knopf.innerHTML = alt;
      fehler('Die Verbindung ist abgebrochen. Bitte erneut versuchen.');
    });
  return false;
}

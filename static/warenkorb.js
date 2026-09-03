/* ══════════════════════════════════════════════════════════════════
   WARENKORB
   EINZIGE Quelle fuer den Warenkorb, von allen Seiten geladen.

   Vorher lag der Warenkorb in einer Variablen der Startseite und war
   beim Seitenwechsel weg. Seit es eine eigene Sortiments-, Produkt-
   und Kassenseite gibt, muss er die Seite ueberleben, also liegt er
   in localStorage.

   Die Preise hier sind reine Anzeige. Verbindlich rechnet der Server
   in /api/bestellung neu, damit ein manipulierter Speicher nichts
   bewirkt.
   ══════════════════════════════════════════════════════════════════ */

var BK_CART_KEY = 'bk_cart_v1';
var cart = [];

(function ladeWarenkorb() {
  try {
    var roh = JSON.parse(localStorage.getItem(BK_CART_KEY) || '[]');
    if (Array.isArray(roh)) {
      cart = roh.filter(function (p) {
        return p && typeof p.id === 'number' && typeof p.qty === 'number' && p.qty > 0;
      });
    }
  } catch (e) { cart = []; }
})();

function cartSpeichern() {
  try { localStorage.setItem(BK_CART_KEY, JSON.stringify(cart)); } catch (e) { /* privater Modus */ }
}

function eurBk(v) { return '€ ' + v.toFixed(2).replace('.', ','); }

/* Mengenangabe: ab einem Kilo in Kilogramm, sonst in Gramm. "1000 g" liest
   sich schlechter als "1 kg". Von Fenster, Produktseite, Schublade und
   Kasse genutzt, damit ueberall dasselbe steht. */
function mengeText(g) {
  if (!g) return '';
  if (g >= 1000) {
    var kg = g / 1000;
    return (kg % 1 === 0 ? String(kg) : kg.toFixed(2).replace('.', ',')) + ' kg';
  }
  return g + ' g';
}

/* Wird der Artikel nach Gewicht verkauft? Dann zaehlt die Grammwahl. */
function isPer100(p) { return /100\s*g/i.test(p.unit || ''); }

/* Produkt aus der Liste der aktuellen Seite holen. Jede Seite mit Karten
   spielt ihre Produkte als window.products ein. */
function produktFinden(id) {
  var liste = window.products || [];
  for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
  return null;
}

function addToCart(id, grams) {
  var p = produktFinden(id);
  if (!p || p.stock === 0) return;
  var per100 = isPer100(p);
  var g = per100 ? (grams || 100) : null;
  var key = id + '_' + (g || 'stk');
  var linePrice = g ? Math.round(p.price * g) / 100 : p.price;
  var ex = null;
  for (var i = 0; i < cart.length; i++) if (cart[i].key === key) ex = cart[i];
  if (ex) ex.qty++;
  else cart.push({
    key: key, id: id, name: p.name, img: p.img, cat: p.cat, grams: g,
    unitLabel: (g ? mengeText(g) : p.unit), price: linePrice, qty: 1,
    grundpreis: p.grundpreis || null
  });
  cartSpeichern();
  updateCartCount();
  renderDrawer();
  var btn = document.getElementById('addBtn-' + id);
  if (btn) {
    btn.classList.add('fertig');
    var alt = btn.textContent;
    btn.textContent = 'Im Warenkorb';
    setTimeout(function () { btn.classList.remove('fertig'); btn.textContent = alt; }, 1400);
  }
  showToast(p.name + ' hinzugefügt');
}

function changeQty(key, d) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].key === key) {
      cart[i].qty += d;
      if (cart[i].qty <= 0) cart.splice(i, 1);
      break;
    }
  }
  cartSpeichern(); updateCartCount(); renderDrawer(); cartGeaendert();
}

function removeItem(key) {
  cart = cart.filter(function (x) { return x.key !== key; });
  cartSpeichern(); updateCartCount(); renderDrawer(); cartGeaendert();
}

function cartLeeren() { cart = []; cartSpeichern(); updateCartCount(); renderDrawer(); }

function cartTotal() {
  return cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
}

function cartAnzahl() {
  return cart.reduce(function (s, c) { return s + c.qty; }, 0);
}

/* Die Kassenseite haengt sich hier ein, damit sie neu rechnet, wenn im
   Drawer etwas geaendert wird. */
function cartGeaendert() {
  if (typeof window.onCartChange === 'function') window.onCartChange();
}

function updateCartCount() {
  var t = cartAnzahl();
  document.querySelectorAll('.cart-count').forEach(function (el) {
    el.textContent = t;
    el.classList.toggle('visible', t > 0);
  });
  // Der Knopf zur Kasse ist ein Verweis, kein Schaltknopf: "disabled" wirkt
  // dort nicht, deshalb die Klasse.
  var ck = document.getElementById('checkoutBtn');
  if (ck) {
    ck.classList.toggle('aus', t === 0);
    if ('disabled' in ck) ck.disabled = t === 0;
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (z) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z];
  });
}

function renderDrawer() {
  var body = document.getElementById('drawerBody');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML = '<div class="empty-cart">' +
      '<span><svg class="ico" style="width:30px;height:30px"><use href="#ic-cart"/></svg></span>' +
      'Ihr Warenkorb ist leer.' +
      '<a class="btn btn-rand" href="/bauernkoenig-vorschau/sortiment/" style="margin-top:18px">Zum Sortiment</a></div>';
  } else {
    body.innerHTML = cart.map(function (i) {
      return '<div class="cart-item">' +
        '<div class="ci-img">' + (i.img ? '<img src="' + esc(i.img) + '" alt="">' : '') + '</div>' +
        '<div class="ci-info">' +
          '<div class="ci-cat">' + esc(i.unitLabel) +
            (i.grundpreis ? ' &middot; ' + eurBk(i.grundpreis) + ' / kg' : '') + '</div>' +
          '<div class="ci-name">' + esc(i.name) + '</div>' +
          '<div class="ci-controls">' +
            '<button class="qty-btn" onclick="changeQty(\'' + i.key + '\',-1)" aria-label="Weniger">&minus;</button>' +
            '<span class="qty-val">' + i.qty + '</span>' +
            '<button class="qty-btn" onclick="changeQty(\'' + i.key + '\',1)" aria-label="Mehr">+</button>' +
            '<span class="ci-price">' + eurBk(i.price * i.qty) + '</span>' +
            '<button class="remove-btn" onclick="removeItem(\'' + i.key + '\')" aria-label="Entfernen">&#10005;</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
  var sum = document.getElementById('subtotal');
  if (sum) sum.textContent = eurBk(cartTotal());
}

function openCart() {
  var o = document.getElementById('overlay'), d = document.getElementById('drawer');
  if (!o || !d) { location.href = '/bauernkoenig-vorschau/kasse/'; return; }
  o.classList.add('open'); d.classList.add('open');
  renderDrawer();
}

/* Heisst auf allen Seiten gleich. Die Startseite hat zusaetzlich die
   Kontoschublade, die sie in ihrer eigenen Fassung mitschliesst. */
function closeCart() {
  var o = document.getElementById('overlay'), d = document.getElementById('drawer');
  if (o) o.classList.remove('open');
  if (d) d.classList.remove('open');
}
if (typeof window.closeAll !== 'function') window.closeAll = closeCart;

/* Kurzmeldung. Wenn die Seite kein Meldungsfeld hat, passiert nichts. */
function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
}

document.addEventListener('DOMContentLoaded', function () {
  updateCartCount();
  renderDrawer();
});

/* In einem zweiten Tab geaenderter Warenkorb: Zaehler mitziehen. */
window.addEventListener('storage', function (e) {
  if (e.key !== BK_CART_KEY) return;
  try { cart = JSON.parse(e.newValue || '[]'); } catch (x) { cart = []; }
  updateCartCount(); renderDrawer(); cartGeaendert();
});

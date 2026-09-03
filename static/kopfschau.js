/* ══════════════════════════════════════════════════════════════════
   KOPFSCHAU der Startseite (Entwurf 2, Aufbau nach tirolish.at/shop):
   vier Folien im Bildkasten, darunter vier Fortschrittsbalken.
   Wechsel alle 6,5 Sekunden, per Balken oder Wischen; bei angehaltener
   Maus pausiert die Uhr. Wer Bewegung abbestellt hat, bekommt eine
   feste Folie.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  var folien = document.querySelectorAll('#schauKasten .folie');
  var reiter = document.querySelectorAll('#schauReiter button');
  if (!folien.length) return;
  var nr = 0, uhr = null;
  var ruhe = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function zeigen(n) {
    nr = (n + folien.length) % folien.length;
    folien.forEach(function (f, i) { f.classList.toggle('aktiv', i === nr); });
    reiter.forEach(function (r, i) {
      r.classList.toggle('aktiv', i === nr);
      r.setAttribute('aria-selected', i === nr ? 'true' : 'false');
      // Balken neu starten: Animation kurz abschalten, damit sie neu laeuft
      var b = r.querySelector('i'); if (b) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
    });
  }
  function starten() { if (ruhe) return; stoppen(); uhr = setInterval(function () { zeigen(nr + 1); }, 6500); }
  function stoppen() { if (uhr) clearInterval(uhr); uhr = null; }
  reiter.forEach(function (r, i) { r.addEventListener('click', function () { zeigen(i); starten(); }); });
  var kasten = document.getElementById('schauKasten'), x0 = null;
  kasten.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, {passive: true});
  kasten.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { zeigen(nr + (dx < 0 ? 1 : -1)); starten(); }
  }, {passive: true});
  kasten.addEventListener('mouseenter', stoppen);
  kasten.addEventListener('mouseleave', starten);
  if (ruhe) document.documentElement.classList.add('ruhe');
  starten();
})();

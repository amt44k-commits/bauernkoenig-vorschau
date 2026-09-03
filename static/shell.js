/* ══════════════════════════════════════════════════════════════════
   KOPFZEILE (Entwurf 2): Aufklappmenue am Handy und Suchleiste.
   Wird von allen Seiten geladen.

   Burger: setzt .menue-auf am Kopf, die Navigation haengt dann als
   Liste unter dem Kopf (Regeln in shell.css). Lupe: setzt .suche-auf,
   die Suchleiste klappt auf und das Feld bekommt den Fokus; Absenden
   fuehrt nach /sortiment?suche=... (normales Formular, geht auch ohne
   JavaScript). Klick daneben, Escape und ein Klick auf einen Eintrag
   schliessen beides.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  var kopf = document.getElementById('kopf');
  if (!kopf) return;
  var burger = document.getElementById('kopfBurger');
  var lupe = document.getElementById('kopfSuche');
  var feld = document.getElementById('kopfSuchfeld');

  function zu() {
    kopf.classList.remove('menue-auf', 'suche-auf');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lupe) lupe.setAttribute('aria-expanded', 'false');
  }
  if (burger) burger.addEventListener('click', function (ev) {
    ev.stopPropagation();
    var auf = !kopf.classList.contains('menue-auf');
    zu();
    if (auf) { kopf.classList.add('menue-auf'); burger.setAttribute('aria-expanded', 'true'); }
  });
  if (lupe) lupe.addEventListener('click', function (ev) {
    ev.stopPropagation();
    var auf = !kopf.classList.contains('suche-auf');
    zu();
    if (auf) {
      kopf.classList.add('suche-auf'); lupe.setAttribute('aria-expanded', 'true');
      if (feld) feld.focus();
    }
  });
  kopf.querySelectorAll('.kopf-nav a').forEach(function (a) { a.addEventListener('click', zu); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('#kopf')) return;
    zu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
})();

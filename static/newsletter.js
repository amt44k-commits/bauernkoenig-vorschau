/* ══════════════════════════════════════════════════════════════════
   NEWSLETTER
   Doppelte Einwilligung: die Anmeldung gilt erst mit dem Klick in der
   Bestaetigungsmail. Vorher zeigte das Formular nur eine Bestaetigung,
   ohne irgendetwas zu speichern.

   Von allen Seiten geladen, die das Band tragen.
   ══════════════════════════════════════════════════════════════════ */

function subscribeNewsletter(e) {
  e.preventDefault();
  var form = e.target;
  var feld = form.querySelector('input[type=email]');
  var knopf = form.querySelector('button');
  var meldung = form.parentElement.parentElement.querySelector('.nl-done');
  if (!feld || !feld.value.trim()) return false;

  knopf.disabled = true;
  fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: feld.value.trim(), quelle: location.pathname })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      knopf.disabled = false;
      if (d.ok) {
        feld.value = '';
        meldung.textContent = 'Fast geschafft: wir haben dir eine Bestätigungsmail '
          + 'geschickt. Erst mit dem Klick darin ist die Anmeldung gültig.';
      } else {
        meldung.textContent = d.error || 'Das hat nicht geklappt. Bitte später erneut versuchen.';
      }
      meldung.classList.add('show');
    })
    .catch(function () {
      knopf.disabled = false;
      meldung.textContent = 'Die Verbindung ist abgebrochen. Bitte später erneut versuchen.';
      meldung.classList.add('show');
    });
  return false;
}

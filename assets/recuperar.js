/* Frame · nueva contraseña.
   El correo de «¿Olvidaste tu contraseña?» trae aquí, con un acceso de un solo
   uso en el fragmento (#access_token=…&type=recovery). Con él se guarda la
   contraseña nueva y se cierra ese acceso. Nada sale de esta página salvo
   hacia el servidor de cuentas de Frame. La clave es la pública de la app
   (la misma que viaja dentro de Frame): sola no da acceso a ningún dato.
   En español o en inglés, según el idioma del navegador (Frame 1.6.7). */
(function () {
  var API = 'https://egshmkkmvtsrgrfwpzog.supabase.co/auth/v1';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc2hta2ttdnRzcmdyZndwem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MDM4MzQsImV4cCI6MjEwMDA3OTgzNH0.CeBBseWj0jJzWgl6heBMFuHQJETw_svCD7knKRPvY3M';
  var MIN = 6;

  var EN = !/^es\b/i.test(navigator.language || 'es');
  var T = EN
    ? {
        echo: 'Password Password Password Password Password',
        h1a: 'New',
        h1b: 'password.',
        intro: 'Choose a new password for your Frame account. Make it just for Frame, not your email’s.',
        pass1: 'New password',
        pass2: 'Repeat the password',
        save: 'Save password',
        saving: 'Saving…',
        done: 'Done. Go back to Frame and sign in with your email and your new password.',
        home: 'Go to Frame’s page',
        invalid: 'This link no longer works: it expires after an hour and can only be used once. In Frame, tap “Forgot your password?” to get another one.',
        back: 'Back to Frame',
        short: 'The password must have at least ' + MIN + ' characters.',
        mismatch: 'The two passwords don’t match.',
        same: 'That’s your previous password. Choose a different one.',
        weak: 'That password is too weak. Try a longer one.',
        failed: 'Couldn’t save it. Try again in a moment.',
        offline: 'Couldn’t reach the server. Check your connection and try again.',
      }
    : {
        save: 'Guardar contraseña',
        saving: 'Guardando…',
        short: 'La contraseña debe tener al menos ' + MIN + ' caracteres.',
        mismatch: 'Las dos contraseñas no coinciden.',
        same: 'Esa es tu contraseña de antes. Elige una distinta.',
        weak: 'Esa contraseña es demasiado débil. Prueba con una más larga.',
        failed: 'No se pudo guardar. Inténtalo de nuevo en un momento.',
        offline: 'No se pudo contactar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      };
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'New password · Frame';
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) {
      var text = T[nodes[i].getAttribute('data-t')];
      if (text) nodes[i].textContent = text;
    }
  }

  var params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  var token = params.get('access_token');
  var type = params.get('type');
  // El acceso no se queda en la barra de direcciones ni en el historial.
  try { history.replaceState(null, '', window.location.pathname); } catch (e) { /* sin historial */ }

  var form = document.getElementById('recover-form');
  var done = document.getElementById('recover-done');
  var invalid = document.getElementById('recover-invalid');
  var error = document.getElementById('recover-error');
  var submit = document.getElementById('recover-submit');

  if (!token || type !== 'recovery') { invalid.hidden = false; return; }
  form.hidden = false;
  document.getElementById('pass1').focus();

  function fail(message) { error.textContent = message; error.hidden = false; }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    error.hidden = true;
    var a = document.getElementById('pass1').value;
    var b = document.getElementById('pass2').value;
    if (a.length < MIN) return fail(T.short);
    if (a !== b) return fail(T.mismatch);

    submit.disabled = true;
    submit.textContent = T.saving;
    var headers = { apikey: KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
    fetch(API + '/user', { method: 'PUT', headers: headers, body: JSON.stringify({ password: a }) })
      .then(function (response) {
        if (response.ok) {
          // Cierra el acceso de recuperación: la sesión de verdad se abre en Frame.
          fetch(API + '/logout?scope=local', { method: 'POST', headers: headers }).catch(function () {});
          form.hidden = true;
          done.hidden = false;
          return;
        }
        return response.json().catch(function () { return {}; }).then(function (body) {
          var text = String((body && (body.msg || body.error_description || body.message)) || '').toLowerCase();
          if (response.status === 401 || response.status === 403 || text.indexOf('expired') >= 0 || text.indexOf('invalid') >= 0) {
            form.hidden = true;
            invalid.hidden = false;
          } else if (text.indexOf('different from the old') >= 0 || text.indexOf('same') >= 0) {
            fail(T.same);
          } else if (text.indexOf('weak') >= 0 || text.indexOf('at least') >= 0) {
            fail(T.weak);
          } else {
            fail(T.failed);
          }
        });
      })
      .catch(function () { fail(T.offline); })
      .then(function () { submit.disabled = false; submit.textContent = T.save; });
  });
})();

/* Frame · se ejecuta antes del primer pintado.
   1) Nadie puede incrustar esta página dentro de otra (clickjacking).
   2) El tema elegido se aplica antes de pintar: sin parpadeo. */
(function () {
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(window.self.location.href); } catch (e) { /* bloqueado: la página queda oculta */ }
    return;
  }
  try {
    var theme = localStorage.getItem('frame-site-theme');
    if (theme === 'dark' || theme === 'light') document.documentElement.setAttribute('data-theme', theme);
  } catch (e) { /* sin almacenamiento: se usa el tema del sistema */ }
  document.documentElement.classList.add('js');
})();

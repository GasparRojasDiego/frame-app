// Tema antes del primer pintado: el guardado o, si no hay, el del sistema.
// Archivo aparte (no incrustado) para que la política de seguridad no admita
// ningún script en línea.
(function () {
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(window.self.location.href); } catch (e) {}
    return;
  }
  try {
    var t = localStorage.getItem('framePortalTheme');
    var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();

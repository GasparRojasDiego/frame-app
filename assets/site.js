/* Frame · página de descarga. Sin dependencias ni llamadas a terceros. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var pointer = { x: -9999, y: -9999, active: false };

  function primaryRgb() {
    return (getComputedStyle(root).getPropertyValue('--primary-rgb').trim() || '117, 145, 255');
  }
  var rgb = primaryRgb();

  /* ---------- Tema claro / oscuro ---------- */
  // El claro es el modo predeterminado; el oscuro se activa a mano.
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  var toggle = $('#theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('frame-site-theme', next); } catch (e) { /* sin almacenamiento */ }
      rgb = primaryRgb();
    });
  }

  /* ---------- Menú en pantallas pequeñas ---------- */
  var menu = $('#menu-toggle');
  var links = $('#nav-links');
  if (menu && links) {
    menu.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    $$('a', links).forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---------- Barra y ventana de la portada al desplazarse ---------- */
  var nav = $('#nav');
  var heroWindow = $('#hero-window');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      if (nav) nav.classList.toggle('scrolled', y > 8);
      if (revealables.length) revealCheck();
      if (heroWindow && !reduced) {
        var t = Math.min(1, y / 520);
        heroWindow.style.setProperty('--tilt', (10 * (1 - t)).toFixed(2) + 'deg');
        heroWindow.style.setProperty('--tilt-y', (-9 * (1 - t)).toFixed(2) + 'deg');
        heroWindow.style.setProperty('--tilt-s', (0.97 + 0.03 * t).toFixed(3));
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Aparición al desplazarse ----------
     Comprobación directa de posición (no IntersectionObserver): funciona
     aunque el navegador retrase sus avisos por la carga de las animaciones. */
  var revealables = $$('[data-reveal]');
  function revealCheck() {
    var vh = window.innerHeight || 800;
    for (var i = revealables.length - 1; i >= 0; i--) {
      var el = revealables[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh - 30 && r.bottom > 0) {
        el.classList.add('is-visible');
        revealables.splice(i, 1);
        $$('[data-count]', el).forEach(runCounter);
      }
    }
  }
  if (reduced || document.visibilityState === 'hidden') {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
    revealables = [];
  } else {
    revealCheck();
    setTimeout(revealCheck, 60);
    window.addEventListener('resize', revealCheck);
  }

  /* ---------- Contadores ---------- */
  function runCounter(el) {
    var target = Number(el.getAttribute('data-count')) || 0;
    if (reduced) { el.textContent = String(target); return; }
    var start = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - start) / 1400);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Versión publicada (version.json, mismo sitio) ---------- */
  function fill(sel, text) { $$(sel).forEach(function (el) { el.textContent = text; }); }
  fetch('version.json', { cache: 'no-cache', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (v) {
      if (!v || typeof v.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(v.version)) return;
      fill('[data-version]', 'Frame ' + v.version);
      fill('[data-version-short]', 'Versión ' + v.version);
      if (typeof v.size === 'number' && v.size > 0) fill('[data-size]', Math.round(v.size / 1048576) + ' MB');
      if (typeof v.date === 'string') {
        var d = new Date(v.date);
        if (!isNaN(d.getTime())) fill('[data-date]', d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }));
      }
      if (typeof v.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(v.sha256)) fill('[data-sha]', v.sha256.toUpperCase());
    })
    .catch(function () { /* sin red o sin archivo: quedan los textos por defecto */ });

  var copyBtn = $('[data-copy-hash]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var hash = ($('[data-sha]') || {}).textContent || '';
      if (!/^[A-F0-9]{64}$/.test(hash) || !navigator.clipboard) return;
      navigator.clipboard.writeText(hash).then(function () {
        copyBtn.textContent = 'Copiada';
        setTimeout(function () { copyBtn.textContent = 'Copiar'; }, 1800);
      });
    });
  }
  fill('[data-year]', String(new Date().getFullYear()));

  /* ---------- Puntero compartido ---------- */
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { pointer.active = false; });
  window.addEventListener('blur', function () { pointer.active = false; });

  function setupCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var state = { ctx: ctx, w: 0, h: 0 };
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = window.innerWidth; state.h = window.innerHeight;
      canvas.width = Math.round(state.w * dpr); canvas.height = Math.round(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    state.resize = resize;
    return state;
  }

  /* ---------- Constelación de fondo (toda la página) ---------- */
  var sky = $('#sky');
  if (sky && sky.getContext) {
    var S = setupCanvas(sky);
    var nodes = [];
    var LINK = 140;
    function seed() {
      var count = Math.min(95, Math.round((S.w * S.h) / 17000));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({ x: Math.random() * S.w, y: Math.random() * S.h, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: Math.random() * 1.4 + 0.6, d: Math.random() * 0.8 + 0.2 });
      }
    }
    seed();
    window.addEventListener('resize', seed);
    var par = { x: 0, y: 0 };
    var skyRunning = true;
    function drawSky() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, S.w, S.h);
      // Parallax suave con el cursor y con el desplazamiento.
      var tx = pointer.active ? (pointer.x / S.w - 0.5) * 26 : 0;
      var ty = pointer.active ? (pointer.y / S.h - 0.5) * 26 : 0;
      par.x += (tx - par.x) * 0.04; par.y += (ty - par.y) * 0.04;
      var scroll = (window.scrollY || 0) * 0.04;
      var pos = [];
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!reduced) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < -20) n.x = S.w + 20; if (n.x > S.w + 20) n.x = -20;
          if (n.y < -20) n.y = S.h + 20; if (n.y > S.h + 20) n.y = -20;
        }
        var px = n.x + par.x * n.d;
        var py = ((n.y - scroll * n.d) % (S.h + 40) + S.h + 40) % (S.h + 40) - 20 + par.y * n.d;
        pos.push([px, py]);
      }
      for (var a = 0; a < pos.length; a++) {
        for (var b = a + 1; b < pos.length; b++) {
          var dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1];
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.16 * (1 - dist / LINK)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[b][0], pos[b][1]); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < pos.length; k++) {
        var p = pos[k];
        var near = 0;
        if (pointer.active) {
          var mx = p[0] - pointer.x, my = p[1] - pointer.y;
          var md = Math.sqrt(mx * mx + my * my);
          if (md < 190) {
            near = 1 - md / 190;
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.22 * near).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(' + rgb + ',' + (0.45 + 0.5 * near).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p[0], p[1], nodes[k].r + near * 1.2, 0, Math.PI * 2); ctx.fill();
      }
      if (skyRunning && !reduced) requestAnimationFrame(drawSky);
    }
    drawSky();
    document.addEventListener('visibilitychange', function () {
      var visible = document.visibilityState === 'visible';
      if (visible && !skyRunning) { skyRunning = true; if (!reduced) requestAnimationFrame(drawSky); }
      if (!visible) skyRunning = false;
    });
    if (reduced) window.addEventListener('resize', function () { requestAnimationFrame(drawSky); });
  }

  /* ---------- Cursor: puntitos en círculo ----------
     Doce puntos giran alrededor del cursor. Cada uno lo sigue con su propio
     retraso: al moverse, se estiran en rayas en la dirección del movimiento;
     quietos, vuelven a ser puntos y crecen apenas. Sobre enlaces y botones el
     círculo se abre. Solo con ratón y sin «reducir movimiento». */
  var ringCanvas = $('#cursor-ring');
  if (ringCanvas && ringCanvas.getContext && finePointer && !reduced) {
    var C = setupCanvas(ringCanvas);
    var DOTS = 12;
    var dots = [];
    for (var i = 0; i < DOTS; i++) dots.push({ x: -9999, y: -9999, px: -9999, py: -9999, r: 1.4, ease: 0.2 + (i % 4) * 0.035 });
    var center = { x: -9999, y: -9999 };
    var radius = 16, radiusTarget = 16, rotation = 0, alpha = 0, lastMove = 0;
    var lastX = -9999, lastY = -9999;

    document.addEventListener('pointerover', function (e) {
      var hit = e.target && e.target.closest && e.target.closest('a, button, summary, [role="button"]');
      radiusTarget = hit ? 24 : 16;
    });

    function drawRing(now) {
      var ctx = C.ctx;
      ctx.clearRect(0, 0, C.w, C.h);
      alpha += ((pointer.active ? 1 : 0) - alpha) * 0.12;
      if (pointer.x !== lastX || pointer.y !== lastY) { lastMove = now; lastX = pointer.x; lastY = pointer.y; }
      if (center.x < -9000) { center.x = pointer.x; center.y = pointer.y; }
      center.x += (pointer.x - center.x) * 0.35;
      center.y += (pointer.y - center.y) * 0.35;
      radius += (radiusTarget - radius) * 0.15;
      rotation += 0.006;
      var still = now - lastMove > 260;

      if (alpha > 0.01) {
        for (var i = 0; i < DOTS; i++) {
          var d = dots[i];
          var ang = rotation + (i / DOTS) * Math.PI * 2;
          var tx = center.x + Math.cos(ang) * radius;
          var ty = center.y + Math.sin(ang) * radius;
          if (d.x < -9000) { d.x = tx; d.y = ty; }
          d.px = d.x; d.py = d.y;
          d.x += (tx - d.x) * d.ease;
          d.y += (ty - d.y) * d.ease;
          var vx = d.x - d.px, vy = d.y - d.py;
          var speed = Math.sqrt(vx * vx + vy * vy);
          d.r += ((still ? 1.95 : 1.4) - d.r) * 0.12;
          ctx.globalAlpha = alpha;
          if (speed > 0.9) {
            // En movimiento: la raya apunta hacia donde viene el punto.
            var len = Math.min(14, speed * 2.2);
            ctx.strokeStyle = 'rgba(' + rgb + ',0.85)';
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - (vx / speed) * len, d.y - (vy / speed) * len);
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(' + rgb + ',0.85)';
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(drawRing);
    }
    requestAnimationFrame(drawRing);
  }
})();

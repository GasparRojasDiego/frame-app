/* Frame · página de descarga. Sin dependencias ni llamadas a terceros. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Tema claro / oscuro ---------- */
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var toggle = $('#theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('frame-site-theme', next); } catch (e) { /* sin almacenamiento */ }
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
      a.addEventListener('click', function () {
        links.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Barra: línea al bajar ---------- */
  var nav = $('#nav');
  var heroWindow = $('#hero-window');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      if (nav) nav.classList.toggle('scrolled', y > 8);
      // La ventana de la portada se endereza al bajar.
      if (heroWindow && !reduced) {
        var t = Math.min(1, y / 520);
        heroWindow.style.setProperty('--tilt', (12 * (1 - t)).toFixed(2) + 'deg');
        heroWindow.style.setProperty('--tilt-y', (-10 * (1 - t)).toFixed(2) + 'deg');
        heroWindow.style.setProperty('--tilt-s', (0.97 + 0.03 * t).toFixed(3));
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Aparición al desplazarse ---------- */
  var revealables = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Contadores ---------- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var target = Number(el.getAttribute('data-count')) || 0;
    if (reduced) { el.textContent = String(target); return; }
    var start = performance.now();
    var duration = 1400;
    (function step(now) {
      var p = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; co.observe(el); });
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

  /* ---------- Copiar la huella ---------- */
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

  /* ---------- Año del pie ---------- */
  fill('[data-year]', String(new Date().getFullYear()));

  /* ---------- Constelación de la portada ---------- */
  var canvas = $('#constellation');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var nodes = [];
    var width = 0, height = 0, dpr = 1, running = true, frame = 0;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 150;

    function color(alpha) {
      var rgb = getComputedStyle(root).getPropertyValue('--dot').trim() || '125, 149, 255';
      return 'rgba(' + rgb + ',' + alpha + ')';
    }
    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(80, Math.round((width * height) / 16000));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.6 + 0.6 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      var dotColor = color(0.75);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!reduced) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;
        }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            ctx.strokeStyle = color(0.18 * (1 - dist / LINK));
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        var mdx = a.x - mouse.x, mdy = a.y - mouse.y;
        var near = Math.sqrt(mdx * mdx + mdy * mdy) < 170;
        ctx.fillStyle = near ? color(1) : dotColor;
        ctx.beginPath(); ctx.arc(a.x, a.y, near ? a.r + 1.2 : a.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduced) frame = requestAnimationFrame(draw);
    }
    resize();
    draw();
    window.addEventListener('resize', function () { resize(); if (reduced) draw(); });
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    // Fuera de pantalla no se anima: cero consumo.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; if (!reduced) frame = requestAnimationFrame(draw); }
        if (!visible) { running = false; cancelAnimationFrame(frame); }
      }).observe(canvas);
    }
  }
})();

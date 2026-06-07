/* VOKEMON — interactions + scroll effects */
(function () {
  'use strict';

  /* =====================================================
     CONFIG — change these when the token goes live
     ===================================================== */
  var CONTRACT_ADDRESS = '';                  // <-- paste the $VOKE CA on Solana
  var PUMP_FUN_URL = 'https://pump.fun';       // <-- swap to the token's pump.fun URL

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Current year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Mobile nav toggle ---- */
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');

  function setNav(open) {
    if (!mobileNav || !toggle) return;
    mobileNav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!mobileNav.classList.contains('is-open'));
    });
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });

  /* ---- Toast (shared helper, also exposed for auth.js) ---- */
  var toast;
  function showToast(msg) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('is-show'); }, 1800);
  }
  window.VOKE = window.VOKE || {};
  window.VOKE.toast = showToast;

  /* ---- Contract Address + Copy ---- */
  var caValueEl = document.getElementById('caValue');
  var copyBtn = document.getElementById('copyCa');
  if (caValueEl) caValueEl.textContent = CONTRACT_ADDRESS || 'Coming soon';
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!CONTRACT_ADDRESS) {
        showToast('$VOKE CA not live yet — coming soon!');
        return;
      }
      navigator.clipboard.writeText(CONTRACT_ADDRESS)
        .then(function () { showToast('CA copied! ✅'); })
        .catch(function () { showToast('Copy failed'); });
    });
  }

  /* ---- Sync Pump.fun links ---- */
  document.querySelectorAll('a[href="https://pump.fun"]').forEach(function (a) {
    a.setAttribute('href', PUMP_FUN_URL);
  });

  /* ---- Countdown ---- */
  var cd = document.getElementById('countdown');
  if (cd) {
    var deadline = new Date(cd.getAttribute('data-deadline')).getTime();
    var els = {
      d: cd.querySelector('[data-d]'),
      h: cd.querySelector('[data-h]'),
      m: cd.querySelector('[data-m]'),
      s: cd.querySelector('[data-s]')
    };
    var note = document.getElementById('cdNote');
    function pad(n) { return String(n).padStart(2, '0'); }
    var timer = setInterval(tick, 1000);
    function tick() {
      var diff = deadline - Date.now();
      if (diff <= 0) {
        if (els.d) els.d.textContent = '00';
        if (els.h) els.h.textContent = '00';
        if (els.m) els.m.textContent = '00';
        if (els.s) els.s.textContent = '00';
        if (note) note.textContent = 'LIVE NOW 🚀';
        clearInterval(timer);
        return;
      }
      if (els.d) els.d.textContent = pad(Math.floor(diff / 86400000));
      if (els.h) els.h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      if (els.m) els.m.textContent = pad(Math.floor((diff % 3600000) / 60000));
      if (els.s) els.s.textContent = pad(Math.floor((diff % 60000) / 1000));
    }
    tick();
  }

  /* =====================================================
     SCROLL EFFECTS
     ===================================================== */

  /* ---- Text scramble (decode-in) ---- */
  function buildScramble(el) {
    var nodes = [];
    (function walk(n) {
      for (var i = 0; i < n.childNodes.length; i++) {
        var c = n.childNodes[i];
        if (c.nodeType === 3 && c.nodeValue.trim()) nodes.push({ node: c, text: c.nodeValue });
        else if (c.nodeType === 1) walk(c);
      }
    })(el);
    // blank out until played
    nodes.forEach(function (n) { n.node.nodeValue = n.text.replace(/\S/g, ' '); });
    return function play() {
      var pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgxyz$#@%&*<>/?01';
      nodes.forEach(function (tn) {
        var final = tn.text, len = final.length;
        var start = performance.now(), dur = 480 + len * 22;
        function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var reveal = Math.floor(p * len);
          var out = '';
          for (var i = 0; i < len; i++) {
            var ch = final[i];
            if (ch === ' ' || ch === '\n') { out += ch; continue; }
            out += i < reveal ? ch : pool[(Math.random() * pool.length) | 0];
          }
          tn.node.nodeValue = out;
          if (p < 1) requestAnimationFrame(step);
          else tn.node.nodeValue = final;
        }
        requestAnimationFrame(step);
      });
    };
  }

  var scramblers = {};
  if (!reduceMotion) {
    document.querySelectorAll('[data-scramble]').forEach(function (el, i) {
      el.setAttribute('data-scramble-id', i);
      scramblers[i] = buildScramble(el);
    });
  }

  /* ---- Reveal + directional slides + trigger scramble ---- */
  var revealEls = document.querySelectorAll('[data-reveal], [data-scramble]');
  if ('IntersectionObserver' in window && revealEls.length && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        var sid = entry.target.getAttribute('data-scramble-id');
        if (sid !== null && scramblers[sid]) { scramblers[sid](); scramblers[sid] = null; }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Parallax (rAF-throttled) ---- */
  var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    function updateParallax() {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var offset = (center - vh / 2) / vh;
        var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        el.style.transform = 'translate3d(0,' + (offset * -f * 100).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateParallax();
  }
})();

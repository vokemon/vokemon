/* VOKEMON — auth (Email OTP + Phantom wallet) + session
   NOTE: This is a FRONTEND DEMO flow. Email OTP is simulated in the
   browser (no real email is sent). For production, wire the "send code"
   and "verify" steps to a backend (Supabase / magic-link / an email API)
   and verify the Phantom signature server-side. See README. */
(function () {
  'use strict';

  var SESSION_KEY = 'voke_session';
  window.VOKE = window.VOKE || {};

  /* ---------- toast (reuse main.js toast if present) ---------- */
  function toast(msg) {
    if (window.VOKE && window.VOKE.toast) return window.VOKE.toast(msg);
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('is-show'); }, 1800);
  }

  /* ---------- session helpers ---------- */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  window.VOKE.auth = { get: getSession, set: setSession, clear: clearSession };

  function shortWallet(a) { return a.length > 10 ? a.slice(0, 4) + '…' + a.slice(-4) : a; }

  /* ---------- build modal ---------- */
  var overlay, codeStore = '', pendingEmail = '', otpMode = 'demo';

  function apiPost(path, data) {
    return fetch('api/' + path, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    }).then(function (r) {
      return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { status: r.status, body: j }; });
    });
  }
  function setBusy(btn, on, label) {
    if (!btn) return;
    btn.disabled = on;
    if (on) { btn.dataset.t = btn.textContent; btn.textContent = label || '…'; }
    else if (btn.dataset.t) { btn.textContent = btn.dataset.t; }
  }
  function gotoCode() { panelStep('email', false); panelStep('code', true); var i = overlay.querySelector('#authCode'); if (i) i.focus(); }
  function demoSend() { otpMode = 'demo'; codeStore = String(Math.floor(100000 + Math.random() * 900000)); gotoCode(); toast('Demo code: ' + codeStore); }

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML =
      '<div class="auth-modal box" data-theme="spot" role="dialog" aria-modal="true" aria-label="Log in to VOKEMON">' +
        '<button class="auth__close" type="button" aria-label="Close">✕</button>' +
        '<p class="t-cap">VOKEMON</p>' +
        '<h2 class="auth__title t-h3">Log in</h2>' +
        '<div class="auth__tabs">' +
          '<button class="auth__tab is-active" type="button" data-tab="email">Email OTP</button>' +
          '<button class="auth__tab" type="button" data-tab="phantom">Phantom</button>' +
        '</div>' +

        /* EMAIL PANEL */
        '<div class="auth__panel is-active" data-panel="email">' +
          '<div data-step="email">' +
            '<label class="auth__label t-cap" for="authEmail">Email</label>' +
            '<input class="auth__input" id="authEmail" type="email" placeholder="you@email.com" autocomplete="email" />' +
            '<button class="btn btn--solid auth__submit" type="button" data-act="send">Send code</button>' +
          '</div>' +
          '<div data-step="code" hidden>' +
            '<label class="auth__label t-cap" for="authCode">Enter 6-digit code</label>' +
            '<input class="auth__input auth__input--code" id="authCode" type="text" inputmode="numeric" maxlength="6" placeholder="••••••" />' +
            '<button class="btn btn--solid auth__submit" type="button" data-act="verify">Verify &amp; enter</button>' +
            '<button class="link auth__back" type="button" data-act="back">Use a different email</button>' +
          '</div>' +
          '<p class="auth__note t-cap">Demo mode — the code appears on screen. No real email is sent.</p>' +
        '</div>' +

        /* PHANTOM PANEL */
        '<div class="auth__panel" data-panel="phantom">' +
          '<p class="auth__desc t-body">Connect your Solana wallet to enter the agent dashboard.</p>' +
          '<button class="btn btn--solid auth__submit" type="button" data-act="phantom">Connect Phantom</button>' +
          '<a class="link auth__back" href="https://phantom.app/" target="_blank" rel="noopener">Don\'t have Phantom? Get it →</a>' +
        '</div>' +

        '<div class="auth__session" hidden></div>' +
      '</div>';
    document.body.appendChild(overlay);

    /* close handlers */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('.auth__close')) closeModal();
    });

    /* tab switching */
    overlay.querySelectorAll('.auth__tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.getAttribute('data-tab');
        overlay.querySelectorAll('.auth__tab').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        overlay.querySelectorAll('.auth__panel').forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
        });
      });
    });

    /* actions */
    overlay.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (!act) return;
      handleAction(act.getAttribute('data-act'), act);
    });
  }

  function panelStep(name, show) {
    var el = overlay.querySelector('.auth__panel[data-panel="email"] [data-step="' + name + '"]');
    if (el) el.hidden = !show;
  }

  function handleAction(act, btn) {
    if (act === 'send') {
      var email = (overlay.querySelector('#authEmail').value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email'); return; }
      pendingEmail = email;
      setBusy(btn, true, 'Sending…');
      apiPost('send-otp.php', { email: email }).then(function (res) {
        setBusy(btn, false);
        if (res.body && res.body.ok) { otpMode = 'real'; gotoCode(); toast('Code sent to ' + email); }
        else if (res.body && res.body.error === 'cooldown') { toast('Please wait ' + res.body.wait + 's'); }
        else if (res.body) { toast('Could not send email — check config'); }
        else { demoSend(); } // no PHP backend (e.g. local preview) → demo code on screen
      }).catch(function () { setBusy(btn, false); demoSend(); });
    } else if (act === 'verify') {
      var code = (overlay.querySelector('#authCode').value || '').trim();
      if (otpMode === 'real') {
        setBusy(btn, true, 'Verifying…');
        apiPost('verify-otp.php', { email: pendingEmail, code: code }).then(function (res) {
          setBusy(btn, false);
          if (res.body && res.body.ok) { finishLogin({ method: 'email', id: pendingEmail, label: pendingEmail }); }
          else if (res.body && res.body.error === 'expired') { toast('Code expired — resend'); }
          else { toast('Wrong code — try again'); }
        }).catch(function () { setBusy(btn, false); toast('Verify failed'); });
      } else {
        if (code !== codeStore) { toast('Wrong code — try again'); return; }
        finishLogin({ method: 'email', id: pendingEmail, label: pendingEmail });
      }
    } else if (act === 'back') {
      panelStep('code', false);
      panelStep('email', true);
    } else if (act === 'phantom') {
      connectPhantom();
    }
  }

  function connectPhantom() {
    var provider = window.solana;
    if (!provider || !provider.isPhantom) {
      toast('Phantom not found — install it first');
      window.open('https://phantom.app/', '_blank', 'noopener');
      return;
    }
    provider.connect()
      .then(function (res) {
        var addr = res.publicKey.toString();
        finishLogin({ method: 'phantom', id: addr, label: shortWallet(addr) });
      })
      .catch(function () { toast('Wallet connection cancelled'); });
  }

  function finishLogin(session) {
    session.ts = Date.now();
    setSession(session);
    toast('Welcome — entering dashboard…');
    setTimeout(function () { window.location.href = 'dashboard.html'; }, 600);
  }

  /* ---------- open / close ---------- */
  function renderSessionState() {
    var box = overlay.querySelector('.auth__session');
    var s = getSession();
    if (s) {
      box.hidden = false;
      box.innerHTML =
        '<p class="t-cap">Signed in as</p>' +
        '<p class="auth__who">' + (s.label || s.id) + '</p>' +
        '<div class="auth__sessrow">' +
          '<a class="btn btn--solid" href="dashboard.html">Go to dashboard</a>' +
          '<button class="btn" type="button" data-act="logout">Log out</button>' +
        '</div>';
      box.querySelector('[data-act="logout"]').addEventListener('click', function () {
        fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' }).catch(function () {});
        clearSession(); renderSessionState(); toast('Logged out');
      });
    } else {
      box.hidden = true;
      box.innerHTML = '';
    }
  }

  function openModal() {
    if (!overlay) buildModal();
    renderSessionState();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  window.VOKE.openLogin = openModal;

  /* ---------- wire triggers ---------- */
  document.addEventListener('click', function (e) {
    var login = e.target.closest('[data-login]');
    if (login) { e.preventDefault(); openModal(); return; }
    var gs = e.target.closest('[data-getstarted]');
    if (gs) {
      e.preventDefault();
      if (getSession()) window.location.href = 'dashboard.html';  // already logged in → go straight in
      else openModal();                                            // otherwise force login first
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- auto-open login when redirected here from a gated page ---------- */
  if (/[?&]login=1(\b|$)/.test(window.location.search)) {
    openModal();
  }
})();

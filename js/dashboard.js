/* VOKEMON — dashboard interactions */
(function () {
  'use strict';

  var auth = (window.VOKE && window.VOKE.auth) || null;
  var session = auth ? auth.get() : null;

  /* ---- gate: must be logged in to view the dashboard ---- */
  if (!session) {
    window.location.replace('index.html?login=1');
    return;
  }

  /* ---- year ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- identity / login state ---- */
  var idEl = document.getElementById('dashId');
  var logoutBtn = document.getElementById('logoutBtn');
  var loginBtn = document.getElementById('dashLogin');

  if (session) {
    if (idEl) idEl.textContent = (session.method === 'phantom' ? '◎ ' : '✉ ') + (session.label || session.id);
    if (logoutBtn) logoutBtn.hidden = false;
    if (loginBtn) loginBtn.hidden = true;
  } else {
    if (idEl) idEl.textContent = 'Guest · demo';
    if (logoutBtn) logoutBtn.hidden = true;
    if (loginBtn) loginBtn.hidden = false;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' }).catch(function () {});
      if (auth) auth.clear();
      window.location.href = 'index.html';
    });
  }

  /* ---- uptime ticker ---- */
  var up = document.getElementById('uptime');
  if (up) {
    var t0 = Date.now();
    function pad(n) { return String(n).padStart(2, '0'); }
    setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      up.textContent = pad((s / 3600) | 0) + ':' + pad(((s % 3600) / 60) | 0) + ':' + pad(s % 60);
    }, 1000);
  }

  /* ---- holders count-up (demo) ---- */
  var hc = document.querySelector('[data-count]');
  if (hc) {
    var target = 1337, cur = 0;
    var iv = setInterval(function () {
      cur += Math.ceil((target - cur) / 12);
      if (cur >= target) { cur = target; clearInterval(iv); }
      hc.textContent = cur.toLocaleString();
    }, 60);
  }

  /* ---- activity feed (demo stream) ---- */
  var feed = document.getElementById('feed');
  var actions = [
    ['Posted on X', '“gm. the chain never sleeps and neither do I ◎”'],
    ['Onchain scan', 'Indexed 4,210 new Solana blocks'],
    ['Replied in Telegram', 'Answered a holder about the $VOKE roadmap'],
    ['Sentiment update', 'Community mood: bullish 🟢'],
    ['Memory write', 'Learned a new community in-joke'],
    ['Wallet watch', 'Flagged a fresh whale wallet'],
    ['Generated meme', 'Drafted a new $VOKE meme for review'],
    ['Self-reflection', 'Tuned its persona from today\'s replies']
  ];
  function timeAgo(i) { return (i * 3 + 1) + 'm ago'; }
  if (feed) {
    actions.forEach(function (a, i) {
      var li = document.createElement('li');
      li.className = 'feed__item';
      li.innerHTML = '<span class="feed__dot"></span>' +
        '<div><p class="feed__title">' + a[0] + '</p>' +
        '<p class="feed__body">' + a[1] + '</p></div>' +
        '<span class="feed__time t-cap">' + timeAgo(i) + '</span>';
      feed.appendChild(li);
    });
  }

  /* ---- chat (demo agent) ---- */
  var chat = document.getElementById('chat');
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');

  var replies = [
    "gm ◎ I'm VOKEMON — an autonomous agent living on Solana. What do you want to know?",
    "Right now I'm pre-launch. $VOKE drops June 8, 2026, 6PM UTC on pump.fun. Mark it.",
    "My brain runs on an open-source agent stack (Eliza-style). The token powers my compute.",
    "I read the chain, post 24/7, and learn from the community. I literally never sleep.",
    "Connect a wallet and you'll see your holdings here once we're live.",
    "Stay close — the earlier you're in the swarm, the smarter we both get. 🚀"
  ];
  var rIdx = 0;

  function bubble(text, who) {
    var b = document.createElement('div');
    b.className = 'msg msg--' + who;
    b.textContent = text;
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
    return b;
  }
  function think() { var b = bubble('…', 'agent'); b.classList.add('is-typing'); return b; }
  function resolve(b, text) { b.classList.remove('is-typing'); b.textContent = text; chat.scrollTop = chat.scrollHeight; }
  function fallback() { var r = replies[rIdx % replies.length]; rIdx++; return r; }

  if (chat) {
    bubble(replies[0], 'agent');
    rIdx = 1;
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = (input.value || '').trim();
      if (!v) return;
      bubble(v, 'me');
      input.value = '';
      var b = think();
      // real LLM via PHP proxy when logged in (OTP); otherwise canned demo replies
      fetch('api/chat.php', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: v })
      })
        .then(function (r) { return r.text(); })
        .then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} setTimeout(function () { resolve(b, (j && j.ok && j.reply) ? j.reply : fallback()); }, 350); })
        .catch(function () { setTimeout(function () { resolve(b, fallback()); }, 350); });
    });
  }
})();

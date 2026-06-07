/* VOKEMON — "VOKE RUN": a tiny pink pixel platformer (Mario-style)
   Vanilla canvas. Controls: ← → / A D move, Space / ↑ / W jump.
   Touch: on-screen pad. Stomp enemies, grab coins, reach the flag. */
(function () {
  'use strict';

  var canvas = document.getElementById('vokeGame');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  var frame = document.getElementById('gameFrame');
  var elCoins = document.getElementById('gameCoins');
  var elLives = document.getElementById('gameLives');
  var overlay = document.getElementById('gameOverlay');
  var elTitle = document.getElementById('gameTitle');
  var elHint = document.getElementById('gameHint');
  var btnStart = document.getElementById('gameStart');
  var elCta = document.getElementById('gameCta');

  var TILE = 20, ROWS = 12, COLS = 74;
  var VIEW_W = canvas.width, VIEW_H = canvas.height;
  var GROUND = 10;

  /* ---------- palette ---------- */
  var C = {
    sky1: '#1b0a22', sky2: '#3a0f37', glow: '#5e1747',
    moon: '#ffd9f3', star: '#ff9fe8', cloud: '#ff8fe4',
    hill: '#3a0f33', hill2: '#54164c',
    ground: '#2a0f26', groundTop: '#ff60dd', mortar: '#7a1f5c', stud: '#ffa6ec',
    brick: '#3a1233', brickLine: '#ff77e0',
    qblock: '#ff60dd', qdark: '#c61f93', qused: '#4a1d42', qmark: '#2a0a22',
    plat: '#3a1030', platTop: '#ff60dd', edge: '#7a1f5c',
    coin: '#ff60dd', coinL: '#ffd0f3', coinK: '#7a1f5c',
    hK: '#2a0a22', hP: '#ff60dd', hL: '#ffaae9', hD: '#c61f93', hW: '#ffffff', hE: '#1a0a16',
    eK: '#2a0a22', eP: '#ff5bd6', eD: '#a3187a', eW: '#ffffff', eE: '#1a0a16',
    flagPole: '#ffd0f3', flag: '#ff60dd'
  };

  /* ---------- build level ---------- */
  var grid = [], r, c, i;
  for (r = 0; r < ROWS; r++) { grid[r] = []; for (c = 0; c < COLS; c++) grid[r][c] = ' '; }
  var gaps = [[17, 18], [35, 36], [53, 54]];
  function inGap(col) { for (var g = 0; g < gaps.length; g++) if (col >= gaps[g][0] && col <= gaps[g][1]) return true; return false; }
  for (c = 0; c < COLS; c++) if (!inGap(c)) { grid[GROUND][c] = '#'; grid[GROUND + 1][c] = '#'; }
  var plats = [[7, 7, 3], [6, 13, 2], [7, 24, 3], [5, 30, 3], [7, 45, 3], [6, 59, 3], [7, 63, 3]];
  plats.forEach(function (p) { for (i = 0; i < p[2]; i++) grid[p[0]][p[1] + i] = '='; });
  [[6, 8, '?'], [6, 25, '?'], [5, 31, 'b'], [5, 32, '?'], [5, 33, 'b'], [7, 46, '?'], [6, 60, 'b'], [6, 61, 'b']]
    .forEach(function (b) { grid[b[0]][b[1]] = b[2]; });
  function coin(row, col) { if (col >= 0 && col < COLS && row >= 0 && row < ROWS && grid[row][col] === ' ') grid[row][col] = 'o'; }
  plats.forEach(function (p) { for (i = 0; i < p[2]; i++) coin(p[0] - 1, p[1] + i); });
  [[5, 8], [5, 25], [6, 46], [4, 30], [4, 31], [4, 32]].forEach(function (k) { coin(k[0], k[1]); });
  gaps.forEach(function (g) { var a = g[0]; coin(GROUND - 2, a - 1); coin(GROUND - 3, a); coin(GROUND - 3, a + 1); coin(GROUND - 2, a + 2); });
  [11, 22, 29,42, 49, 57, 66].forEach(function (col) { if (!inGap(col)) grid[GROUND - 1][col] = 'e'; });
  var FLAG_COL = COLS - 3, START_COL = 2;

  /* ---------- parse entities ---------- */
  var coinsArr = [], enemySpawns = [];
  for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
    var t = grid[r][c];
    if (t === 'o') { coinsArr.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, got: false }); grid[r][c] = ' '; }
    else if (t === 'e') { enemySpawns.push({ c: c, r: r }); grid[r][c] = ' '; }
  }
  function isSolid(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    var t = grid[row][col]; return t === '#' || t === '=' || t === 'b' || t === '?' || t === 'u';
  }

  /* ---------- background props ---------- */
  var stars = [], clouds = [];
  for (i = 0; i < 38; i++) stars.push({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H * 0.7, p: Math.random() * 6.28 });
  for (i = 0; i < 4; i++) clouds.push({ x: Math.random() * 340, y: 16 + Math.random() * 70, s: 0.6 + Math.random() });

  /* ---------- state ---------- */
  var player, enemies, camX = 0, coinCount = 0, lives = 3, status = 'ready', tnow = 0;
  var input = { left: false, right: false, jumpQueued: false, jumpHeld: false };

  function spawnEnemies() {
    enemies = enemySpawns.map(function (s) {
      return { x: s.c * TILE + 2, y: GROUND * TILE - 14, w: 16, h: 14, vx: -0.6, vy: 0, dead: 0, onGround: false, hitWall: false, anim: 0 };
    });
  }
  function resetPlayer() { player = { x: START_COL * TILE, y: GROUND * TILE - 16, w: 12, h: 16, vx: 0, vy: 0, onGround: false, face: 1, anim: 0, hurt: 0, hitWall: false }; }
  function fullReset() { resetPlayer(); spawnEnemies(); coinsArr.forEach(function (k) { k.got = false; }); coinCount = 0; lives = 3; camX = 0; }

  /* ---------- physics ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function moveAxis(e, dx, dy) {
    e.x += dx; e.y += dy;
    var left = Math.floor(e.x / TILE), right = Math.floor((e.x + e.w - 1) / TILE);
    var top = Math.floor(e.y / TILE), bottom = Math.floor((e.y + e.h - 1) / TILE);
    for (var rr = top; rr <= bottom; rr++) for (var cc = left; cc <= right; cc++) {
      if (!isSolid(cc, rr)) continue;
      if (dx > 0) { e.x = cc * TILE - e.w; e.vx = 0; e.hitWall = true; }
      else if (dx < 0) { e.x = (cc + 1) * TILE; e.vx = 0; e.hitWall = true; }
      if (dy > 0) { e.y = rr * TILE - e.h; e.vy = 0; e.onGround = true; }
      else if (dy < 0) { e.y = (rr + 1) * TILE; e.vy = 0; if (e === player && grid[rr][cc] === '?') { grid[rr][cc] = 'u'; coinCount++; } }
    }
  }

  function hurt() {
    if (player.hurt > 0) return;
    if (status === 'demo') { fullReset(); return; }
    lives--;
    if (lives <= 0) { status = 'over'; showOverlay('over'); }
    else { resetPlayer(); player.hurt = 70; camX = 0; }
  }
  function win() { if (status === 'demo') { fullReset(); return; } if (status === 'play') { status = 'win'; showOverlay('win'); } }

  function step() {
    var accel = 1.7;
    player.hitWall = false;
    if (input.left) { player.vx = -accel; player.face = -1; }
    else if (input.right) { player.vx = accel; player.face = 1; }
    else player.vx = 0;

    if (input.jumpQueued && player.onGround) { player.vy = -8.8; player.onGround = false; }
    input.jumpQueued = false;
    if (!input.jumpHeld && player.vy < 0) player.vy *= 0.86;

    player.vy += 0.6; if (player.vy > 10) player.vy = 10;
    player.onGround = false;
    moveAxis(player, player.vx, 0);
    moveAxis(player, 0, player.vy);
    if (player.hurt > 0) player.hurt--;
    if (Math.abs(player.vx) > 0.1 && player.onGround) player.anim += 0.25;
    if (player.y > VIEW_H + 60) hurt();

    enemies.forEach(function (en) {
      if (en.dead) { en.dead--; return; }
      en.onGround = false; en.hitWall = false;
      en.vy += 0.6; if (en.vy > 10) en.vy = 10;
      moveAxis(en, en.vx, 0);
      moveAxis(en, 0, en.vy);
      en.anim += 0.15;
      if (en.hitWall) en.vx = -en.vx;
      if (en.onGround) {
        var aheadX = en.vx < 0 ? en.x - 1 : en.x + en.w + 1;
        if (!isSolid(Math.floor(aheadX / TILE), Math.floor((en.y + en.h + 2) / TILE))) en.vx = -en.vx;
      }
      if (en.y > VIEW_H + 60) { en.dead = 1; return; }
      if (overlap(player, en)) {
        if (player.vy > 0 && (player.y + player.h) - en.y < 12) { en.dead = 60; player.vy = -6.4; coinCount++; }
        else hurt();
      }
    });

    coinsArr.forEach(function (k) {
      if (!k.got && Math.abs((player.x + player.w / 2) - k.x) < 12 && Math.abs((player.y + player.h / 2) - k.y) < 13) { k.got = true; coinCount++; }
    });

    if (player.x + player.w > FLAG_COL * TILE + 4) win();
    camX = clamp(player.x + player.w / 2 - VIEW_W / 2, 0, COLS * TILE - VIEW_W);
  }

  /* ---------- drawing helpers ---------- */
  function circle(x, y, rad) { ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill(); }

  function drawBg() {
    var g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, C.sky1); g.addColorStop(0.62, C.sky2); g.addColorStop(1, C.glow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // crescent moon
    ctx.fillStyle = C.moon; circle(VIEW_W - 44, 40, 15);
    ctx.fillStyle = C.sky1; circle(VIEW_W - 50, 35, 13);
    // stars
    for (i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(tnow * 0.002 + s.p));
      ctx.fillStyle = C.star; ctx.fillRect(s.x | 0, s.y | 0, 2, 2);
    }
    ctx.globalAlpha = 1;
    // hills (parallax)
    var base = GROUND * TILE + 8, p = -(camX * 0.4);
    mound(((40 + p) % 320 + 320) % 320, base, 64, 42, C.hill);
    mound(((190 + p) % 320 + 320) % 320, base, 82, 56, C.hill2);
    mound(((300 + p) % 320 + 320) % 320, base, 52, 34, C.hill);
    // clouds (drift)
    for (i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      var x = ((cl.x - tnow * 0.004 * cl.s) % 340 + 340) % 340 - 40;
      ctx.globalAlpha = 0.5; ctx.fillStyle = C.cloud;
      circle(x, cl.y, 8); circle(x + 11, cl.y + 2, 11); circle(x + 24, cl.y, 8);
      ctx.globalAlpha = 1;
    }
  }
  function mound(cx, base, rw, rh, col) {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(cx - rw, base); ctx.quadraticCurveTo(cx, base - rh, cx + rw, base); ctx.closePath(); ctx.fill();
  }

  function drawGround(x, y) {
    ctx.fillStyle = C.ground; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = C.groundTop; ctx.fillRect(x, y, TILE, 3);
    ctx.fillStyle = C.mortar; ctx.fillRect(x + 10, y + 3, 1, TILE - 3); ctx.fillRect(x, y + 11, TILE, 1);
    ctx.fillStyle = C.stud; ctx.fillRect(x + 3, y + 1, 2, 1); ctx.fillRect(x + 13, y + 1, 2, 1);
  }
  function drawPlat(x, y) {
    ctx.fillStyle = C.plat; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = C.platTop; ctx.fillRect(x, y, TILE, 4);
    ctx.fillStyle = C.edge; ctx.fillRect(x, y, 1, TILE); ctx.fillRect(x + TILE - 1, y, 1, TILE);
  }
  function drawBrick(x, y) {
    ctx.fillStyle = C.brick; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = C.brickLine;
    ctx.fillRect(x, y, TILE, 2); ctx.fillRect(x, y + 10, TILE, 1);
    ctx.fillRect(x + 6, y, 1, 10); ctx.fillRect(x + 13, y + 11, 1, 9);
  }
  function drawUsed(x, y) {
    ctx.fillStyle = C.qused; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = C.qdark; ctx.fillRect(x + 1, y + 1, TILE - 2, 1); ctx.fillRect(x + 1, y + 1, 1, TILE - 2);
    ctx.fillStyle = C.mortar; ctx.fillRect(x + 8, y + 8, 4, 4);
  }
  function drawQ(x, y) {
    ctx.fillStyle = C.qdark; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = C.qblock; ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = C.qdark; ctx.fillRect(x + 1, y + TILE - 3, TILE - 2, 2); ctx.fillRect(x + TILE - 3, y + 1, 2, TILE - 2);
    ctx.fillStyle = C.qmark;
    ctx.fillRect(x + 6, y + 4, 8, 2); ctx.fillRect(x + 12, y + 4, 2, 5);
    ctx.fillRect(x + 8, y + 8, 6, 2); ctx.fillRect(x + 8, y + 9, 2, 4); ctx.fillRect(x + 8, y + 15, 2, 2);
    if (Math.sin(tnow * 0.005 + x) > 0.6) { ctx.fillStyle = C.hW; ctx.fillRect(x + 3, y + 3, 2, 2); }
  }

  function drawCoin(k) {
    var x = Math.round(k.x - camX), y = Math.round(k.y);
    var w = 2 + Math.round(Math.abs(Math.sin(tnow * 0.006 + k.x * 0.05)) * 6);
    ctx.fillStyle = C.coinK; ctx.fillRect(x - w - 1, y - 9, (w + 1) * 2, 18);
    ctx.fillStyle = C.coin; ctx.fillRect(x - w, y - 8, w * 2, 16);
    ctx.fillStyle = C.coinL; ctx.fillRect(x - Math.max(1, w - 3), y - 5, 2, 10);
  }

  function drawHero(sx, sy) {
    var mv = Math.abs(player.vx) > 0.1 && player.onGround;
    var phase = mv ? (Math.sin(player.anim * 1.4) > 0 ? 1 : 0) : 0;
    function px(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(sx + x, sy + y, w, h); }
    px(1, 0, 10, 15, C.hK); // silhouette/outline
    // legs
    if (!player.onGround) { px(2, 12, 3, 3, C.hD); px(7, 12, 3, 3, C.hD); }
    else { px(2, 12, 3, 3 + (phase ? 0 : 1), C.hD); px(7, 12, 3, 3 + (phase ? 1 : 0), C.hD); }
    px(2, 6, 8, 6, C.hP);            // body
    px(2, 10, 8, 2, C.hD);          // belt
    px(1, 7, 2, 4, C.hD); px(9, 7, 2, 4, C.hD); // arms
    px(2, 1, 8, 6, C.hL);           // head
    px(2, 0, 8, 2, C.hP);           // cap
    var ex = player.face > 0 ? 6 : 3;
    px(ex, 3, 2, 2, C.hE);
    px(player.face > 0 ? ex - 1 : ex + 2, 3, 1, 1, C.hW);
    px(player.face > 0 ? 3 : 8, 4, 1, 1, C.hD); // blush
  }

  function drawEnemy(en, sx, sy) {
    function px(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(sx + x, sy + y, w, h); }
    if (en.dead) { px(0, 9, 16, 4, C.eK); px(1, 10, 14, 3, C.eP); return; }
    var ph = Math.sin(en.anim * 1.5) > 0 ? 1 : 0;
    px(2, 0, 12, 12, C.eK);          // silhouette
    px(3, 1, 10, 9, C.eP);           // dome
    px(3, 1, 10, 2, C.eD);           // top shade
    px(5, 4, 2, 3, C.eW); px(9, 4, 2, 3, C.eW); // eyes
    px(6, 5, 1, 2, C.eE); px(10, 5, 1, 2, C.eE);
    px(4, 3, 3, 1, C.eK); px(9, 3, 3, 1, C.eK); // brows
    px(2, 11, 4, 3, ph ? C.eD : C.eK);          // feet shuffle
    px(10, 11, 4, 3, ph ? C.eK : C.eD);
  }

  function drawFlag() {
    var sx = Math.round(FLAG_COL * TILE - camX + 8);
    var topY = (GROUND - 5) * TILE, botY = GROUND * TILE;
    ctx.fillStyle = C.coinK; ctx.fillRect(sx - 1, topY - 2, 4, botY - topY + 2);
    ctx.fillStyle = C.flagPole; ctx.fillRect(sx, topY, 2, botY - topY);
    var w = 14 + Math.round(Math.sin(tnow * 0.01) * 2);
    ctx.fillStyle = C.coinK; ctx.fillRect(sx + 2, topY, w + 2, 11);
    ctx.fillStyle = C.flag; ctx.fillRect(sx + 2, topY + 1, w, 9);
    ctx.fillStyle = C.flagPole; ctx.fillRect(sx + 4, topY + 4, 3, 3);
  }

  function render() {
    drawBg();
    var startC = Math.floor(camX / TILE) - 1, endC = startC + Math.ceil(VIEW_W / TILE) + 2;
    for (var cc = startC; cc <= endC; cc++) {
      if (cc < 0 || cc >= COLS) continue;
      for (var rr = 0; rr < ROWS; rr++) {
        var t = grid[rr][cc]; if (t === ' ') continue;
        var x = cc * TILE - camX, y = rr * TILE;
        if (t === '#') drawGround(x, y);
        else if (t === '=') drawPlat(x, y);
        else if (t === 'b') drawBrick(x, y);
        else if (t === '?') drawQ(x, y);
        else if (t === 'u') drawUsed(x, y);
      }
    }
    coinsArr.forEach(function (k) { if (!k.got) { var dx = k.x - camX; if (dx > -16 && dx < VIEW_W + 16) drawCoin(k); } });
    drawFlag();
    enemies.forEach(function (en) { var dx = en.x - camX; if (dx > -28 && dx < VIEW_W + 28) drawEnemy(en, Math.round(dx), Math.round(en.y)); });
    if (!(player.hurt > 0 && Math.floor(player.hurt / 4) % 2)) drawHero(Math.round(player.x - camX), Math.round(player.y));
    if (elCoins) elCoins.textContent = coinCount;
    if (elLives) elLives.textContent = Math.max(0, lives);
  }

  /* ---------- overlay / start ---------- */
  function showOverlay(state) {
    if (!overlay) return;
    if (state === 'over') { elTitle.textContent = 'Game Over'; elHint.textContent = 'Coins collected: ' + coinCount; btnStart.textContent = '↺ Play again'; }
    else if (state === 'win') { elTitle.textContent = 'You Win! 🎉'; elHint.textContent = 'Coins: ' + coinCount + ' / ' + coinsArr.length; btnStart.textContent = '↺ Play again'; }
    else { elTitle.textContent = 'VOKE RUN'; elHint.textContent = 'Reach the flag · stomp foes · grab coins'; btnStart.textContent = '▶ Play'; }
    if (elCta) elCta.hidden = true;
    overlay.hidden = false;
  }
  function start() {
    fullReset(); status = 'play';
    if (overlay) overlay.hidden = true;
    if (elCta) elCta.hidden = true;
    input.left = input.right = false; input.jumpHeld = false; input.jumpQueued = false;
    if (frame) frame.focus({ preventScroll: true });
  }
  if (btnStart) btnStart.addEventListener('click', start);

  /* ---------- input ---------- */
  var KEY = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump' };
  if (frame) {
    frame.addEventListener('keydown', function (e) {
      var k = KEY[e.key];
      if (k) {
        e.preventDefault();
        if (k === 'jump') { if (!input.jumpHeld) input.jumpQueued = true; input.jumpHeld = true; }
        else input[k] = true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && status !== 'play') { e.preventDefault(); start(); }
    });
    frame.addEventListener('keyup', function (e) {
      var k = KEY[e.key];
      if (k) { e.preventDefault(); if (k === 'jump') input.jumpHeld = false; else input[k] = false; }
    });
    frame.addEventListener('click', function () { if (status !== 'play') start(); else frame.focus({ preventScroll: true }); });
  }
  // touch pad
  Array.prototype.forEach.call(document.querySelectorAll('.game-pad__btn'), function (b) {
    var dir = b.getAttribute('data-dir');
    function on(e) { e.preventDefault(); if (status !== 'play') { start(); } if (dir === 'jump') { if (!input.jumpHeld) input.jumpQueued = true; input.jumpHeld = true; } else input[dir] = true; }
    function off(e) { e.preventDefault(); if (dir === 'jump') input.jumpHeld = false; else input[dir] = false; }
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  });

  /* ---------- loop ---------- */
  /* auto-pilot for the attract/teaser mode */
  function aiControl() {
    input.left = false; input.right = true;
    var footRow = Math.floor((player.y + player.h + 2) / TILE);
    var aheadCol = Math.floor((player.x + player.w + TILE * 1.2) / TILE);
    var gapAhead = !isSolid(aheadCol, footRow) && !isSolid(aheadCol, footRow + 1);
    var wallAhead = isSolid(Math.floor((player.x + player.w + 3) / TILE), Math.floor((player.y + player.h - 4) / TILE));
    var foe = enemies.some(function (en) { return !en.dead && en.x > player.x && (en.x - player.x) < 40 && Math.abs(en.y - player.y) < 26; });
    input.jumpQueued = player.onGround && (gapAhead || wallAhead || foe);
    input.jumpHeld = true;
  }

  var last = 0, acc = 0;
  function loop(ts) {
    tnow = ts; if (!last) last = ts;
    var dt = ts - last; last = ts; if (dt > 50) dt = 50;
    if (status === 'play' || status === 'demo') {
      acc += dt; var guard = 0;
      while (acc >= 16.6667 && guard++ < 6) { if (status === 'demo') aiControl(); step(); acc -= 16.6667; }
    }
    render();
    requestAnimationFrame(loop);
  }

  fullReset();
  status = 'demo';
  if (overlay) overlay.hidden = true;
  if (elCta) elCta.hidden = false;
  requestAnimationFrame(loop);
})();

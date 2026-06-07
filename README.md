<!-- Banner (assets/banner.png) -->
[![VOKEMON — AI agent memecoin on Solana](/assets/banner.png)](https://vokemon.xyz)

<h1 align="center">VOKEMON&nbsp;·&nbsp;$VOKE</h1>
<p align="center"><b>An autonomous AI agent memecoin living onchain on Solana.</b><br/>
Posts 24/7 · reads onchain data · built on an open-source agent stack.</p>

<p align="center">
  <img src="https://img.shields.io/badge/network-Solana%20(SPL)-ff60dd?style=for-the-badge" alt="Solana" />
  <img src="https://img.shields.io/badge/status-pre--launch-ff60dd?style=for-the-badge" alt="status" />
  <img src="https://img.shields.io/badge/build-none%20·%20vanilla-000002?style=for-the-badge" alt="no build" />
  <img src="https://img.shields.io/badge/backend-PHP-777bb4?style=for-the-badge" alt="php" />
</p>

<p align="center">
  🌐 <a href="https://vokemon.xyz">vokemon.xyz</a> &nbsp;·&nbsp; 📦 <a href="https://github.com/vokemon/vokemon">github.com/vokemon/vokemon</a> &nbsp;·&nbsp; 🚀 Launch: <b>June 8, 2026 · 6:00 PM UTC</b>
</p>

---

## ✨ What is VOKEMON?

**VOKEMON ($VOKE)** is a memecoin with an actual brain — an autonomous AI agent that lives onchain on **Solana**. It posts, learns, reacts to onchain data, and chats with its community 24/7. The site is a fast, no-build static front-end backed by a tiny PHP API for real **email OTP login** and a server-side **Anthropic (Claude)** chat proxy.

## 🧩 Features

- 🎨 **Brutalist pink design system** — outlined boxes, condensed display type, theme-driven (`data-theme`).
- 🪙 **Token section** — `$VOKE` ticker, copy-CA button, live **countdown**, Buy on Pump.fun.
- 🎮 **VOKE RUN** — a playable pink **pixel platformer** right in the hero (auto-plays as a teaser, click to take control).
- 🔑 **Login** — real **Email OTP** (via your own mailbox) + **Phantom wallet** connect.
- 🧠 **Agent Dashboard** — status, KPIs, live activity feed, **AI chat with Claude**, brain config, onchain holdings.
- ✨ **Scroll effects** — parallax, text-scramble, directional reveals (respects `prefers-reduced-motion`).
- 📱 Fully responsive · ⚡ zero build step · 🔒 secrets stay server-side.

## 🎮 VOKE RUN (mini-game)

A self-contained canvas platformer (pink pixel art). Auto-pilots an attract/teaser loop on load; click to play.
- **← →** / **A D** move · **Space / ↑ / W** jump (on-screen pad on touch)
- Stomp foes, grab coins, reach the flag 🚩

## 🖼️ Brand assets

> Images live in [`/assets`](/assets). The banner above is `assets/banner.png` (add your own).

<p align="center">
  <img src="/assets/favicon.png" width="84" alt="favicon" />
  &nbsp;&nbsp;
  <img src="/assets/logo.png"   width="130" alt="logo" />
  &nbsp;&nbsp;
  <img src="/assets/coin.png"   width="130" alt="$VOKE coin" />
  &nbsp;&nbsp;
  <img src="/assets/agent.png"  width="130" alt="agent" />
</p>
<p align="center">
  <img src="/assets/hero.png"   width="200" alt="hero key visual" />
  &nbsp;&nbsp;
  <img src="/assets/og.png"     width="260" alt="social share" />
</p>

**Capability icons**

<p align="center">
  <img src="/assets/sector-1.png" width="90" alt="sector 1" />
  <img src="/assets/sector-2.png" width="90" alt="sector 2" />
  <img src="/assets/sector-3.png" width="90" alt="sector 3" />
  <img src="/assets/sector-4.png" width="90" alt="sector 4" />
  <img src="/assets/sector-5.png" width="90" alt="sector 5" />
</p>

| File | Use | Suggested size |
|------|-----|----------------|
| `assets/banner.png` | GitHub / social banner | 1500×500 |
| `assets/favicon.png` | Browser tab icon | 256×256 |
| `assets/logo.png` | Logo (header, footer, dashboard) | 256×256 |
| `assets/hero.png` | Hero key visual | 1200×1500 |
| `assets/coin.png` | $VOKE coin | 800×800 |
| `assets/agent.png` | Agent avatar | 1000×1000 |
| `assets/sector-1…5.png` | Capability icons | 400×400 |
| `assets/og.png` | Social share preview | 1200×630 |

## 🧱 Tech stack

`HTML` · `CSS` (custom design system, no framework) · `Vanilla JS` (canvas game, scroll FX, auth, dashboard) · `PHP 8` (OTP email over SMTP, Anthropic proxy) · **Anthropic Claude** for the agent chat · **Solana / SPL** for the token.

## 📂 Structure

```
vokemon/
├── index.html · dashboard.html
├── css/style.css
├── js/  auth.js · main.js · dashboard.js · game.js
├── api/ send-otp.php · verify-otp.php · chat.php · logout.php · me.php · _lib.php · _mailer.php
├── config.sample.php   → copy to config.php and fill (gitignored)
├── assets/             → images (logo, hero, coin, agent, sectors, og, banner)
└── github.vokemon/     → README.md + PRD.md (this folder)
```

## 🚀 Quick start

**Clone**
```bash
git clone https://github.com/vokemon/vokemon.git
cd vokemon
```

**Local preview** (static only — PHP/OTP/chat gracefully fall back to demo):
```bash
python3 -m http.server 8123    # http://localhost:8123
```

**Deploy (Hostinger + PHP):**
1. Create mailbox `noreply@vokemon.xyz` in hPanel.
2. Upload the folder contents to `public_html/`.
3. `cp config.sample.php config.php` and fill the **Anthropic key** + **mailbox password**.
4. Select **PHP 8.1+**, enable **SSL**.
5. Open the site → Get Started → Email OTP → Dashboard chats with Claude. ✅

Full guide + troubleshooting: see the deploy [`README.md`](../README.md) at the project root.

## 🗺️ Roadmap

- [x] **Tier 1** — Dashboard chat wired to Claude (live)
- [ ] **Tier 2** — Autonomous agent auto-posting to X / Telegram
- [ ] **Tier 3** — Onchain Solana agent wallet + wallet-signature login

## ⚠️ Disclaimer

VOKEMON / $VOKE is a **meme / experimental** project. Nothing here is financial advice. Do your own research.

<p align="center"><sub>Built on Solana · made with 🩷</sub></p>

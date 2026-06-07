# VOKEMON — AI Agent Memecoin on Solana

Static front-end (HTML/CSS/JS) + small **PHP backend** for **vokemon.xyz**.
Brand: **VOKEMON** · Token: **$VOKE** · Network: **Solana (SPL)**.

```
vokemon/  (→ upload contents to public_html)
├── index.html            # landing (hero + VOKE RUN game, token, agent, etc.)
├── dashboard.html        # AI agent dashboard (login-gated)
├── config.php            # <<< YOUR SECRETS (Anthropic key + mailbox pass)
├── .htaccess             # denies config.php, caches images
├── css/style.css
├── js/ auth.js · main.js · dashboard.js · game.js
├── api/                  # PHP backend
│   ├── _lib.php  _mailer.php          (internal, HTTP-denied)
│   ├── send-otp.php  verify-otp.php   (real email OTP)
│   ├── logout.php  me.php
│   └── chat.php                       (Anthropic proxy for the dashboard)
└── assets/  (logo, hero, coin, agent, sector-1..5, og, favicon)
```

## 🚀 Deploy to Hostinger (vokemon.xyz)

1. **Create the mailbox** in hPanel → **Emails** → create `noreply@vokemon.xyz` and set a password.
2. **Upload** everything under `vokemon/` into `public_html/` (keep the folder structure). Easiest: zip the folder, upload, extract in File Manager.
3. **Edit `config.php`** (File Manager → edit):
   - `anthropic_api_key` → your Anthropic key.
   - `mail.smtp_pass` → the `noreply@vokemon.xyz` mailbox password.
   - SMTP host/port are pre-set for Hostinger (`smtp.hostinger.com`, `465` SSL).
4. **PHP version**: hPanel → Advanced → PHP Configuration → select **PHP 8.1+** (needs `curl` + `openssl`, both on by default).
5. **Domain + SSL**: point `vokemon.xyz` to the hosting, then hPanel → **SSL** → install (Let's Encrypt). The site must run on **https** (session cookies are Secure).
6. **Test**: open https://vokemon.xyz → **Get Started** → **Email OTP** → enter your email → you get a real code → enter it → **Dashboard** → chat talks to **Claude**.

> Updating files later? Bump the `?v=NN` number on the CSS/JS `<link>`/`<script>` tags so browsers fetch fresh copies.

## 🔐 How the backend works
- **Email OTP** — `send-otp.php` mails a 6-digit code (via SMTP from your mailbox) and stores it in the PHP session; `verify-otp.php` checks it and logs the session in. Codes expire in 10 min, 45s resend cooldown, 5 tries.
- **AI chat** — `chat.php` proxies to Anthropic using the server-side key (the key never reaches the browser). It **requires an OTP-logged session**, so the key can't be abused by strangers.
- **Phantom wallet** — connects client-side for dashboard access; its chat uses the built-in demo replies (a server-side wallet-signature check can be added later for real chat).
- `config.php` is blocked over HTTP by `.htaccess` and is only read server-side. **Never commit/share it.**

## 🖥️ Local preview (optional)
`python3 -m http.server 8123` serves the static files but **not** PHP. With no backend, the site **degrades gracefully**: Email OTP shows a demo code on screen, and the dashboard chat uses canned replies. Real OTP + real Claude only work once deployed on Hostinger (PHP).

## 🪙 Token config — edit when $VOKE launches
In `js/main.js` (top):
```js
var CONTRACT_ADDRESS = '';                 // paste the $VOKE CA on Solana
var PUMP_FUN_URL = 'https://pump.fun';      // the token's pump.fun URL
```
Countdown deadline is in `index.html` (`data-deadline="2026-06-08T18:00:00Z"`).

## 🖼️ Images (`/assets`, 9 total)
`logo.png` · `hero.png` · `coin.png` · `agent.png` · `sector-1.png … sector-5.png` (+ optional `og.png` for social share). They’re ~27 MB total right now — **compress them** (resize + TinyPNG/WebP) before launch for fast loads.

## 🆘 Troubleshooting
- **OTP email not arriving** → check `mail.smtp_pass`; try port `587` (STARTTLS) if `465` is blocked; check the spam folder; make sure the mailbox exists.
- **Chat says it can't answer / 401** → you must log in via **Email OTP** (Phantom-only sessions get demo replies).
- **`no_api_key`** → fill `anthropic_api_key` in `config.php`.
- **500 on API** → confirm PHP 8.1+ with `curl` enabled.

## 🧠 Roadmap
- Tier 1 ✅ dashboard chat → Claude (done here).
- Tier 2 — autonomous agent auto-posting to X / Telegram.
- Tier 3 — onchain Solana agent wallet + real wallet-signature login.

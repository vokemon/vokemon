<?php
/**
 * VOKEMON — config template.
 * Copy this file to `config.php` and fill in your secrets:
 *     cp config.sample.php config.php
 * `config.php` is git-ignored so your keys never get pushed to GitHub.
 */
return [
  // ---- Anthropic (dashboard AI chat) ----
  'anthropic_api_key'    => 'sk-ant-REPLACE_ME',                 // <-- paste your Anthropic API key
  'anthropic_model'      => 'claude-haiku-4-5-20251001',          // fast + cheap; good for chat
  'anthropic_max_tokens' => 320,

  // ---- Email / SMTP (real OTP via your Hostinger mailbox) ----
  'mail' => [
    'from'      => 'noreply@vokemon.xyz',
    'from_name' => 'VOKEMON',
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 465,                       // 465 = SSL (recommended). 587 = STARTTLS.
    'smtp_user' => 'noreply@vokemon.xyz',     // the mailbox you create in hPanel
    'smtp_pass' => 'REPLACE_WITH_MAILBOX_PASSWORD',
  ],

  // ---- OTP behaviour ----
  'otp_ttl'       => 600,   // code lifetime in seconds (10 min)
  'otp_cooldown'  => 45,    // min seconds between resends (per session)
  'otp_max_tries' => 5,     // wrong-code attempts before the code is voided

  // ---- Site ----
  'site_name' => 'VOKEMON',
  'site_url'  => 'https://vokemon.xyz',
];

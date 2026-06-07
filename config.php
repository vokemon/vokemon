<?php
/**
 * VOKEMON — central config for the PHP backend (OTP email + Anthropic chat).
 * FILL IN the secrets below after uploading. DO NOT share this file publicly.
 * (It is denied over HTTP by .htaccess; it is only read server-side.)
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

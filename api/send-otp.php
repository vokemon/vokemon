<?php
/* POST {email} -> emails a 6-digit code, stores it in the session. */
require __DIR__ . '/_lib.php';
require __DIR__ . '/_mailer.php';
require_post();
start_sess();
$c = cfg();

$in = body_json();
$email = trim($in['email'] ?? '');
if (!valid_email($email)) json_out(['ok' => false, 'error' => 'invalid_email'], 400);

$now = time();
if (isset($_SESSION['otp']['sent_at']) && ($now - $_SESSION['otp']['sent_at']) < $c['otp_cooldown']) {
  json_out(['ok' => false, 'error' => 'cooldown', 'wait' => $c['otp_cooldown'] - ($now - $_SESSION['otp']['sent_at'])], 429);
}

$code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$_SESSION['otp'] = ['code' => $code, 'email' => $email, 'exp' => $now + $c['otp_ttl'], 'sent_at' => $now, 'tries' => 0];

$mins = (int) round($c['otp_ttl'] / 60);
$html =
  '<div style="font-family:Arial,Helvetica,sans-serif;background:#000002;padding:40px;border-radius:16px;color:#e4e4e4;max-width:480px;margin:auto">' .
    '<div style="font-family:Arial Black,Arial,sans-serif;font-size:28px;letter-spacing:1px;color:#ff60dd">VOKEMON</div>' .
    '<p style="font-size:16px;margin-top:24px">Your login code:</p>' .
    '<div style="font-size:38px;font-weight:bold;letter-spacing:10px;color:#ff60dd;margin:12px 0 20px">' . $code . '</div>' .
    '<p style="font-size:13px;color:#9a9a9a">Valid for ' . $mins . ' minutes. If you didn\'t request this, ignore this email.</p>' .
    '<p style="font-size:12px;color:#6a6a6a;margin-top:24px">— VOKEMON · built on Solana</p>' .
  '</div>';

list($ok, $err) = smtp_send($c, $email, 'Your VOKEMON login code: ' . $code, $html);
if (!$ok) json_out(['ok' => false, 'error' => 'mail_failed', 'detail' => $err], 500);

json_out(['ok' => true]);

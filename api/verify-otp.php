<?php
/* POST {email, code} -> validates the code and logs the session in. */
require __DIR__ . '/_lib.php';
require_post();
start_sess();
$c = cfg();

$in = body_json();
$email = trim($in['email'] ?? '');
$code  = trim($in['code'] ?? '');

$o = $_SESSION['otp'] ?? null;
if (!$o) json_out(['ok' => false, 'error' => 'no_code'], 400);
if (time() > $o['exp']) { unset($_SESSION['otp']); json_out(['ok' => false, 'error' => 'expired'], 400); }
if ($o['tries'] >= $c['otp_max_tries']) { unset($_SESSION['otp']); json_out(['ok' => false, 'error' => 'too_many'], 429); }

$_SESSION['otp']['tries']++;
if (!hash_equals((string) $o['code'], $code) || strcasecmp($o['email'], $email) !== 0) {
  json_out(['ok' => false, 'error' => 'wrong'], 401);
}

unset($_SESSION['otp']);
session_regenerate_id(true);
$_SESSION['user'] = ['email' => $email, 'method' => 'email', 'ts' => time()];
json_out(['ok' => true, 'email' => $email]);

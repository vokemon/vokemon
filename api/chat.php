<?php
/* POST {message} -> proxies to Anthropic with the server-side key.
   Requires a logged-in (OTP) session so the key can't be abused. */
require __DIR__ . '/_lib.php';
require_post();
start_sess();
$c = cfg();

if (empty($_SESSION['user'])) json_out(['ok' => false, 'error' => 'auth_required'], 401);

$key = $c['anthropic_api_key'];
if (!$key || strpos($key, 'REPLACE') !== false) json_out(['ok' => false, 'error' => 'no_api_key'], 500);

$in = body_json();
$msg = trim($in['message'] ?? '');
if ($msg === '') json_out(['ok' => false, 'error' => 'empty'], 400);
if (mb_strlen($msg) > 1000) $msg = mb_substr($msg, 0, 1000);

$hist = $_SESSION['chat'] ?? [];
$hist[] = ['role' => 'user', 'content' => $msg];
$hist = array_slice($hist, -10);

$system =
  'You are VOKEMON ($VOKE), an autonomous AI agent memecoin living onchain on Solana. ' .
  'You are witty and degen-but-smart, speak in a light crypto/meme tone, but stay genuinely helpful and concise (2-4 sentences). ' .
  '$VOKE launches June 8, 2026 at 6PM UTC on pump.fun. You post 24/7, read onchain data, and run on an open-source agent stack. ' .
  'Never give financial advice; remind users this is a meme / experimental project.';

$payload = json_encode([
  'model'      => $c['anthropic_model'],
  'max_tokens' => (int) $c['anthropic_max_tokens'],
  'system'     => $system,
  'messages'   => $hist,
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => $payload,
  CURLOPT_HTTPHEADER     => [
    'content-type: application/json',
    'x-api-key: ' . $key,
    'anthropic-version: 2023-06-01',
  ],
  CURLOPT_TIMEOUT => 30,
]);
$resp = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$cerr = curl_error($ch);
curl_close($ch);

if ($resp === false) json_out(['ok' => false, 'error' => 'curl', 'detail' => $cerr], 502);
$j = json_decode($resp, true);
if ($http >= 400 || !isset($j['content'][0]['text'])) {
  json_out(['ok' => false, 'error' => 'api', 'status' => $http, 'detail' => $j['error']['message'] ?? ''], 502);
}

$reply = $j['content'][0]['text'];
$hist[] = ['role' => 'assistant', 'content' => $reply];
$_SESSION['chat'] = array_slice($hist, -10);
json_out(['ok' => true, 'reply' => $reply]);

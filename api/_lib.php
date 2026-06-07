<?php
/* VOKEMON — shared helpers for the API endpoints */

function cfg() {
  static $c = null;
  if ($c === null) $c = require __DIR__ . '/../config.php';
  return $c;
}

function json_out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data);
  exit;
}

function body_json() {
  $raw = file_get_contents('php://input');
  $d = json_decode($raw, true);
  return is_array($d) ? $d : [];
}

function start_sess() {
  if (session_status() !== PHP_SESSION_ACTIVE) {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
      'lifetime' => 0, 'path' => '/', 'secure' => $https,
      'httponly' => true, 'samesite' => 'Lax',
    ]);
    session_name('voke_sid');
    session_start();
  }
}

function valid_email($e) { return (bool) filter_var($e, FILTER_VALIDATE_EMAIL); }

function require_post() {
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
}

<?php
/* VOKEMON — tiny dependency-free SMTP sender (SSL 465 or STARTTLS 587). */

function smtp_send($cfg, $to, $subject, $html) {
  $m = $cfg['mail'];
  $host = $m['smtp_host'];
  $port = (int) $m['smtp_port'];
  $transport = ($port === 465 ? 'ssl://' : '') . $host;

  $errno = 0; $errstr = '';
  $fp = @fsockopen($transport, $port, $errno, $errstr, 15);
  if (!$fp) return [false, "connect: $errstr ($errno)"];
  stream_set_timeout($fp, 15);

  $read = function () use ($fp) {
    $data = '';
    while (($line = fgets($fp, 515)) !== false) {
      $data .= $line;
      // final line of a (possibly multi-line) reply has a space at index 3
      if (strlen($line) < 4 || $line[3] === ' ') break;
    }
    return $data;
  };
  $cmd = function ($c) use ($fp, $read) { fwrite($fp, $c . "\r\n"); return $read(); };

  $read();                       // server greeting
  $cmd('EHLO vokemon.xyz');

  if ($port !== 465) {           // STARTTLS path for 587
    $cmd('STARTTLS');
    if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
      fclose($fp); return [false, 'starttls failed'];
    }
    $cmd('EHLO vokemon.xyz');
  }

  $cmd('AUTH LOGIN');
  $cmd(base64_encode($m['smtp_user']));
  $auth = $cmd(base64_encode($m['smtp_pass']));
  if (strpos($auth, '235') === false) { fclose($fp); return [false, 'auth: ' . trim($auth)]; }

  $cmd('MAIL FROM:<' . $m['from'] . '>');
  $rcpt = $cmd('RCPT TO:<' . $to . '>');
  if (strpos($rcpt, '25') === false) { fclose($fp); return [false, 'rcpt: ' . trim($rcpt)]; }

  $cmd('DATA');
  $headers =
    'From: ' . $m['from_name'] . ' <' . $m['from'] . ">\r\n" .
    'To: <' . $to . ">\r\n" .
    'Subject: ' . $subject . "\r\n" .
    "MIME-Version: 1.0\r\n" .
    "Content-Type: text/html; charset=UTF-8\r\n" .
    'Date: ' . date('r') . "\r\n" .
    'Message-ID: <' . bin2hex(random_bytes(8)) . '@vokemon.xyz>' . "\r\n";
  // dot-stuffing for safety
  $body = preg_replace('/^\./m', '..', $html);
  $send = $cmd($headers . "\r\n" . $body . "\r\n.");
  $cmd('QUIT');
  fclose($fp);

  if (strpos($send, '250') === false) return [false, 'send: ' . trim($send)];
  return [true, 'ok'];
}

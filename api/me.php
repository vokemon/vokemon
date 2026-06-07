<?php
require __DIR__ . '/_lib.php';
start_sess();
json_out(['ok' => true, 'user' => $_SESSION['user'] ?? null]);

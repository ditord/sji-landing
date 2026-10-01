<?php
/**
 * SJI contact form handler — OPTIONAL
 * ---------------------------------------------------------------------------
 * Receives the form in index.html (#contact-form) and sends it by PHP mail().
 *
 * - Works with JS (fetch, JSON response) and without JS (303 redirect back to
 *   the page with ?contact=sent or ?contact=error).
 * - Spam protection: a honeypot field ("website") that people never see.
 * - Validation: name, email and message are required; lengths are capped;
 *   line breaks are stripped from anything that goes into a mail header.
 *
 * Don't want a form? Delete this file and the <form> block in index.html.
 * The mailto link in the Contact section works on its own.
 *
 * Plesk notes: PHP mail() must be enabled for the domain, and 'from' should be
 * an address on the site's own domain so SPF/DKIM pass and mail isn't junked.
 */

declare(strict_types=1);

/* ===================== CONFIG — edit these values ===================== */
$config = [
    // Set to false to switch the form off without removing it.
    'enabled'        => true,

    // Where messages are delivered.
    'to'             => 'info.sji.ngo@gmail.com',

    // TODO(email): sender address. It must be on the website's own domain
    // (e.g. no-reply@yourdomain.am), NOT a gmail.com address: mail sent from this
    // server "as" gmail.com fails SPF/DKIM checks and lands in spam or is rejected.
    // Replies still go to the visitor (Reply-To is set below).
    'from'           => 'no-reply@example.org',
    'from_name'      => 'SJI website',

    'subject'        => '[SJI website] New message',

    // Where visitors without JavaScript are sent after submitting.
    'redirect'       => '/',

    // Limits (keep in sync with the maxlength/minlength attributes in index.html)
    'max_name'       => 100,
    'max_org'        => 150,
    'min_message'    => 10,
    'max_message'    => 5000,
];
/* ===================================================================== */

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

/**
 * Send the response in the format the client asked for, then stop.
 */
function respond(bool $ok, array $errors, int $status, array $config, bool $wantsJson): void
{
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'errors' => $errors]);
    } else {
        $target = $config['redirect'] . '?contact=' . ($ok ? 'sent' : 'error') . '#contact';
        header('Location: ' . $target, true, 303);
    }
    exit;
}

/** Single-line, trimmed text with control characters (incl. CR/LF) removed. */
function clean_line(string $value): string
{
    return trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '');
}

/** Multi-line text: normalise newlines, drop other control characters. */
function clean_text(string $value): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    return trim(preg_replace('/[\x00-\x08\x0B-\x1F\x7F]+/u', '', $value) ?? '');
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function encode_header(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

// --- Method & switch ----------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Method Not Allowed';
    exit;
}

if (!$config['enabled']) {
    respond(false, [], 503, $config, $wantsJson);
}

// --- Honeypot: bots fill it; pretend success so they move on --------------
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(true, [], 200, $config, $wantsJson);
}

// --- Read & validate ------------------------------------------------------
$name    = clean_line((string) ($_POST['name'] ?? ''));
$email   = clean_line((string) ($_POST['email'] ?? ''));
$org     = clean_line((string) ($_POST['organization'] ?? ''));
$message = clean_text((string) ($_POST['message'] ?? ''));

$errors = [];

if ($name === '' || text_length($name) > $config['max_name']) {
    $errors[] = 'name';
}
if (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    $errors[] = 'email';
}
$msgLen = text_length($message);
if ($msgLen < $config['min_message'] || $msgLen > $config['max_message']) {
    $errors[] = 'message';
}
if (text_length($org) > $config['max_org']) {
    $org = function_exists('mb_substr') ? mb_substr($org, 0, $config['max_org'], 'UTF-8') : substr($org, 0, $config['max_org']);
}

if ($errors) {
    respond(false, $errors, 422, $config, $wantsJson);
}

// --- Send -----------------------------------------------------------------
$body = "New message from the SJI website\n"
      . "--------------------------------\n\n"
      . "Name:         {$name}\n"
      . "Email:        {$email}\n"
      . "Organization: " . ($org !== '' ? $org : '—') . "\n"
      . "Sent:         " . gmdate('Y-m-d H:i') . " UTC\n\n"
      . "Message:\n{$message}\n";

$headers = [
    'From'                      => encode_header($config['from_name']) . ' <' . $config['from'] . '>',
    'Reply-To'                  => $email, // validated above, no CR/LF possible
    'MIME-Version'              => '1.0',
    'Content-Type'              => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer'                  => 'SJI-contact-form',
];
$headerLines = '';
foreach ($headers as $key => $value) {
    $headerLines .= $key . ': ' . $value . "\r\n";
}

// Envelope sender (-f) helps deliverability on most Plesk/sendmail setups.
$params = filter_var($config['from'], FILTER_VALIDATE_EMAIL) ? '-f' . $config['from'] : '';

$sent = @mail($config['to'], encode_header($config['subject']), $body, rtrim($headerLines), $params);

if (!$sent) {
    error_log('SJI contact form: mail() failed');
    respond(false, [], 500, $config, $wantsJson);
}

respond(true, [], 200, $config, $wantsJson);

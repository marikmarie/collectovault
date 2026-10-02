<?php
declare(strict_types=1);

use Vault\CardPaymentsController;
use Vault\CardPaymentsService;
use Vault\CollectoController;
use Vault\CollectoService;
use Vault\Config;
use Vault\Database;
use Vault\HttpException;
use Vault\LocalController;
use Vault\Response;
use Vault\VaultRepository;

require __DIR__ . '/bootstrap.php';

Config::load(__DIR__ . '/.env');
Response::cors();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$scriptName = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
if ($scriptName !== '/' && $scriptName !== '.' && str_starts_with($path, $scriptName)) {
    $path = substr($path, strlen($scriptName)) ?: '/';
}
$path = '/' . trim(rawurldecode($path), '/');
if ($path === '//') $path = '/';

try {
    $body = Response::jsonBody();
    $authorization = Response::header('Authorization');

    if ($method === 'GET' && $path === '/health') {
        Response::json(['status' => 'ok', 'service' => 'collecto-vault-api', 'runtime' => 'plain-php']);
    }

    $repository = new VaultRepository(Database::connection());
    $collecto = new CollectoController(new CollectoService(), $repository);
    $cards = new CardPaymentsController(new CardPaymentsService($repository));
    $local = new LocalController($repository);

    // Collecto merchant API proxy routes.
    if ($method === 'POST' && $path === '/auth') $collecto->auth($body);
    if ($method === 'POST' && $path === '/authVerify') $collecto->authVerify($body);
    if ($method === 'POST' && $path === '/setUsername') $collecto->setUsername($body, $authorization);
    if ($method === 'POST' && $path === '/getByUsername') $collecto->getByUsername($body);
    if ($method === 'POST' && $path === '/requestToPay') $collecto->requestToPay($body, $authorization);
    if ($method === 'POST' && $path === '/requestToPayStatus') $collecto->requestToPayStatus($body, $authorization);
    if ($method === 'POST' && $path === '/verifyPhoneNumber') $collecto->verifyPhoneNumber($body, $authorization);
    if ($method === 'POST' && $path === '/services') $collecto->services($body, $authorization);
    if ($method === 'POST' && $path === '/invoiceDetails') $collecto->invoiceDetails($body, $authorization);
    if ($method === 'POST' && $path === '/invoice') $collecto->invoice($body, $authorization);
    if ($method === 'POST' && $path === '/loyaltySettings') $collecto->loyaltySettings($body, $authorization);

    // Pegasus hosted-card routes.
    if ($method === 'POST' && $path === '/pegasus/card-collections') $cards->create($body, $authorization);
    if ($method === 'GET' && preg_match('#^/pegasus/card-collections/([A-Za-z0-9_-]{1,60})$#', $path, $m)) {
        $cards->status($m[1], $_GET, $authorization);
    }
    if ($method === 'POST' && preg_match('#^/pegasus/card-collections/([A-Za-z0-9_-]{1,60})/complete$#', $path, $m)) {
        $cards->complete($m[1], $body, $authorization);
    }

    // Ratings.
    if ($method === 'POST' && $path === '/ratings') $local->createRating($body);
    if ($method === 'GET' && preg_match('#^/ratings/transaction/(\d+)$#', $path, $m)) $local->ratingForTransaction((int) $m[1]);
    if ($method === 'GET' && preg_match('#^/ratings/customer/(\d+)/average$#', $path, $m)) $local->ratingAverage((int) $m[1]);
    if ($method === 'GET' && preg_match('#^/ratings/customer/(\d+)$#', $path, $m)) $local->ratingsForCustomer((int) $m[1], $_GET);
    if ($method === 'GET' && preg_match('#^/ratings/(\d+)$#', $path, $m)) $local->rating((int) $m[1]);
    if ($method === 'PATCH' && preg_match('#^/ratings/(\d+)$#', $path, $m)) $local->updateRating((int) $m[1], $body);
    if ($method === 'DELETE' && preg_match('#^/ratings/(\d+)$#', $path, $m)) $local->deleteRating((int) $m[1]);

    // Feedback.
    if ($method === 'POST' && $path === '/feedback') $local->createFeedback($body);
    if ($method === 'GET' && preg_match('#^/feedback/customer/(\d+)$#', $path, $m)) $local->feedbackForCustomer((int) $m[1], $_GET);
    if ($method === 'GET' && preg_match('#^/feedback/status/([A-Za-z-]+)$#', $path, $m)) $local->feedbackForStatus($m[1], $_GET);
    if ($method === 'GET' && $path === '/feedback/stats/open-count') $local->openFeedbackCount();
    if ($method === 'GET' && preg_match('#^/feedback/(\d+)$#', $path, $m)) $local->feedback((int) $m[1]);
    if ($method === 'PATCH' && preg_match('#^/feedback/(\d+)/resolve$#', $path, $m)) $local->resolveFeedback((int) $m[1]);
    if ($method === 'PATCH' && preg_match('#^/feedback/(\d+)/close$#', $path, $m)) $local->closeFeedback((int) $m[1]);
    if ($method === 'PATCH' && preg_match('#^/feedback/(\d+)$#', $path, $m)) $local->updateFeedback((int) $m[1], $body);
    if ($method === 'DELETE' && preg_match('#^/feedback/(\d+)$#', $path, $m)) $local->deleteFeedback((int) $m[1]);

    // Customer-support chat.
    if ($method === 'POST' && $path === '/chat') $local->createChatMessage($body);
    if ($method === 'GET' && preg_match('#^/chat/customer/(\d+)/unread$#', $path, $m)) $local->unreadMessages((int) $m[1]);
    if ($method === 'GET' && preg_match('#^/chat/customer/(\d+)$#', $path, $m)) $local->chatForCustomer((int) $m[1], $_GET);
    if ($method === 'PATCH' && preg_match('#^/chat/customer/(\d+)/read-all$#', $path, $m)) $local->markAllChatRead((int) $m[1]);
    if ($method === 'POST' && preg_match('#^/chat/(\d+)/support-reply$#', $path, $m)) $local->supportReply((int) $m[1], $body);
    if ($method === 'GET' && preg_match('#^/chat/(\d+)$#', $path, $m)) $local->chatMessage((int) $m[1]);
    if ($method === 'PATCH' && preg_match('#^/chat/(\d+)/read$#', $path, $m)) $local->markChatRead((int) $m[1]);
    if ($method === 'DELETE' && preg_match('#^/chat/(\d+)$#', $path, $m)) $local->deleteChatMessage((int) $m[1]);

    // Customer and business contacts.
    if ($method === 'POST' && $path === '/contacts/whatsapp/user') $local->setUserWhatsApp($body);
    if ($method === 'GET' && preg_match('#^/contacts/whatsapp/user/(\d+)/url$#', $path, $m)) $local->userWhatsAppUrl((int) $m[1]);
    if ($method === 'GET' && preg_match('#^/contacts/whatsapp/user/(\d+)$#', $path, $m)) $local->userWhatsApp((int) $m[1]);
    if ($method === 'DELETE' && preg_match('#^/contacts/whatsapp/user/(\d+)$#', $path, $m)) $local->deleteUserWhatsApp((int) $m[1]);
    if ($method === 'POST' && $path === '/contacts/whatsapp/business') $local->setBusinessContact('whatsapp', $body);
    if ($method === 'GET' && $path === '/contacts/whatsapp/business/url') $local->businessWhatsAppUrl();
    if ($method === 'GET' && $path === '/contacts/whatsapp/business') $local->businessContact('whatsapp');
    if ($method === 'POST' && $path === '/contacts/email/business') $local->setBusinessContact('email', $body);
    if ($method === 'GET' && $path === '/contacts/email/business') $local->businessContact('email');
    if ($method === 'POST' && $path === '/contacts/phone/business') $local->setBusinessContact('phone', $body);
    if ($method === 'GET' && $path === '/contacts/phone/business') $local->businessContact('phone');
    if ($method === 'GET' && $path === '/contacts/business/all') $local->allBusinessContacts();

    throw new HttpException(404, 'Route not found');
} catch (HttpException $error) {
    Response::json(['message' => $error->getMessage(), ...$error->details()], $error->status());
} catch (Throwable $error) {
    error_log('[Vault API] ' . $error->getMessage());
    Response::json(['message' => 'An unexpected server error occurred.'], 500);
}

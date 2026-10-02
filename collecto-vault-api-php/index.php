<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    vault_apply_cors();
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method === 'OPTIONS') vault_respond([], 204);

    $path = vault_request_path();
    $input = in_array($method, ['POST', 'PATCH', 'PUT', 'DELETE'], true) ? vault_json_input() : [];

    if ($method === 'GET' && $path === '/health') {
        vault_respond(['status' => 'ok', 'service' => 'collecto-vault-api-php']);
    }

    /* Authentication and Collecto account routes */
    if ($method === 'POST' && $path === '/auth') {
        if ($input === []) throw new ApiException(400, 'Request body is required.');
        vault_forward_collecto('POST', '/auth', $input);
    }
    if ($method === 'POST' && $path === '/authVerify') {
        vault_forward_collecto('POST', '/authVerify', $input);
    }
    if ($method === 'POST' && $path === '/setUsername') {
        $clientId = vault_required($input, 'clientId');
        $username = trim((string) vault_required($input, 'username'));
        $action = isset($input['action']) ? (string) $input['action'] : null;
        if ($action !== null && !in_array($action, ['create', 'update'], true)) throw new ApiException(400, 'Action must be either create or update.');
        if (strlen($username) < 3 || strlen($username) > 100 || preg_match('/^[a-zA-Z0-9_-]+$/', $username) !== 1) {
            throw new ApiException(400, 'Username must be 3–100 letters, numbers, underscores, or hyphens.');
        }
        $response = vault_collecto_request('POST', '/clientUsername', $input);
        if ($response['status'] >= 400) vault_respond($response['data'] ?? ['message' => 'Could not set username.'], $response['status']);
        $result = is_array($response['data']) ? ($response['data']['data'] ?? []) : [];
        vault_respond([
            'success' => true,
            'message' => is_array($result) ? ($result['message'] ?? 'Username set successfully') : 'Username set successfully',
            'data' => [
                'clientId' => $clientId,
                'username' => is_array($result) ? ($result['clientUsername'] ?? $username) : $username,
                'status' => is_array($response['data']) ? ($response['data']['status_message'] ?? 'success') : 'success',
            ],
        ]);
    }
    if ($method === 'POST' && $path === '/getByUsername') {
        $username = trim((string) vault_required($input, 'username'));
        vault_forward_collecto('POST', '/getByUsername', ['username' => $username]);
    }

    /* Secure Pegasus hosted-card collection routes */
    if ($method === 'POST' && $path === '/pegasus/card-collections') {
        vault_require_session();
        $amount = vault_amount(vault_required($input, 'amount'));
        if ($amount === null) throw new ApiException(400, 'Enter a valid card payment amount.');
        vault_required($input, 'collectoId');
        vault_required($input, 'clientId');
        $payload = [
            'amount' => (string) $amount,
            'currency' => 'UGX',
            'description' => vault_card_description($input['description'] ?? null, 'Collecto Vault payment'),
        ];
        if (!empty($input['customerName']) && is_string($input['customerName'])) $payload['customer_name'] = substr(vault_card_description($input['customerName'], 'Collecto Vault customer'), 0, 120);
        if (!empty($input['customerEmail']) && is_string($input['customerEmail'])) $payload['customer_email'] = trim($input['customerEmail']);
        $response = vault_card_request('POST', '/api/v1/pegasus/card-collections', $payload);
        if ($response['status'] >= 400) {
            $status = $response['status'] < 500 ? $response['status'] : 503;
            vault_respond(['message' => vault_upstream_message($response['data'], 'Unable to start card checkout.')], $status);
        }
        $collection = is_array($response['data']) ? ($response['data']['data'] ?? null) : null;
        if (!is_array($collection) || empty($collection['id']) || empty($collection['checkout_url'])) {
            throw new ApiException(502, 'Card checkout service returned an invalid response.');
        }
        vault_respond(['data' => $collection], 201);
    }
    if ($method === 'GET' && preg_match('#^/pegasus/card-collections/([^/]+)$#', $path, $matches)) {
        vault_require_session();
        $id = vault_card_id($matches[1]);
        $refresh = filter_var($_GET['refresh'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $response = vault_card_request('GET', '/api/v1/pegasus/card-collections/' . rawurlencode($id) . ($refresh ? '?refresh=true' : ''));
        if ($response['status'] >= 400) {
            $status = $response['status'] < 500 ? $response['status'] : 503;
            vault_respond(['message' => vault_upstream_message($response['data'], 'Unable to check card payment.')], $status);
        }
        vault_respond(['data' => is_array($response['data']) ? ($response['data']['data'] ?? null) : null]);
    }
    if ($method === 'POST' && preg_match('#^/pegasus/card-collections/([^/]+)/complete$#', $path, $matches)) {
        vault_require_session();
        $id = vault_card_id($matches[1]);
        vault_required($input, 'collectoId');
        vault_required($input, 'clientId');
        vault_required($input, 'reference');

        $card = vault_card_request('GET', '/api/v1/pegasus/card-collections/' . rawurlencode($id) . '?refresh=true');
        if ($card['status'] >= 400) {
            $status = $card['status'] < 500 ? $card['status'] : 503;
            vault_respond(['message' => vault_upstream_message($card['data'], 'Unable to verify card payment.')], $status);
        }
        $collection = is_array($card['data']) ? ($card['data']['data'] ?? null) : null;
        if (!is_array($collection) || strtoupper((string) ($collection['status'] ?? 'PENDING')) !== 'SUCCESS') {
            vault_respond([
                'status' => strtolower((string) ($collection['status'] ?? 'PENDING')),
                'message' => is_array($collection) ? ($collection['reason'] ?? 'Card payment is not confirmed yet.') : 'Card payment is not confirmed yet.',
                'data' => $collection,
            ], 409);
        }
        $charged = vault_amount($collection['amount'] ?? null);
        $expected = vault_amount($input['cardAmount'] ?? ($input['amount'] ?? null));
        if ($charged === null || $expected === null || abs($charged - $expected) > 0.00001) {
            throw new ApiException(409, 'The confirmed card amount does not match this payment.');
        }

        $reservation = vault_reserve_card_completion($id);
        if ($reservation === 'completed') {
            $existing = vault_card_completion($id);
            vault_respond($existing['response'] ?? ['status' => 'confirmed']);
        }
        if ($reservation === 'processing') {
            vault_respond(['status' => 'processing', 'message' => 'Your confirmed card payment is being applied.'], 202);
        }

        try {
            unset($input['cardAmount']);
            $input['paymentOption'] = 'card';
            $input['cardCollectionId'] = $id;
            if (!empty($collection['provider_transaction_id'])) $input['cardTransactionId'] = $collection['provider_transaction_id'];
            $response = vault_collecto_request('POST', '/requestToPay', $input);
            if ($response['status'] >= 400) {
                vault_release_card_completion($id);
                vault_respond($response['data'] ?? ['message' => 'Unable to apply the confirmed card payment.'], $response['status']);
            }
            $collecto = is_array($response['data']) ? $response['data'] : [];
            $data = is_array($collecto['data'] ?? null) ? $collecto['data'] : [];
            $result = [
                'status' => 'confirmed',
                'status_message' => $collecto['status_message'] ?? 'Card payment confirmed',
                'data' => [
                    'requestToPay' => false,
                    'transactionId' => $data['transactionId'] ?? $data['transaction_id'] ?? $data['id'] ?? $id,
                    'cardCollectionId' => $id,
                    'message' => $data['message'] ?? 'Your card payment has been confirmed.',
                ],
            ];
            vault_finish_card_completion($id, $result);
            vault_respond($result);
        } catch (Throwable $error) {
            vault_release_card_completion($id);
            throw $error;
        }
    }

    /* Core Vault-to-Collecto payment and customer routes */
    if ($method === 'POST' && $path === '/requestToPay') {
        vault_required($input, 'paymentOption');
        vault_required($input, 'collectoId');
        vault_required($input, 'clientId');
        if (isset($input['phone']) && is_string($input['phone'])) $input['phone'] = preg_replace('/^0/', '256', $input['phone']);
        $response = vault_collecto_request('POST', '/requestToPay', $input);
        if ($response['status'] >= 400) vault_respond($response['data'] ?? ['message' => 'Request to pay failed.'], $response['status']);
        $collecto = is_array($response['data']) ? $response['data'] : [];
        $data = is_array($collecto['data'] ?? null) ? $collecto['data'] : [];
        vault_respond([
            'status' => $collecto['status'] ?? '200',
            'status_message' => $collecto['status_message'] ?? 'success',
            'data' => [
                'requestToPay' => true,
                'message' => $data['message'] ?? 'Confirm payment via the prompt on your phone.',
                'transactionId' => $data['transactionId'] ?? $data['transaction_id'] ?? $data['id'] ?? null,
            ],
        ]);
    }
    if ($method === 'POST' && $path === '/requestToPayStatus') {
        $transactionId = vault_required($input, 'transactionId');
        $response = vault_collecto_request('POST', '/requestToPayStatus', $input);
        if ($response['status'] >= 400) vault_respond($response['data'] ?? ['message' => 'Collecto is unreachable.'], $response['status']);
        $data = is_array($response['data']) ? $response['data'] : [];
        $payment = is_array($data['data'] ?? null) ? $data['data'] : [];
        $providerStatus = strtolower((string) ($payment['status'] ?? $payment['paymentStatus'] ?? $payment['invoiceStatus'] ?? ($payment['invoice']['status'] ?? '')));
        $confirmed = str_contains($providerStatus, 'success') || str_contains($providerStatus, 'paid') || str_contains($providerStatus, 'confirmed');
        vault_respond(['transactionId' => $transactionId, 'status' => $confirmed ? 'confirmed' : 'pending', 'payment' => $payment]);
    }
    if ($method === 'POST' && $path === '/verifyPhoneNumber') {
        $phone = vault_required($input, 'phoneNumber');
        $payload = [
            'vaultOTPToken' => $input['vaultOTPToken'] ?? null,
            'collectoId' => $input['collectoId'] ?? null,
            'clientId' => $input['clientId'] ?? null,
            'phone' => $phone,
        ];
        vault_forward_collecto('POST', '/verifyPhoneNumber', $payload);
    }
    if ($method === 'POST' && $path === '/services') {
        if (empty($input['collectoId']) && empty($input['vaultOTPToken'])) throw new ApiException(400, 'collectoId is required in the request body.');
        $payload = [
            'vaultOTPToken' => $input['vaultOTPToken'] ?? null,
            'collectoId' => $input['collectoId'] ?? null,
            'page' => max(1, (int) ($input['page'] ?? 1)),
        ];
        vault_forward_collecto('POST', '/servicesAndProducts', $payload);
    }
    if ($method === 'POST' && $path === '/invoiceDetails') vault_forward_collecto('POST', '/invoiceDetails', $input);
    if ($method === 'POST' && $path === '/loyaltySettings') {
        vault_required($input, 'collectoId');
        vault_required($input, 'clientId');
        vault_forward_collecto('POST', '/loyaltySettings', ['collectoId' => $input['collectoId'], 'clientId' => $input['clientId']]);
    }
    if ($method === 'POST' && $path === '/invoice') {
        $items = $input['items'] ?? null;
        if (!is_array($items) || $items === []) throw new ApiException(400, 'Invalid or missing items.');
        $first = is_array($items[0] ?? null) ? $items[0] : [];
        $collectoId = $first['collectoId'] ?? ($input['collectoId'] ?? null);
        $clientId = $first['clientId'] ?? ($input['clientId'] ?? null);
        if (!$collectoId || !$clientId) throw new ApiException(400, 'collectoId and clientId are required.');
        $forwardItems = [];
        foreach ($items as $item) {
            if (!is_array($item)) throw new ApiException(400, 'Each invoice item must be an object.');
            $quantity = (float) ($item['quantity'] ?? $item['Quantity'] ?? $item['qty'] ?? 0);
            $total = (float) ($item['totalAmount'] ?? $item['total'] ?? $item['amount'] ?? 0);
            $unit = isset($item['amount']) && !isset($item['totalAmount']) ? (float) $item['amount'] : ($quantity > 0 ? $total / $quantity : $total);
            $forwardItems[] = ['serviceId' => $item['serviceId'] ?? null, 'serviceName' => $item['serviceName'] ?? null, 'amount' => $unit, 'quantity' => $quantity];
        }
        $computed = array_reduce($forwardItems, fn(float $sum, array $item): float => $sum + ($item['amount'] * $item['quantity']), 0.0);
        $payload = [
            'items' => $forwardItems,
            'amount' => array_key_exists('totalAmount', $input) ? (float) $input['totalAmount'] : $computed,
            'collectoId' => (string) $collectoId,
            'clientId' => (string) $clientId,
        ];
        if (!empty($input['vaultOTPToken'])) $payload['vaultOTPToken'] = $input['vaultOTPToken'];
        if (!empty($input['staffId'])) $payload['staffId'] = $input['staffId'];
        vault_forward_collecto('POST', '/createInvoice', $payload);
    }

    /* Explicit Collecto pass-through endpoints used by existing Vault clients. */
    if ($method === 'GET' && $path === '/users/all') {
        $collectoId = isset($_GET['collectoId']) ? rawurlencode((string) $_GET['collectoId']) : '';
        vault_forward_collecto('GET', '/users/all' . ($collectoId !== '' ? '?collectoId=' . $collectoId : ''));
    }
    if ($method === 'GET' && preg_match('#^/(pointRules|tier)/collecto/([^/]+)$#', $path, $matches)) {
        vault_forward_collecto('GET', '/' . $matches[1] . '/collecto/' . rawurlencode($matches[2]));
    }
    if ($method === 'POST' && $path === '/customers') vault_forward_collecto('POST', '/customers', $input);
    if ($method === 'POST' && preg_match('#^/customers/([^/]+)/(offers/redeemable|tier-benefits)$#', $path, $matches)) {
        $query = $matches[2] === 'tier-benefits' && isset($_GET['tier']) ? '?tier=' . rawurlencode((string) $_GET['tier']) : '';
        vault_forward_collecto('POST', '/customers/' . rawurlencode($matches[1]) . '/' . $matches[2] . $query, $input);
    }

    /* Ratings */
    if ($method === 'POST' && $path === '/ratings') {
        $clientId = vault_positive_int((string) vault_required($input, 'clientId'), 'clientId');
        $transactionId = vault_positive_int((string) vault_required($input, 'transactionId'), 'transactionId');
        $ratings = [];
        foreach (['orderRating', 'paymentRating', 'serviceRating', 'overallRating'] as $key) {
            $rating = filter_var(vault_required($input, $key), FILTER_VALIDATE_INT);
            if ($rating === false || $rating < 1 || $rating > 5) throw new ApiException(400, 'All ratings must be between 1 and 5 stars.');
            $ratings[$key] = $rating;
        }
        $pdo = vault_pdo();
        $existing = $pdo->prepare('SELECT id FROM ratings WHERE transactionId = ?');
        $existing->execute([$transactionId]);
        if ($existing->fetch()) throw new ApiException(409, 'This transaction has already been rated.');
        $insert = $pdo->prepare('INSERT INTO ratings (clientId, transactionId, orderRating, paymentRating, serviceRating, overallRating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$clientId, $transactionId, $ratings['orderRating'], $ratings['paymentRating'], $ratings['serviceRating'], $ratings['overallRating'], isset($input['comment']) ? trim((string) $input['comment']) : null]);
        $row = $pdo->query('SELECT * FROM ratings WHERE id = ' . (int) $pdo->lastInsertId())->fetch();
        vault_respond(vault_map_row($row ?: []), 201);
    }
    if ($method === 'GET' && preg_match('#^/ratings/transaction/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM ratings WHERE transactionId = ?');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'No rating found for this transaction.');
        vault_respond(vault_map_row($row));
    }
    if ($method === 'GET' && preg_match('#^/ratings/customer/(\d+)/average$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT AVG(orderRating) AS avgOrderRating, AVG(paymentRating) AS avgPaymentRating, AVG(serviceRating) AS avgServiceRating, AVG(overallRating) AS avgOverallRating, COUNT(*) AS totalRatings FROM ratings WHERE clientId = ?');
        $statement->execute([(int) $matches[1]]);
        vault_respond($statement->fetch() ?: ['avgOrderRating' => null, 'avgPaymentRating' => null, 'avgServiceRating' => null, 'avgOverallRating' => null, 'totalRatings' => 0]);
    }
    if ($method === 'GET' && preg_match('#^/ratings/customer/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM ratings WHERE clientId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?');
        $statement->bindValue(1, (int) $matches[1], PDO::PARAM_INT);
        $statement->bindValue(2, vault_query_int('limit', 10, 1, 100), PDO::PARAM_INT);
        $statement->bindValue(3, vault_query_int('offset', 0, 0, 10000), PDO::PARAM_INT);
        $statement->execute();
        vault_respond(array_map('vault_map_row', $statement->fetchAll()));
    }
    if ($method === 'GET' && preg_match('#^/ratings/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM ratings WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'Rating not found.');
        vault_respond(vault_map_row($row));
    }
    if ($method === 'PATCH' && preg_match('#^/ratings/(\d+)$#', $path, $matches)) {
        $allowed = ['orderRating', 'paymentRating', 'serviceRating', 'overallRating', 'comment'];
        $set = []; $values = [];
        foreach ($allowed as $key) {
            if (!array_key_exists($key, $input)) continue;
            if ($key !== 'comment' && (!is_numeric($input[$key]) || (int) $input[$key] < 1 || (int) $input[$key] > 5)) throw new ApiException(400, 'All ratings must be between 1 and 5 stars.');
            $set[] = "{$key} = ?";
            $values[] = $key === 'comment' ? trim((string) $input[$key]) : (int) $input[$key];
        }
        if ($set === []) throw new ApiException(400, 'No rating fields to update.');
        $statement = vault_pdo()->prepare('UPDATE ratings SET ' . implode(', ', $set) . ', updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
        $statement->execute([...$values, (int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Rating not found.');
        vault_respond(['message' => 'Rating updated successfully']);
    }
    if ($method === 'DELETE' && preg_match('#^/ratings/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('DELETE FROM ratings WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Rating not found.');
        vault_respond(['message' => 'Rating deleted successfully']);
    }

    /* Feedback */
    if ($method === 'POST' && $path === '/feedback') {
        $clientId = vault_positive_int((string) vault_required($input, 'clientId'), 'clientId');
        $type = (string) vault_required($input, 'feedbackType');
        $title = trim((string) vault_required($input, 'title'));
        $message = trim((string) vault_required($input, 'message'));
        if (!in_array($type, ['order', 'service', 'app', 'general'], true)) throw new ApiException(400, 'Invalid feedback type.');
        if ($title === '' || strlen($title) > 255 || $message === '') throw new ApiException(400, 'Feedback title and message are required; title must be 255 characters or fewer.');
        $statement = vault_pdo()->prepare('INSERT INTO feedback (clientId, feedbackType, title, message, attachments, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $statement->execute([$clientId, $type, $title, $message, vault_encode_attachments($input['attachments'] ?? null), 'open', 'medium']);
        $row = vault_pdo()->query('SELECT * FROM feedback WHERE id = ' . (int) vault_pdo()->lastInsertId())->fetch();
        vault_respond(vault_map_row($row ?: []), 201);
    }
    if ($method === 'GET' && preg_match('#^/feedback/customer/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM feedback WHERE clientId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?');
        $statement->bindValue(1, (int) $matches[1], PDO::PARAM_INT);
        $statement->bindValue(2, vault_query_int('limit', 20, 1, 100), PDO::PARAM_INT);
        $statement->bindValue(3, vault_query_int('offset', 0, 0, 10000), PDO::PARAM_INT);
        $statement->execute();
        vault_respond(array_map('vault_map_row', $statement->fetchAll()));
    }
    if ($method === 'GET' && preg_match('#^/feedback/status/(open|in-progress|resolved|closed)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM feedback WHERE status = ? ORDER BY priority DESC, createdAt DESC LIMIT ? OFFSET ?');
        $statement->bindValue(1, $matches[1]);
        $statement->bindValue(2, vault_query_int('limit', 20, 1, 100), PDO::PARAM_INT);
        $statement->bindValue(3, vault_query_int('offset', 0, 0, 10000), PDO::PARAM_INT);
        $statement->execute();
        vault_respond(array_map('vault_map_row', $statement->fetchAll()));
    }
    if ($method === 'GET' && $path === '/feedback/stats/open-count') {
        $row = vault_pdo()->query("SELECT COUNT(*) AS count FROM feedback WHERE status = 'open'")->fetch();
        vault_respond(['openCount' => (int) ($row['count'] ?? 0)]);
    }
    if ($method === 'GET' && preg_match('#^/feedback/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM feedback WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'Feedback not found.');
        vault_respond(vault_map_row($row));
    }
    if ($method === 'PATCH' && preg_match('#^/feedback/(\d+)/(resolve|close)$#', $path, $matches)) {
        $status = $matches[2] === 'resolve' ? 'resolved' : 'closed';
        $statement = vault_pdo()->prepare('UPDATE feedback SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
        $statement->execute([$status, (int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Feedback not found.');
        vault_respond(['message' => $status === 'resolved' ? 'Feedback resolved' : 'Feedback closed']);
    }
    if ($method === 'PATCH' && preg_match('#^/feedback/(\d+)$#', $path, $matches)) {
        $allowed = ['title', 'message', 'status', 'priority', 'attachments'];
        $set = []; $values = [];
        foreach ($allowed as $key) {
            if (!array_key_exists($key, $input)) continue;
            if ($key === 'title' && (trim((string) $input[$key]) === '' || strlen((string) $input[$key]) > 255)) throw new ApiException(400, 'Title must be 1–255 characters.');
            if ($key === 'status' && !in_array($input[$key], ['open', 'in-progress', 'resolved', 'closed'], true)) throw new ApiException(400, 'Invalid feedback status.');
            if ($key === 'priority' && !in_array($input[$key], ['low', 'medium', 'high', 'critical'], true)) throw new ApiException(400, 'Invalid feedback priority.');
            $set[] = "{$key} = ?";
            $values[] = $key === 'attachments' ? vault_encode_attachments($input[$key]) : trim((string) $input[$key]);
        }
        if ($set === []) throw new ApiException(400, 'No feedback fields to update.');
        $statement = vault_pdo()->prepare('UPDATE feedback SET ' . implode(', ', $set) . ', updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
        $statement->execute([...$values, (int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Feedback not found.');
        vault_respond(['message' => 'Feedback updated successfully']);
    }
    if ($method === 'DELETE' && preg_match('#^/feedback/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('DELETE FROM feedback WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Feedback not found.');
        vault_respond(['message' => 'Feedback deleted successfully']);
    }

    /* Customer-support chat */
    if ($method === 'POST' && $path === '/chat') {
        $clientId = vault_positive_int((string) vault_required($input, 'clientId'), 'clientId');
        $senderType = (string) ($input['senderType'] ?? 'customer');
        $message = trim((string) vault_required($input, 'message'));
        if (!in_array($senderType, ['customer', 'support'], true)) throw new ApiException(400, 'Invalid sender type.');
        if ($message === '' || strlen($message) > 5000) throw new ApiException(400, 'Message must be between 1 and 5000 characters.');
        $statement = vault_pdo()->prepare('INSERT INTO chat_messages (clientId, senderType, message, attachments) VALUES (?, ?, ?, ?)');
        $statement->execute([$clientId, $senderType, $message, vault_encode_attachments($input['attachments'] ?? null)]);
        $row = vault_pdo()->query('SELECT * FROM chat_messages WHERE id = ' . (int) vault_pdo()->lastInsertId())->fetch();
        vault_respond(vault_map_row($row ?: []), 201);
    }
    if ($method === 'POST' && preg_match('#^/chat/(\d+)/support-reply$#', $path, $matches)) {
        $message = trim((string) vault_required($input, 'message'));
        if ($message === '' || strlen($message) > 5000) throw new ApiException(400, 'Message must be between 1 and 5000 characters.');
        $statement = vault_pdo()->prepare('INSERT INTO chat_messages (clientId, senderType, message, attachments) VALUES (?, ?, ?, ?)');
        $statement->execute([(int) $matches[1], 'support', $message, vault_encode_attachments($input['attachments'] ?? null)]);
        $row = vault_pdo()->query('SELECT * FROM chat_messages WHERE id = ' . (int) vault_pdo()->lastInsertId())->fetch();
        vault_respond(vault_map_row($row ?: []), 201);
    }
    if ($method === 'GET' && preg_match('#^/chat/customer/(\d+)/unread$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT COUNT(*) AS count FROM chat_messages WHERE clientId = ? AND isRead = FALSE');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        vault_respond(['unreadCount' => (int) ($row['count'] ?? 0)]);
    }
    if ($method === 'GET' && preg_match('#^/chat/customer/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM chat_messages WHERE clientId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?');
        $statement->bindValue(1, (int) $matches[1], PDO::PARAM_INT);
        $statement->bindValue(2, vault_query_int('limit', 50, 1, 100), PDO::PARAM_INT);
        $statement->bindValue(3, vault_query_int('offset', 0, 0, 10000), PDO::PARAM_INT);
        $statement->execute();
        vault_respond(array_reverse(array_map('vault_map_row', $statement->fetchAll())));
    }
    if ($method === 'PATCH' && preg_match('#^/chat/customer/(\d+)/read-all$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('UPDATE chat_messages SET isRead = TRUE, readAt = CURRENT_TIMESTAMP WHERE clientId = ? AND isRead = FALSE');
        $statement->execute([(int) $matches[1]]);
        vault_respond(['message' => 'All messages marked as read']);
    }
    if ($method === 'GET' && preg_match('#^/chat/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM chat_messages WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'Message not found.');
        vault_respond(vault_map_row($row));
    }
    if ($method === 'PATCH' && preg_match('#^/chat/(\d+)/read$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('UPDATE chat_messages SET isRead = TRUE, readAt = CURRENT_TIMESTAMP WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Message not found.');
        vault_respond(['message' => 'Message marked as read']);
    }
    if ($method === 'DELETE' && preg_match('#^/chat/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('DELETE FROM chat_messages WHERE id = ?');
        $statement->execute([(int) $matches[1]]);
        if ($statement->rowCount() === 0) throw new ApiException(404, 'Message not found.');
        vault_respond(['message' => 'Message deleted successfully']);
    }

    /* User and business contact details */
    if ($method === 'POST' && $path === '/contacts/whatsapp/user') {
        $clientId = vault_positive_int((string) vault_required($input, 'clientId'), 'clientId');
        $number = trim((string) vault_required($input, 'whatsappNumber'));
        if (preg_match('/^\+?[1-9]\d{1,14}$/', $number) !== 1) throw new ApiException(400, 'Invalid WhatsApp number format.');
        $statement = vault_pdo()->prepare('INSERT INTO whatsapp_contacts (clientId, whatsappNumber, isPreferred) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE whatsappNumber = VALUES(whatsappNumber), updatedAt = CURRENT_TIMESTAMP');
        $statement->execute([$clientId, $number]);
        $fetch = vault_pdo()->prepare('SELECT * FROM whatsapp_contacts WHERE clientId = ? AND isPreferred = TRUE');
        $fetch->execute([$clientId]);
        vault_respond(vault_map_row($fetch->fetch() ?: []), 201);
    }
    if ($method === 'GET' && preg_match('#^/contacts/whatsapp/user/(\d+)/url$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT whatsappNumber FROM whatsapp_contacts WHERE clientId = ? AND isPreferred = TRUE');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'No WhatsApp contact found.');
        vault_respond(['whatsappUrl' => 'https://wa.me/' . preg_replace('/\D/', '', (string) $row['whatsappNumber'])]);
    }
    if ($method === 'GET' && preg_match('#^/contacts/whatsapp/user/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM whatsapp_contacts WHERE clientId = ? AND isPreferred = TRUE');
        $statement->execute([(int) $matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'No WhatsApp contact found.');
        vault_respond(vault_map_row($row));
    }
    if ($method === 'DELETE' && preg_match('#^/contacts/whatsapp/user/(\d+)$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('DELETE FROM whatsapp_contacts WHERE clientId = ?');
        $statement->execute([(int) $matches[1]]);
        vault_respond(['message' => 'WhatsApp contact deleted successfully']);
    }
    if ($method === 'POST' && preg_match('#^/contacts/(whatsapp|email|phone)/business$#', $path, $matches)) {
        $type = $matches[1];
        $inputKey = $type === 'whatsapp' ? 'whatsappNumber' : $type;
        $value = trim((string) vault_required($input, $inputKey));
        if (($type === 'whatsapp' || $type === 'phone') && preg_match('/^\+?[1-9]\d{1,14}$/', $value) !== 1) throw new ApiException(400, 'Invalid phone number format.');
        if ($type === 'email' && filter_var($value, FILTER_VALIDATE_EMAIL) === false) throw new ApiException(400, 'Invalid email format.');
        $statement = vault_pdo()->prepare('INSERT INTO business_contacts (contactType, value, isActive) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE value = VALUES(value), isActive = TRUE, updatedAt = CURRENT_TIMESTAMP');
        $statement->execute([$type, $value]);
        $fetch = vault_pdo()->prepare('SELECT * FROM business_contacts WHERE contactType = ? AND isActive = TRUE');
        $fetch->execute([$type]);
        vault_respond(vault_map_row($fetch->fetch() ?: []), 201);
    }
    if ($method === 'GET' && $path === '/contacts/whatsapp/business/url') {
        $statement = vault_pdo()->query("SELECT value FROM business_contacts WHERE contactType = 'whatsapp' AND isActive = TRUE");
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'No business WhatsApp contact configured.');
        vault_respond(['whatsappUrl' => 'https://wa.me/' . preg_replace('/\D/', '', (string) $row['value'])]);
    }
    if ($method === 'GET' && preg_match('#^/contacts/(whatsapp|email|phone)/business$#', $path, $matches)) {
        $statement = vault_pdo()->prepare('SELECT * FROM business_contacts WHERE contactType = ? AND isActive = TRUE');
        $statement->execute([$matches[1]]);
        $row = $statement->fetch();
        if (!$row) throw new ApiException(404, 'Business contact is not configured.');
        vault_respond(vault_map_row($row));
    }
    if ($method === 'GET' && $path === '/contacts/business/all') {
        $rows = vault_pdo()->query('SELECT * FROM business_contacts WHERE isActive = TRUE')->fetchAll();
        $contacts = [];
        foreach ($rows as $row) {
            $mapped = vault_map_row($row);
            $contacts[$mapped['contactType']] = $mapped;
        }
        vault_respond($contacts);
    }

    throw new ApiException(404, 'Route not found.');
} catch (ApiException $error) {
    vault_error($error);
} catch (PDOException $error) {
    vault_log('Database error', ['code' => $error->getCode()]);
    vault_respond(['message' => 'Database operation failed.'], 500);
} catch (JsonException $error) {
    vault_log('JSON error', ['message' => $error->getMessage()]);
    vault_respond(['message' => 'Unable to encode the API response.'], 500);
} catch (Throwable $error) {
    vault_log('Unexpected error', ['message' => $error->getMessage()]);
    vault_respond(['message' => 'Internal server error.'], 500);
}

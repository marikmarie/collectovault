<?php
declare(strict_types=1);

namespace Vault\Repositories;

use PDO;
use PDOException;
use Vault\Support\HttpException;

final class VaultRepository
{
    public function __construct(private PDO $db)
    {
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function chat(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'clientId' => (int) $row['client_id'],
            'senderType' => $row['sender_type'],
            'message' => $row['message'],
            'attachments' => $row['attachments'] ? json_decode($row['attachments'], true) : null,
            'isRead' => (bool) $row['is_read'],
            'readAt' => $row['read_at'],
            'createdAt' => $row['created_at'],
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function feedback(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'clientId' => (int) $row['client_id'],
            'feedbackType' => $row['feedback_type'],
            'title' => $row['title'],
            'message' => $row['message'],
            'attachments' => $row['attachments'] ? json_decode($row['attachments'], true) : null,
            'status' => $row['status'],
            'priority' => $row['priority'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function rating(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'clientId' => (int) $row['client_id'],
            'transactionId' => (int) $row['transaction_id'],
            'orderRating' => (int) $row['order_rating'],
            'paymentRating' => (int) $row['payment_rating'],
            'serviceRating' => (int) $row['service_rating'],
            'overallRating' => (int) $row['overall_rating'],
            'comment' => $row['comment'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function contact(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'clientId' => isset($row['client_id']) ? (int) $row['client_id'] : null,
            'whatsappNumber' => $row['whatsapp_number'] ?? null,
            'contactType' => $row['contact_type'] ?? null,
            'value' => $row['value'] ?? null,
            'isPreferred' => isset($row['is_preferred']) ? (bool) $row['is_preferred'] : null,
            'isActive' => isset($row['is_active']) ? (bool) $row['is_active'] : null,
            'verifiedAt' => $row['verified_at'] ?? null,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    /** @param list<mixed>|null $attachments @return array<string, mixed> */
    public function createChat(int $clientId, string $senderType, string $message, ?array $attachments): array
    {
        $query = $this->db->prepare(
            'INSERT INTO vault_chat_messages (client_id, sender_type, message, attachments) VALUES (?, ?, ?, ?)',
        );
        $query->execute([
            $clientId,
            $senderType,
            $message,
            $attachments ? json_encode($attachments, JSON_THROW_ON_ERROR) : null,
        ]);

        return $this->requireChat((int) $this->db->lastInsertId());
    }

    /** @return array<string, mixed> */
    public function requireChat(int $id): array
    {
        $query = $this->db->prepare('SELECT * FROM vault_chat_messages WHERE id = ?');
        $query->execute([$id]);
        $row = $query->fetch();

        if (!$row) {
            throw new HttpException(404, 'Message not found');
        }

        return $this->chat($row);
    }

    /** @return list<array<string, mixed>> */
    public function chats(int $clientId, int $limit, int $offset): array
    {
        $query = $this->db->prepare(
            'SELECT * FROM vault_chat_messages WHERE client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        );
        $query->bindValue(1, $clientId, PDO::PARAM_INT);
        $query->bindValue(2, $limit, PDO::PARAM_INT);
        $query->bindValue(3, $offset, PDO::PARAM_INT);
        $query->execute();

        return array_reverse(array_map(fn (array $row): array => $this->chat($row), $query->fetchAll()));
    }

    public function readChat(int $id): void
    {
        $this->requireChat($id);
        $query = $this->db->prepare(
            'UPDATE vault_chat_messages SET is_read = 1, read_at = UTC_TIMESTAMP() WHERE id = ?',
        );
        $query->execute([$id]);
    }

    public function readAllChats(int $clientId): void
    {
        $query = $this->db->prepare(
            'UPDATE vault_chat_messages SET is_read = 1, read_at = UTC_TIMESTAMP() WHERE client_id = ? AND is_read = 0',
        );
        $query->execute([$clientId]);
    }

    public function unreadChats(int $clientId): int
    {
        $query = $this->db->prepare('SELECT COUNT(*) FROM vault_chat_messages WHERE client_id = ? AND is_read = 0');
        $query->execute([$clientId]);

        return (int) $query->fetchColumn();
    }

    public function deleteChat(int $id): void
    {
        $this->requireChat($id);
        $query = $this->db->prepare('DELETE FROM vault_chat_messages WHERE id = ?');
        $query->execute([$id]);
    }

    /** @param list<mixed>|null $attachments @return array<string, mixed> */
    public function createFeedback(
        int $clientId,
        string $type,
        string $title,
        string $message,
        ?array $attachments,
    ): array {
        $query = $this->db->prepare(
            'INSERT INTO vault_feedback (client_id, feedback_type, title, message, attachments) VALUES (?, ?, ?, ?, ?)',
        );
        $query->execute([
            $clientId,
            $type,
            $title,
            $message,
            $attachments ? json_encode($attachments, JSON_THROW_ON_ERROR) : null,
        ]);

        return $this->requireFeedback((int) $this->db->lastInsertId());
    }

    /** @return array<string, mixed> */
    public function requireFeedback(int $id): array
    {
        $query = $this->db->prepare('SELECT * FROM vault_feedback WHERE id = ?');
        $query->execute([$id]);
        $row = $query->fetch();

        if (!$row) {
            throw new HttpException(404, 'Feedback not found');
        }

        return $this->feedback($row);
    }

    /** @return list<array<string, mixed>> */
    public function feedbackForCustomer(int $clientId, int $limit, int $offset): array
    {
        $query = $this->db->prepare(
            'SELECT * FROM vault_feedback WHERE client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        );
        $query->bindValue(1, $clientId, PDO::PARAM_INT);
        $query->bindValue(2, $limit, PDO::PARAM_INT);
        $query->bindValue(3, $offset, PDO::PARAM_INT);
        $query->execute();

        return array_map(fn (array $row): array => $this->feedback($row), $query->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function feedbackForStatus(string $status, int $limit, int $offset): array
    {
        $query = $this->db->prepare(
            'SELECT * FROM vault_feedback WHERE status = ? '
            . 'ORDER BY FIELD(priority, "critical", "high", "medium", "low"), created_at DESC LIMIT ? OFFSET ?',
        );
        $query->bindValue(1, $status);
        $query->bindValue(2, $limit, PDO::PARAM_INT);
        $query->bindValue(3, $offset, PDO::PARAM_INT);
        $query->execute();

        return array_map(fn (array $row): array => $this->feedback($row), $query->fetchAll());
    }

    /** @param array<string, mixed> $changes */
    public function updateFeedback(int $id, array $changes): void
    {
        $this->requireFeedback($id);
        $allowed = [
            'title' => 'title',
            'message' => 'message',
            'status' => 'status',
            'priority' => 'priority',
            'attachments' => 'attachments',
        ];
        $sets = [];
        $values = [];

        foreach ($allowed as $key => $column) {
            if (!array_key_exists($key, $changes)) {
                continue;
            }

            $sets[] = "{$column} = ?";
            $values[] = $key === 'attachments'
                ? ($changes[$key] === null ? null : json_encode($changes[$key], JSON_THROW_ON_ERROR))
                : $changes[$key];
        }

        if ($sets === []) {
            return;
        }

        $values[] = $id;
        $query = $this->db->prepare(
            'UPDATE vault_feedback SET ' . implode(', ', $sets) . ', updated_at = UTC_TIMESTAMP() WHERE id = ?',
        );
        $query->execute($values);
    }

    public function deleteFeedback(int $id): void
    {
        $this->requireFeedback($id);
        $query = $this->db->prepare('DELETE FROM vault_feedback WHERE id = ?');
        $query->execute([$id]);
    }

    public function openFeedbackCount(): int
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM vault_feedback WHERE status = 'open'")->fetchColumn();
    }

    /** @param array<string, mixed> $values @return array<string, mixed> */
    public function createRating(array $values): array
    {
        try {
            $query = $this->db->prepare(
                'INSERT INTO vault_ratings '
                . '(client_id, transaction_id, order_rating, payment_rating, service_rating, overall_rating, comment) '
                . 'VALUES (?, ?, ?, ?, ?, ?, ?)',
            );
            $query->execute([
                $values['clientId'],
                $values['transactionId'],
                $values['orderRating'],
                $values['paymentRating'],
                $values['serviceRating'],
                $values['overallRating'],
                $values['comment'] ?? null,
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                throw new HttpException(400, 'This transaction has already been rated');
            }

            throw $error;
        }

        return $this->requireRating((int) $this->db->lastInsertId());
    }

    /** @return array<string, mixed> */
    public function requireRating(int $id): array
    {
        $query = $this->db->prepare('SELECT * FROM vault_ratings WHERE id = ?');
        $query->execute([$id]);
        $row = $query->fetch();

        if (!$row) {
            throw new HttpException(404, 'Rating not found');
        }

        return $this->rating($row);
    }

    /** @return array<string, mixed>|null */
    public function ratingForTransaction(int $transactionId): ?array
    {
        $query = $this->db->prepare('SELECT * FROM vault_ratings WHERE transaction_id = ?');
        $query->execute([$transactionId]);
        $row = $query->fetch();

        return $row ? $this->rating($row) : null;
    }

    /** @return list<array<string, mixed>> */
    public function ratingsForCustomer(int $clientId, int $limit, int $offset): array
    {
        $query = $this->db->prepare(
            'SELECT * FROM vault_ratings WHERE client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        );
        $query->bindValue(1, $clientId, PDO::PARAM_INT);
        $query->bindValue(2, $limit, PDO::PARAM_INT);
        $query->bindValue(3, $offset, PDO::PARAM_INT);
        $query->execute();

        return array_map(fn (array $row): array => $this->rating($row), $query->fetchAll());
    }

    /** @return array<string, float|int|null> */
    public function ratingAverage(int $clientId): array
    {
        $query = $this->db->prepare(
            'SELECT AVG(order_rating) AS avgOrderRating, AVG(payment_rating) AS avgPaymentRating, '
            . 'AVG(service_rating) AS avgServiceRating, AVG(overall_rating) AS avgOverallRating, '
            . 'COUNT(*) AS totalRatings FROM vault_ratings WHERE client_id = ?',
        );
        $query->execute([$clientId]);
        $row = $query->fetch() ?: [];

        return [
            'avgOrderRating' => ($row['avgOrderRating'] ?? null) !== null ? (float) $row['avgOrderRating'] : null,
            'avgPaymentRating' => ($row['avgPaymentRating'] ?? null) !== null ? (float) $row['avgPaymentRating'] : null,
            'avgServiceRating' => ($row['avgServiceRating'] ?? null) !== null ? (float) $row['avgServiceRating'] : null,
            'avgOverallRating' => ($row['avgOverallRating'] ?? null) !== null ? (float) $row['avgOverallRating'] : null,
            'totalRatings' => (int) ($row['totalRatings'] ?? 0),
        ];
    }

    /** @param array<string, mixed> $changes */
    public function updateRating(int $id, array $changes): void
    {
        $this->requireRating($id);
        $allowed = [
            'orderRating' => 'order_rating',
            'paymentRating' => 'payment_rating',
            'serviceRating' => 'service_rating',
            'overallRating' => 'overall_rating',
            'comment' => 'comment',
        ];
        $sets = [];
        $values = [];

        foreach ($allowed as $key => $column) {
            if (!array_key_exists($key, $changes)) {
                continue;
            }

            $sets[] = "{$column} = ?";
            $values[] = $changes[$key];
        }

        if ($sets === []) {
            return;
        }

        $values[] = $id;
        $query = $this->db->prepare(
            'UPDATE vault_ratings SET ' . implode(', ', $sets) . ', updated_at = UTC_TIMESTAMP() WHERE id = ?',
        );
        $query->execute($values);
    }

    public function deleteRating(int $id): void
    {
        $this->requireRating($id);
        $query = $this->db->prepare('DELETE FROM vault_ratings WHERE id = ?');
        $query->execute([$id]);
    }

    /** @return array<string, mixed> */
    public function setUserWhatsApp(int $clientId, string $number): array
    {
        $query = $this->db->prepare(
            'INSERT INTO vault_whatsapp_contacts (client_id, whatsapp_number, is_preferred) VALUES (?, ?, 1) '
            . 'ON DUPLICATE KEY UPDATE whatsapp_number = VALUES(whatsapp_number), is_preferred = 1, updated_at = UTC_TIMESTAMP()',
        );
        $query->execute([$clientId, $number]);

        return $this->requireUserWhatsApp($clientId);
    }

    /** @return array<string, mixed> */
    public function requireUserWhatsApp(int $clientId): array
    {
        $query = $this->db->prepare('SELECT * FROM vault_whatsapp_contacts WHERE client_id = ?');
        $query->execute([$clientId]);
        $row = $query->fetch();

        if (!$row) {
            throw new HttpException(404, 'No WhatsApp contact found');
        }

        return $this->contact($row);
    }

    public function deleteUserWhatsApp(int $clientId): void
    {
        $this->requireUserWhatsApp($clientId);
        $query = $this->db->prepare('DELETE FROM vault_whatsapp_contacts WHERE client_id = ?');
        $query->execute([$clientId]);
    }

    /** @return array<string, mixed> */
    public function setBusinessContact(string $type, string $value): array
    {
        $query = $this->db->prepare(
            'INSERT INTO vault_business_contacts (contact_type, value, is_active) VALUES (?, ?, 1) '
            . 'ON DUPLICATE KEY UPDATE value = VALUES(value), is_active = 1, updated_at = UTC_TIMESTAMP()',
        );
        $query->execute([$type, $value]);

        return $this->requireBusinessContact($type);
    }

    /** @return array<string, mixed> */
    public function requireBusinessContact(string $type): array
    {
        $query = $this->db->prepare(
            'SELECT * FROM vault_business_contacts WHERE contact_type = ? AND is_active = 1',
        );
        $query->execute([$type]);
        $row = $query->fetch();

        if (!$row) {
            throw new HttpException(404, "No business {$type} contact configured");
        }

        return $this->contact($row);
    }

    /** @return array<string, array<string, mixed>> */
    public function allBusinessContacts(): array
    {
        $rows = $this->db->query('SELECT * FROM vault_business_contacts WHERE is_active = 1')->fetchAll();
        $contacts = [];

        foreach ($rows as $row) {
            $contacts[$row['contact_type']] = $this->contact($row);
        }

        return $contacts;
    }

    /** @param array<string, mixed> $payment */
    public function cachePayment(string $transactionId, string $status, array $payment): void
    {
        $query = $this->db->prepare(
            'INSERT INTO vault_payment_status_cache (transaction_id, status, payload_json) VALUES (?, ?, ?) '
            . 'ON DUPLICATE KEY UPDATE status = VALUES(status), payload_json = VALUES(payload_json), updated_at = UTC_TIMESTAMP()',
        );
        $query->execute([$transactionId, $status, json_encode($payment, JSON_THROW_ON_ERROR)]);
    }

    /** @return array{status: string, payment: array<string, mixed>}|null */
    public function cachedPayment(string $transactionId): ?array
    {
        $query = $this->db->prepare(
            'SELECT status, payload_json FROM vault_payment_status_cache WHERE transaction_id = ?',
        );
        $query->execute([$transactionId]);
        $row = $query->fetch();

        if (!$row) {
            return null;
        }

        return [
            'status' => $row['status'],
            'payment' => json_decode($row['payload_json'], true, 512, JSON_THROW_ON_ERROR),
        ];
    }

    /** @param array<string, mixed> $collection */
    public function saveCardCollection(array $collection, string $clientId, string $collectoId, string $amount): void
    {
        $query = $this->db->prepare(
            'INSERT INTO vault_card_collections '
            . '(collection_id, client_id, collecto_id, expected_amount, currency, description, status, checkout_url) '
            . 'VALUES (?, ?, ?, ?, ?, ?, ?, ?) '
            . 'ON DUPLICATE KEY UPDATE status = VALUES(status), checkout_url = VALUES(checkout_url), updated_at = UTC_TIMESTAMP()',
        );
        $query->execute([
            $collection['id'],
            $clientId,
            $collectoId,
            $amount,
            $collection['currency'] ?? 'UGX',
            $collection['description'] ?? 'Collecto Vault payment',
            strtoupper((string) ($collection['status'] ?? 'PENDING')),
            $collection['checkout_url'],
        ]);
    }

    /** @return array<string, mixed> */
    public function requireCardCollection(string $id): array
    {
        $query = $this->db->prepare('SELECT * FROM vault_card_collections WHERE collection_id = ?');
        $query->execute([$id]);
        $collection = $query->fetch();

        if (!$collection) {
            throw new HttpException(404, 'Card collection not found');
        }

        return $collection;
    }

    public function updateCardStatus(string $id, string $status): void
    {
        $query = $this->db->prepare(
            'UPDATE vault_card_collections SET status = ?, updated_at = UTC_TIMESTAMP() WHERE collection_id = ?',
        );
        $query->execute([$status, $id]);
    }

    /** @return array{state: string, response: array<string, mixed>|null} */
    public function beginFinalization(string $id): array
    {
        try {
            $query = $this->db->prepare(
                "INSERT INTO vault_card_finalizations (collection_id, state) VALUES (?, 'processing')",
            );
            $query->execute([$id]);

            return ['state' => 'started', 'response' => null];
        } catch (PDOException $error) {
            if ($error->getCode() !== '23000') {
                throw $error;
            }
        }

        $query = $this->db->prepare('SELECT state, response_json FROM vault_card_finalizations WHERE collection_id = ?');
        $query->execute([$id]);
        $row = $query->fetch();

        if (!$row) {
            throw new HttpException(409, 'Unable to reserve this card payment for finalization.');
        }

        if ($row['state'] === 'completed') {
            return [
                'state' => 'completed',
                'response' => $row['response_json'] ? json_decode($row['response_json'], true, 512, JSON_THROW_ON_ERROR) : [],
            ];
        }

        if ($row['state'] === 'failed') {
            $retry = $this->db->prepare(
                "UPDATE vault_card_finalizations SET state = 'processing', updated_at = UTC_TIMESTAMP() WHERE collection_id = ?",
            );
            $retry->execute([$id]);

            return ['state' => 'started', 'response' => null];
        }

        $retryStale = $this->db->prepare(
            "UPDATE vault_card_finalizations SET state = 'processing', updated_at = UTC_TIMESTAMP() "
            . "WHERE collection_id = ? AND updated_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 MINUTE)",
        );
        $retryStale->execute([$id]);

        return $retryStale->rowCount() > 0
            ? ['state' => 'started', 'response' => null]
            : ['state' => 'processing', 'response' => null];
    }

    /** @param array<string, mixed> $response */
    public function completeFinalization(string $id, array $response): void
    {
        $query = $this->db->prepare(
            "UPDATE vault_card_finalizations SET state = 'completed', response_json = ?, updated_at = UTC_TIMESTAMP() WHERE collection_id = ?",
        );
        $query->execute([json_encode($response, JSON_THROW_ON_ERROR), $id]);
    }

    public function failFinalization(string $id): void
    {
        $query = $this->db->prepare(
            "UPDATE vault_card_finalizations SET state = 'failed', updated_at = UTC_TIMESTAMP() WHERE collection_id = ?",
        );
        $query->execute([$id]);
    }
}

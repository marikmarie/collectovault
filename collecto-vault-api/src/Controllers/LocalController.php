<?php
declare(strict_types=1);

namespace Vault\Controllers;

use Vault\Repositories\VaultRepository;
use Vault\Support\HttpException;
use Vault\Support\Response;

final class LocalController
{
    public function __construct(private VaultRepository $store)
    {
    }

    /** @param array<string, mixed> $body */
    public function createRating(array $body): never
    {
        $rating = [
            'clientId' => $this->id($body['clientId'] ?? null, 'clientId'),
            'transactionId' => $this->id($body['transactionId'] ?? null, 'transactionId'),
            'orderRating' => $this->stars($body['orderRating'] ?? null),
            'paymentRating' => $this->stars($body['paymentRating'] ?? null),
            'serviceRating' => $this->stars($body['serviceRating'] ?? null),
            'overallRating' => $this->stars($body['overallRating'] ?? null),
            'comment' => $this->nullableText($body['comment'] ?? null, 5000),
        ];

        Response::json($this->store->createRating($rating), 201);
    }

    public function rating(int $id): never
    {
        Response::json($this->store->requireRating($id));
    }

    public function ratingForTransaction(int $transactionId): never
    {
        $rating = $this->store->ratingForTransaction($transactionId);

        if (!$rating) {
            throw new HttpException(404, 'No rating found for this transaction');
        }

        Response::json($rating);
    }

    /** @param array<string, mixed> $query */
    public function ratingsForCustomer(int $clientId, array $query): never
    {
        Response::json($this->store->ratingsForCustomer(
            $clientId,
            $this->limit($query, 10),
            $this->offset($query),
        ));
    }

    public function ratingAverage(int $clientId): never
    {
        Response::json($this->store->ratingAverage($clientId));
    }

    /** @param array<string, mixed> $body */
    public function updateRating(int $id, array $body): never
    {
        $changes = [];

        foreach (['orderRating', 'paymentRating', 'serviceRating', 'overallRating'] as $field) {
            if (array_key_exists($field, $body)) {
                $changes[$field] = $this->stars($body[$field]);
            }
        }

        if (array_key_exists('comment', $body)) {
            $changes['comment'] = $this->nullableText($body['comment'], 5000);
        }

        $this->store->updateRating($id, $changes);
        Response::json(['message' => 'Rating updated successfully']);
    }

    public function deleteRating(int $id): never
    {
        $this->store->deleteRating($id);
        Response::json(['message' => 'Rating deleted successfully']);
    }

    /** @param array<string, mixed> $body */
    public function createFeedback(array $body): never
    {
        $clientId = $this->id($body['clientId'] ?? null, 'clientId');
        $type = (string) ($body['feedbackType'] ?? '');

        if (!in_array($type, ['order', 'service', 'app', 'general'], true)) {
            throw new HttpException(400, 'feedbackType must be order, service, app, or general');
        }

        $title = $this->text($body['title'] ?? null, 'Feedback title', 255);
        $message = $this->text($body['message'] ?? null, 'Feedback message', 5000);
        $attachments = $this->attachments($body['attachments'] ?? null);

        Response::json($this->store->createFeedback($clientId, $type, $title, $message, $attachments), 201);
    }

    public function feedback(int $id): never
    {
        Response::json($this->store->requireFeedback($id));
    }

    /** @param array<string, mixed> $query */
    public function feedbackForCustomer(int $clientId, array $query): never
    {
        Response::json($this->store->feedbackForCustomer(
            $clientId,
            $this->limit($query, 20),
            $this->offset($query),
        ));
    }

    /** @param array<string, mixed> $query */
    public function feedbackForStatus(string $status, array $query): never
    {
        if (!in_array($status, ['open', 'in-progress', 'resolved', 'closed'], true)) {
            throw new HttpException(400, 'Invalid feedback status');
        }

        Response::json($this->store->feedbackForStatus(
            $status,
            $this->limit($query, 20),
            $this->offset($query),
        ));
    }

    public function openFeedbackCount(): never
    {
        Response::json(['openCount' => $this->store->openFeedbackCount()]);
    }

    /** @param array<string, mixed> $body */
    public function updateFeedback(int $id, array $body): never
    {
        $changes = [];

        if (array_key_exists('title', $body)) {
            $changes['title'] = $this->text($body['title'], 'Feedback title', 255);
        }

        if (array_key_exists('message', $body)) {
            $changes['message'] = $this->text($body['message'], 'Feedback message', 5000);
        }

        if (array_key_exists('status', $body)) {
            if (!in_array($body['status'], ['open', 'in-progress', 'resolved', 'closed'], true)) {
                throw new HttpException(400, 'Invalid feedback status');
            }

            $changes['status'] = $body['status'];
        }

        if (array_key_exists('priority', $body)) {
            if (!in_array($body['priority'], ['low', 'medium', 'high', 'critical'], true)) {
                throw new HttpException(400, 'Invalid feedback priority');
            }

            $changes['priority'] = $body['priority'];
        }

        if (array_key_exists('attachments', $body)) {
            $changes['attachments'] = $this->attachments($body['attachments']);
        }

        $this->store->updateFeedback($id, $changes);
        Response::json(['message' => 'Feedback updated successfully']);
    }

    public function resolveFeedback(int $id): never
    {
        $this->store->updateFeedback($id, ['status' => 'resolved']);
        Response::json(['message' => 'Feedback resolved']);
    }

    public function closeFeedback(int $id): never
    {
        $this->store->updateFeedback($id, ['status' => 'closed']);
        Response::json(['message' => 'Feedback closed']);
    }

    public function deleteFeedback(int $id): never
    {
        $this->store->deleteFeedback($id);
        Response::json(['message' => 'Feedback deleted successfully']);
    }

    /** @param array<string, mixed> $body */
    public function createChatMessage(array $body): never
    {
        $clientId = $this->id($body['clientId'] ?? null, 'clientId');
        $sender = $body['senderType'] ?? 'customer';

        if (!in_array($sender, ['customer', 'support'], true)) {
            throw new HttpException(400, 'senderType must be customer or support');
        }

        $message = $this->text($body['message'] ?? null, 'Message', 5000);
        $attachments = $this->attachments($body['attachments'] ?? null);

        Response::json($this->store->createChat($clientId, $sender, $message, $attachments), 201);
    }

    public function chatMessage(int $id): never
    {
        Response::json($this->store->requireChat($id));
    }

    /** @param array<string, mixed> $query */
    public function chatForCustomer(int $clientId, array $query): never
    {
        Response::json($this->store->chats(
            $clientId,
            $this->limit($query, 50),
            $this->offset($query),
        ));
    }

    public function unreadMessages(int $clientId): never
    {
        Response::json(['unreadCount' => $this->store->unreadChats($clientId)]);
    }

    public function markChatRead(int $id): never
    {
        $this->store->readChat($id);
        Response::json(['message' => 'Message marked as read']);
    }

    public function markAllChatRead(int $clientId): never
    {
        $this->store->readAllChats($clientId);
        Response::json(['message' => 'All messages marked as read']);
    }

    /** @param array<string, mixed> $body */
    public function supportReply(int $clientId, array $body): never
    {
        $message = $this->text($body['message'] ?? null, 'Message', 5000);
        $attachments = $this->attachments($body['attachments'] ?? null);

        Response::json($this->store->createChat($clientId, 'support', $message, $attachments), 201);
    }

    public function deleteChatMessage(int $id): never
    {
        $this->store->deleteChat($id);
        Response::json(['message' => 'Message deleted successfully']);
    }

    /** @param array<string, mixed> $body */
    public function setUserWhatsApp(array $body): never
    {
        $clientId = $this->id($body['clientId'] ?? null, 'clientId');
        $number = $this->phone($body['whatsappNumber'] ?? null, 'whatsappNumber');

        Response::json($this->store->setUserWhatsApp($clientId, $number), 201);
    }

    public function userWhatsApp(int $clientId): never
    {
        Response::json($this->store->requireUserWhatsApp($clientId));
    }

    public function userWhatsAppUrl(int $clientId): never
    {
        $contact = $this->store->requireUserWhatsApp($clientId);
        Response::json([
            'whatsappUrl' => 'https://wa.me/' . preg_replace('/\D/', '', (string) $contact['whatsappNumber']),
        ]);
    }

    public function deleteUserWhatsApp(int $clientId): never
    {
        $this->store->deleteUserWhatsApp($clientId);
        Response::json(['message' => 'WhatsApp contact deleted successfully']);
    }

    /** @param array<string, mixed> $body */
    public function setBusinessContact(string $type, array $body): never
    {
        $key = $type === 'whatsapp' ? 'whatsappNumber' : $type;
        $value = $type === 'email'
            ? $this->email($body[$key] ?? null)
            : $this->phone($body[$key] ?? null, $key);

        Response::json($this->store->setBusinessContact($type, $value), 201);
    }

    public function businessContact(string $type): never
    {
        Response::json($this->store->requireBusinessContact($type));
    }

    public function businessWhatsAppUrl(): never
    {
        $contact = $this->store->requireBusinessContact('whatsapp');
        Response::json([
            'whatsappUrl' => 'https://wa.me/' . preg_replace('/\D/', '', (string) $contact['value']),
        ]);
    }

    public function allBusinessContacts(): never
    {
        Response::json($this->store->allBusinessContacts());
    }

    private function id(mixed $value, string $field): int
    {
        $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if ($id === false) {
            throw new HttpException(400, "{$field} is required");
        }

        return $id;
    }

    private function stars(mixed $value): int
    {
        $rating = filter_var($value, FILTER_VALIDATE_INT);

        if ($rating === false || $rating < 1 || $rating > 5) {
            throw new HttpException(400, 'All ratings must be between 1 and 5 stars');
        }

        return $rating;
    }

    private function text(mixed $value, string $field, int $maximum): string
    {
        $text = trim((string) $value);

        if ($text === '') {
            throw new HttpException(400, "{$field} is required");
        }

        if (mb_strlen($text) > $maximum) {
            throw new HttpException(400, "{$field} is too long");
        }

        return $text;
    }

    private function nullableText(mixed $value, int $maximum): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        if ($text === '') {
            return null;
        }

        if (mb_strlen($text) > $maximum) {
            throw new HttpException(400, 'Text is too long');
        }

        return $text;
    }

    /** @return list<mixed>|null */
    private function attachments(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (!is_array($value) || !array_is_list($value)) {
            throw new HttpException(400, 'attachments must be an array');
        }

        return array_values($value);
    }

    /** @param array<string, mixed> $query */
    private function limit(array $query, int $default): int
    {
        return max(1, min(100, (int) ($query['limit'] ?? $default)));
    }

    /** @param array<string, mixed> $query */
    private function offset(array $query): int
    {
        return max(0, (int) ($query['offset'] ?? 0));
    }

    private function phone(mixed $value, string $field): string
    {
        $phone = trim((string) $value);

        if (preg_match('/^\+?[1-9]\d{1,14}$/', $phone) !== 1) {
            throw new HttpException(400, "Invalid {$field} format");
        }

        return $phone;
    }

    private function email(mixed $value): string
    {
        $email = trim((string) $value);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(400, 'Invalid email format');
        }

        return $email;
    }
}

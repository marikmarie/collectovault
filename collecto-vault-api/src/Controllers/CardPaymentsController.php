<?php
declare(strict_types=1);

namespace Vault\Controllers;

use Vault\Services\CardPaymentsService;
use Vault\Services\CollectoService;
use Vault\Support\Response;

final class CardPaymentsController
{
    public function __construct(private CardPaymentsService $cards)
    {
    }

    /** @param array<string, mixed> $body */
    public function create(array $body, ?string $authorization): never
    {
        $this->cards->requireSession($authorization);
        Response::json(['data' => $this->cards->create($body)], 201);
    }

    /** @param array<string, mixed> $query */
    public function status(string $id, array $query, ?string $authorization): never
    {
        $this->cards->requireSession($authorization);
        $collection = $this->cards->status($this->cards->validId($id), $query);

        Response::json(['data' => $collection]);
    }

    /** @param array<string, mixed> $body */
    public function complete(string $id, array $body, ?string $authorization): never
    {
        $this->cards->requireSession($authorization);
        $collecto = new CollectoService();
        $response = $this->cards->complete($this->cards->validId($id), $body, $authorization, $collecto);

        Response::json($response);
    }
}

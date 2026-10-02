<?php
declare(strict_types=1);

namespace Vault;

use RuntimeException;

final class HttpException extends RuntimeException
{
    /** @param array<string, mixed> $details */
    public function __construct(private int $httpStatus, string $message, private array $extra = [])
    {
        parent::__construct($message);
    }

    public function status(): int { return $this->httpStatus; }
    /** @return array<string, mixed> */
    public function details(): array { return $this->extra; }
}

# Collecto Vault API — plain PHP

This is the API used by the Vault web app and Expo mobile app. It uses plain PHP 8.1+ only: no Node.js, Composer package, or PHP framework is required.

## WinSCP deployment

1. Upload the contents of this folder—not the folder itself—to the server directory served at `https://your-domain/collecto-vault-api/`. Do not upload the local `node_modules`, `dist`, or `.git` folders; they are obsolete local artifacts and are excluded from Git.
2. Ensure Apache `mod_rewrite`, PHP `pdo_mysql`, and PHP `curl` are enabled. The included `.htaccess` forwards every API route to `index.php` and preserves the `Authorization` header.
3. Copy `.env.example` to `.env` on the server, then set the real Collecto, Pegasus, and database values. Keep `.env` private; do not put those keys into the web or mobile apps.
4. Create the database named in `VAULT_DB_NAME`, then import `src/migrations/001_create_all_tables.sql` with phpMyAdmin. Every created table starts with `vault_`.
5. Open `/health`. A successful response is `{"status":"ok","runtime":"plain-php"}`.

The existing clients keep their same routes, including `/auth`, `/requestToPay`, support/feedback endpoints, and `/pegasus/card-collections`.

## Code layout

The API is separated by responsibility so individual features can be maintained without editing one oversized file:

- `src/Controllers/` — HTTP request validation and API responses.
- `src/Services/` — Collecto and Pegasus card-payment business logic.
- `src/Repositories/` — all `vault_` database reads and writes.
- `src/Infrastructure/` — database connection setup.
- `src/Support/` — configuration, HTTP client, errors, and JSON responses.
- `src/migrations/` — the SQL schema to import before deployment.

`index.php` only starts the application and maps the existing API routes to those controllers.

## Pegasus card configuration

`PEGASUS_CARD_API_BASE_URL` is the deployed CissyTech cardpayments URL. `PEGASUS_CARD_API_KEY` is an API key generated in that dashboard. Vault sends it server-to-server only. Hosted PegPay checkout details and card details never pass through Vault clients.

# Collecto Vault API — plain PHP

This is the deployment replacement for the Node/Express Vault API. It is plain
PHP: no Composer packages, framework, Node.js process, or background service is
needed. It preserves the existing web and mobile endpoint paths, including the
Pegasus hosted-card collection flow.

## Host with WinSCP

1. In your hosting control panel, create a MySQL database and user.
2. Import [`database/schema.sql`](database/schema.sql) in phpMyAdmin.
3. Copy `.env.example` to `.env` locally and enter the real Collecto, Pegasus,
   database, and allowed Vault web-origin values. Do not commit or upload a
   sample file with real secrets.
4. With WinSCP, upload the **contents** of this folder to the API directory,
   for example `public_html/collecto-vault-api/`. Include `.htaccess`,
   `index.php`, `bootstrap.php`, `database/`, and the created `.env` file.
5. Confirm the hosting account uses PHP 8.1+ with `curl`, `pdo`, and
   `pdo_mysql` enabled. Apache `mod_rewrite` must be enabled for clean routes.
6. Open `https://your-domain/collecto-vault-api/health`. It should return an
   `ok` JSON response.
7. Set `VITE_API_BASE_URL` and `EXPO_PUBLIC_API_BASE_URL` to that exact API
   URL, with no trailing slash required, then rebuild the clients when ready.

## Configuration

`COLLECTO_API_KEY` and `PEGASUS_CARD_API_KEY` only live in `.env` on the server.
The web and mobile apps never receive them. Configure `CORS_ALLOWED_ORIGINS`
with the real Vault web URL; use a comma-separated list if both a production
and staging site need access. Mobile apps do not send an Origin header.

The Pegasus completion table prevents the same successful hosted card checkout
from being submitted to Collecto twice, even when the customer taps the button
again or PHP receives a second request after a restart.

## Routes kept compatible

- Collecto proxy/auth: `/auth`, `/authVerify`, `/setUsername`,
  `/getByUsername`, `/services`, `/invoiceDetails`, `/invoice`,
  `/loyaltySettings`, `/requestToPay`, `/requestToPayStatus`, and
  `/verifyPhoneNumber`.
- Secure cards: `/pegasus/card-collections`,
  `/pegasus/card-collections/{id}`, and
  `/pegasus/card-collections/{id}/complete`.
- Vault support data: `/ratings`, `/feedback`, `/chat`, and `/contacts`.
- Existing client pass-through routes: `/users/all`, `/pointRules/collecto/*`,
  `/tier/collecto/*`, and the current `/customers` routes.

## Safety notes

The PHP API does not fake a successful phone verification or payment status
when Collecto is unavailable. It returns the upstream failure so a customer is
not shown a false success. Card completion requires a Vault bearer session,
checks the CissyTech/Pegasus verified amount, then records the collection ID and
provider transaction ID with Collecto.

# QuickCart

QuickCart is a Node.js + Express API for user accounts, store lookup, product availability checks, pickup order lifecycle management, AI-generated product catalog images (via Runware), and async integrations via AWS SQS.

## Current Project Status

- API server is implemented and runs from `index.js`
- Queue worker is implemented and runs from `workers/emailWorker.js`
- Auth uses JWT access tokens + refresh tokens (refresh token in HTTP-only cookie)
- Order creation/cancel/transition logic is implemented with transactional DB operations
- Optional Stripe Checkout payment step on order creation, confirmed via webhook
- Payment-timeout sweeper reclaims stock from orders left unpaid past the window
- User profile updates are implemented with Joi validation, authorization checks, password hashing, and transactional DB updates
- AI product image generation is implemented via Runware: a request queues an async image task (`202 Accepted`) and the result is delivered back through an authenticated webhook
- Webhook and signup-email jobs are pushed to SQS and processed by the worker
- Redis-backed caching is used for hot read paths (e.g. available products per store)
- Test suite is green: **25/25 suites, 277/277 tests passing**

## Tech Stack

- Node.js, Express 5
- PostgreSQL (`pg`)
- Joi validation
- JWT auth (`jsonwebtoken`)
- Stripe Checkout + webhooks (`stripe`)
- Runware AI image generation (`@runware/sdk` / REST)
- Redis caching (`redis`)
- Pino logging + Datadog tracing (`dd-trace`)
- AWS SQS + SES worker integration
- Jest + Supertest

## Project Layout

```text
QuickCart/
├── controllers/        # HTTP handlers
├── middleware/         # auth, validation, logging, error handling
├── models/             # DB access layer
├── service/            # business logic
├── routes/             # API route definitions
├── queues/             # SQS producer helpers
├── workers/            # SQS consumer worker(s)
├── utils/              # shared helpers
├── tests/              # model/service/api/unit tests
├── db.js               # PostgreSQL pool setup
├── index.js            # API entrypoint
├── Dockerfile          # API container
└── quickcart.yaml      # local compose-style service definition
```

## Prerequisites

- Node.js 18+
- PostgreSQL
- AWS credentials/config if using SQS/SES features

## Environment Variables

Create a `.env` file in project root with values matching your environment.

### Core App

- `PORT` (default fallback is `3000`)
- `NODE_ENV`
- `CLIENT_ORIGIN` (CORS origin for the frontend, default `http://localhost:5173`)
- `CLIENT_DIST_PATH` (optional absolute path to a built frontend `dist/` for the API to serve)
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_SSL` — set to `true` for RDS/production; omit or `false` for local Postgres without SSL

### JWT/Auth

- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `JWT_SIGN_UP_SECRET`
- `JWT_SIGN_UP_EXPIRES_IN`

### Async Integrations

- `SQS_QUEUE_URL`
- `WEBHOOK_URL` (used by webhook sender)
- SES-related SMTP/AWS settings used by `utils/aws/ses_email.js`

### Payments (Stripe)

- `STRIPE_API_KEY` — Stripe secret key used to create Checkout sessions
- `STRIPE_WEBHOOK_ENDPOINT_SECRET` — signing secret for verifying webhook events

### AI Image Generation (Runware)

- `RUNWARE_API_URL` — Runware inference endpoint (e.g. `https://api.runware.ai/v1`)
- `RUNWARE_API_KEY` — Runware API key (sent as `Authorization: Bearer`)
- `RUNWARE_WEBHOOK_API_KEY` — shared secret expected as the `apiKey` query param on the Runware callback; the webhook handler rejects mismatches with `401`

### Caching (Redis)

- `REDIS_URL` — Redis connection string (e.g. `redis://localhost:6379`)
- `ORDERS_CACHE_TTL`, `STORES_CACHE_TTL` — optional TTL overrides for cached read paths

### Payment Timeout Sweeper

- `PAYMENT_TIMEOUT_MINUTES` (default `10`) — how long an order may stay `awaiting_payment` before it is cancelled and restocked
- `PAYMENT_SWEEP_INTERVAL_MS` (default `60000`) — interval hint for scheduling the sweeper run

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start API server:

```bash
node index.js
```

3. (Optional) Start queue worker in a second terminal:

```bash
node workers/emailWorker.js
```

## API Documentation (Swagger / OpenAPI)

This project ships with an OpenAPI 3.0 definition and interactive docs.

- OpenAPI spec file: [openapi.yaml](openapi.yaml)

To view interactive API docs:

1. Start the API server:

```bash
node index.js
```

2. Open Swagger UI in your browser:

- URL: `http://localhost:3000/api-docs`

3. Use the **Authorize** button in Swagger UI for protected endpoints:

- Select the `bearerAuth` scheme.
- Paste your JWT access token (from `/users/login`) as: `Bearer <token>`.
- After authorizing, all endpoints marked with a lock icon will send the `Authorization: Bearer <token>` header.

The docs are generated directly from [openapi.yaml](openapi.yaml), which defines:

- All routes under `/`, `/monitoring`, `/users`, `/stores`, `/service_options`, `/products`, `/orders`, `/payment`, `/runware`.
- Request body schemas (aligned with `models/joiSchema.js`).
- Standard success/error response envelopes.
- Authentication requirements using the `bearerAuth` security scheme.

## Scripts

Currently defined in `package.json`:

```bash
npm test          # run the Jest suite
npm run dev:api   # start the API server (node index.js)
npm run dev:worker # run the payment-timeout sweeper (node workers/paymentSweeper.js)
```

## API Endpoints

### Health & Monitoring

- `GET /` → server up check
- `GET /monitoring/db` → DB connectivity check

### Users

- `POST /users/register` (validated body)
- `POST /users/login` (validated body)
- `POST /users/refresh` (requires refresh token cookie)
- `GET /users/show` (requires bearer token + query validation)
- `GET /users/email-verify?token_id=...`
- `PUT /users/update` (requires bearer token, body validation, and ownership/admin checks)
- `DELETE /users/delete`

### Stores

- `POST /stores/get_stores` (requires bearer token)

### Products

- `POST /products/checkAvailability`
- `POST /products/available` (requires bearer token; body: `{ "store_id": <integer> }`)
- `POST /products/:product_id/image` (validated params; queues an async Runware image task, returns `202 Accepted`)
- `GET /products/:product_id/image` (validated params; returns the image status — `ready` / `pending` / `none` / `not_found` — and `image_url` once available)

### Service Options

- `POST /service_options/pickup` (requires bearer token)
- `POST /service_options/reserve` (requires bearer token)

### Orders

- `POST /orders/pickup/create_order` (requires bearer token; supports optional `collect_payment` boolean to require Stripe payment before the order is activated)
- `POST /orders/cancel` (requires bearer token + owner check)
- `POST /orders/transition_order` (requires bearer token + owner check)

For `POST /orders/cancel`, request body supports:

- `order_id` (required UUID)
- `needsWebhook` (optional boolean, default `false`)

Example request body:

```json
{
  "order_id": "7f6c2ea4-8a86-4a9b-b4b1-2dbd7200f6f0",
  "needsWebhook": true
}
```

### Payments

- `POST /payment/create-checkout-session` → creates a Stripe Checkout session and returns the payment URL
- `POST /payment/webhook` → receives Stripe events (raw body, signature-verified). On `checkout.session.completed` with `payment_status = paid`, the associated order is moved from `awaiting_payment` to `brand_new`.

### Image Generation (Runware)

- `POST /runware/webhook?apiKey=<secret>` → receives async Runware image results. The `apiKey` query param is validated against `RUNWARE_WEBHOOK_API_KEY` (`401` on mismatch). The handler acks immediately with `200`, then persists each result (`image_url`, `image_id`, `seed`, `cost`) and logs any `errors`-shaped payloads.

## Request Validation

Request schemas are defined in `models/joiSchema.js`.
Key validated payloads include:

- user registration/login
- user profile updates (strict field whitelist via Joi)
- store lookup
- product/order payloads (`items`, `location_code`, `service_option_hold_id`)
- order cancel/transition payloads

## Authentication Model

- Access token is sent as `Authorization: Bearer <token>`
- Refresh token is set as `refresh_token` HTTP-only cookie
- Refresh token validity is checked against DB state
- On suspected refresh-token theft, refresh tokens for that user are revoked

## Order Flow (Current Behavior)

For pickup order creation (`create_pickup_order`):

1. Validate store
2. Validate service-option hold
3. Check product stock
4. Start DB transaction
5. Mark hold as taken
6. Decrement stock
7. Calculate order total
8. Create order record (state is `awaiting_payment` when `collect_payment=true`, otherwise `brand_new`)
9. Add order items
10. Optionally enqueue webhook event when `needsWebhook=true`
11. Commit transaction
12. When `collect_payment=true`, create a Stripe Checkout session (outside the transaction) and return the payment URL

For payment confirmation (Stripe webhook):

1. Verify the Stripe signature on the raw request body
2. On `checkout.session.completed` with `payment_status = paid`, record the session and transition the order from `awaiting_payment` to `brand_new` (state-guarded, so a duplicate/late event cannot resurrect a cancelled order)

For payment timeout (sweeper, `workers/paymentSweeper.js`):

1. Find orders still `awaiting_payment` past `PAYMENT_TIMEOUT_MINUTES`
2. Cancel each one (guarded on `awaiting_payment`, so a just-paid order is left untouched) and restock its items

For order cancellation (`cancel_Order`):

1. Validate order exists and is not already cancelled
2. Load order items; if missing for an existing order, throw internal server error
3. Start DB transaction
4. Transition order state to `cancelled`
5. Delete order items
6. Restock products
7. Commit transaction
8. Optionally enqueue `ORDER_UPDATED` event when `needsWebhook=true`

Order transitions (`transitionOrder`) continue to use authenticated owner checks and queue OMS update events through the transition service.

## Image Generation Flow (Current Behavior)

For product image generation (`POST /products/:product_id/image`):

1. Validate `product_id` route param (Joi)
2. Look up the product; `404` if it does not exist
3. Build a catalog prompt from the product name and call the Runware API (`utils/runwareApi.js`)
4. Persist the queued task (`taskUUID`) in `RUNWARE_DATA` and store `runware_task_id` on the product
5. Respond `202 Accepted` — the image is produced asynchronously

For result delivery (Runware webhook, `POST /runware/webhook`):

1. Validate the `apiKey` query param against `RUNWARE_WEBHOOK_API_KEY` (`401` on mismatch)
2. Ack immediately with `200` so Runware does not retry
3. For `data`-shaped payloads, update the matching `RUNWARE_DATA` row with `image_url`, `image_id`, `seed`, and `cost`; log when no matching task is found
4. For `errors`-shaped payloads, log the reported failure per task

Clients poll `GET /products/:product_id/image` to read the current status (`pending` → `ready`) and the final `image_url`.

## Queue + Worker Behavior

Producer (`queues/sendToQueue.js`) sends FIFO messages with:

- `MessageGroupId` based on event group type
- generated `MessageDeduplicationId`

Worker (`workers/emailWorker.js`) polls SQS and handles:

- order created → webhook
- order updated → webhook
- signup email event → SES email send

## Error Handling

Central handler: `middleware/error.js`

- Normalizes app errors using `ExpressError`
- Maps common PostgreSQL errors:
  - `23505` → `UNIQUE_VIOLATION` (409)
  - `23503` → `FOREIGN_KEY_VIOLATION` (400)
  - `22P02` → `INVALID_INPUT` (400)

Response shape:

```json
{
  "status": "error",
  "message": "...",
  "code": "..."
}
```

## Rate Limiting

Global limiter is enabled (`utils/rate-limit.js`):

- window: 15 minutes
- limit: 100 requests per window
- overflow response code: `RATE_LIMIT_EXCEEDED`

## Testing

Run all tests:

```bash
npm test
```

Current verified result in this workspace:

- Test suites: `25 passed`
- Tests: `277 passed`

## Docker

API container is defined in root `Dockerfile`.
Worker container is defined in `workers/Dockerfile`.

## Notes / Gaps

- `package.json` defines `test`, `dev:api`, and `dev:worker` scripts
- The payment sweeper worker lives under the gitignored `workers/` folder and is deployed separately; only its query model (`models/orderSweepModel.js`) is tracked
- Payment follow-ups not yet implemented: refund-on-late-payment, a Stripe event-idempotency table, and moving hardcoded `localhost:5173` checkout URLs to env vars
- Image generation follow-ups: the Runware `webhookURL` base is currently hardcoded in `utils/runwareApi.js` (should move to an env var), and there is no idempotency/"already pending" guard to prevent re-queueing a task for the same product
- Keep secrets out of version-controlled files and environment manifests

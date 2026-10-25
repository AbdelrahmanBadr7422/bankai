# Bankai

Bankai is a full-stack online bookstore built as a portfolio project. It has a Spring Boot REST API, a PostgreSQL database and an Angular storefront with an admin area. The interface uses a restrained Bleach-inspired colour scheme (charcoal, off-white, muted red) and no copyrighted artwork.

> **Status:** learning/portfolio project. It is not deployed and not production-ready. Checkout supports **Cash on Delivery (COD) only**. There is no payment gateway and no online card payment.

## Screenshots

Screenshots have not been added yet. Put images in `docs/screenshots/` and replace the placeholders below.

| Page | Screenshot |
|---|---|
| Home | `docs/screenshots/home.png` (placeholder) |
| Catalogue with filters | `docs/screenshots/catalog.png` (placeholder) |
| Book details | `docs/screenshots/product-detail.png` (placeholder) |
| Cart and checkout | `docs/screenshots/checkout.png` (placeholder) |
| Order details | `docs/screenshots/order.png` (placeholder) |
| Admin dashboard | `docs/screenshots/admin-dashboard.png` (placeholder) |
| Admin order management | `docs/screenshots/admin-order.png` (placeholder) |

## Features

### Customer features
- Register and sign in with email and password (JWT). Public registration always creates a `CUSTOMER`.
- Browse books with title search, category filter, sorting (title, price, newest) and pagination.
- View book details (price, stock, description, ISBN).
- Persistent cart stored in PostgreSQL: add, change quantity, remove, clear.
- Manage shipping addresses (create, edit, delete, own addresses only).
- Checkout with an address and Cash on Delivery.
- Order history (paginated), order details and cancellation of orders that are still `PENDING`.
- Update own name and phone through the API (`PUT /api/v1/users/me`). The frontend has no profile page.

### Admin features
- Dashboard: total orders, revenue, orders by status, total customers, recent orders, low-stock books.
- Book management: list (including inactive books), create, edit, delete.
- Category management: list, create, edit, delete.
- Order management: list with status filter, order details, status updates along the allowed transitions.
- Customer list.

### Business rules implemented in the backend
- Prices and totals are always calculated by the server. The client sends only product IDs and quantities.
- **Shipping fee:** 5.00 flat, free when the subtotal is 50.00 or more.
- **Checkout** runs in one transaction: it validates the address owner, locks the product rows (`SELECT ... FOR UPDATE`, in ID order), checks the stock, decrements it, creates the order with item and address snapshots and a payment record, then clears the cart. Any failure rolls everything back.
- **Order statuses:** `PENDING → CONFIRMED → SHIPPED → DELIVERED`. `PENDING` and `CONFIRMED` can also move to `CANCELLED`. `DELIVERED` and `CANCELLED` are final.
- **Cancellation** restores stock once. Customers can cancel only their own `PENDING` orders.
- **Payment status:** `PENDING` at checkout, `PAID` when the order is marked `DELIVERED` (cash collected), `CANCELLED` when the order is cancelled.
- **Revenue** on the dashboard is the sum of `total` of `DELIVERED` orders.
- A book that appears in an order cannot be deleted (HTTP 409). Set it inactive instead.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | Angular 20, TypeScript, Tailwind CSS 4, standalone components, signals, Reactive Forms, Angular Router, HttpClient (functional interceptor and route guards) |
| Backend | Java 21, Spring Boot 3.5, Spring Web, Spring Data JPA, Spring Security, JWT (jjwt), BCrypt, Bean Validation, Spring Boot Actuator, springdoc OpenAPI / Swagger UI, Lombok |
| Database | PostgreSQL 16, Flyway migrations |
| Development and delivery | Maven (with Maven Wrapper), npm, Docker, Docker Compose, Nginx (serves the built frontend), JUnit 5, Mockito, Testcontainers |

## Architecture overview

```text
Browser (Angular SPA)  --HTTP/JSON + Bearer JWT-->  Spring Boot REST API  --JPA/JDBC-->  PostgreSQL
   http://localhost:4200                              http://localhost:8080/api/v1           port 5432
```

- The Angular app calls the REST API directly from the browser. A functional HTTP interceptor adds `Authorization: Bearer <accessToken>` to API requests.
- The backend is a modular monolith organised by feature: **Controller → Service → Repository**. Errors are returned in one JSON format by a global exception handler.
- Flyway creates the schema on startup, and Hibernate only validates it (`ddl-auto=validate`).
- The JWT is stored in the browser's `localStorage`. Route guards only improve navigation. The backend enforces all authorization.
- In Docker, Nginx serves the compiled Angular files and falls back to `index.html` for client-side routes.

## Repository structure

```text
bankai/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/java/com/bankai/
│       │   ├── common/     errors, pagination, pricing, OpenAPI config
│       │   ├── security/   JWT service, filter, security config
│       │   ├── user/  auth/  category/  product/  cart/
│       │   ├── address/  payment/  order/  admin/
│       ├── main/resources/
│       │   ├── application.properties
│       │   └── db/migration/   V1 .. V4 SQL files
│       └── test/java/com/bankai/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── environments/environment.ts
│       └── app/
│           ├── core/       auth, interceptor, guards, API services
│           ├── shared/     models and reusable components
│           └── features/   home, products, auth, cart, addresses,
│                           checkout, orders, admin, not-found
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

| Tool | Needed for |
|---|---|
| Docker and Docker Compose | Running PostgreSQL, or the whole project |
| JDK 21 | Running the backend locally |
| Maven 3.9+ | Only once, to generate the Maven Wrapper (see below) |
| Node.js `^20.19`, `^22.12` or `^24` and npm | Running the frontend locally |

## Environment variables

Copy the example file and edit it. `.env` is ignored by Git and must never be committed.

```bash
cp .env.example .env          # Windows: copy .env.example .env
```

`.env.example` contains placeholders only:

```properties
POSTGRES_DB=bankai
POSTGRES_USER=bankai
POSTGRES_PASSWORD=bankai
JWT_SECRET=replace-with-a-random-string-of-at-least-32-characters
JWT_EXPIRATION_MS=3600000
ADMIN_EMAIL=admin@bankai.local
ADMIN_PASSWORD=replace-with-a-strong-password-12+
CORS_ALLOWED_ORIGINS=http://localhost:4200
SERVER_PORT=8080
FRONTEND_API_URL=http://localhost:8080/api/v1
```

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Compose (database and backend) | Database name and credentials |
| `JWT_SECRET` | Backend | HMAC signing key, at least 32 characters. The built-in default is for local development only. Always set your own. |
| `JWT_EXPIRATION_MS` | Backend | Token lifetime in milliseconds (default 3600000, one hour) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Backend | Creates the first administrator at startup (see below) |
| `CORS_ALLOWED_ORIGINS` | Backend | Comma-separated list of allowed browser origins (default `http://localhost:4200`) |
| `SERVER_PORT` | Backend, Compose | Backend port (default 8080) |
| `FRONTEND_API_URL` | Compose (frontend build) | API URL baked into the frontend bundle. It must be reachable from the **browser**. |

The backend also reads `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (defaults point to `localhost:5432`, database, user and password `bankai`) and `LOW_STOCK_THRESHOLD` (default 5). Compose does not pass `LOW_STOCK_THRESHOLD`, so set it in the shell only when running locally.

`./mvnw spring-boot:run` does **not** read `.env`. When running the backend locally, set variables in your shell.

## Database and Flyway migrations

Flyway runs automatically when the backend starts, so no manual SQL is needed.

| Migration | Content |
|---|---|
| `V1__users_categories_products.sql` | `users`, `categories`, `products` |
| `V2__addresses_carts.sql` | `addresses`, `carts`, `cart_items` |
| `V3__orders_payments.sql` | `orders`, `order_items`, `payments` |
| `V4__seed_initial_catalog.sql` | 5 categories and 15 books (see below) |

- On a **fresh database**, Flyway applies V1 to V4 in order.
- On an **existing database**, Flyway applies only the migrations it has not applied yet, tracked in `flyway_schema_history`.
- **Do not edit or rename an applied migration.** Flyway checks checksums, and a changed file stops the application. Make changes in a new `V5__...sql` file.

### Seed data (V4)

V4 inserts the following, and nothing else:
- 5 categories: Fiction, Fantasy, Science Fiction, Non-Fiction, Technology.
- 15 books with title, author, ISBN, price, stock and a description. Most covers use Open Library URLs built from the ISBN. If a cover fails to load, the frontend shows a title placeholder.

V4 does **not** create users, an administrator, addresses, carts or orders. If a category name or ISBN from V4 already exists in your database, V4 fails and rolls back, and the application will not start until you resolve the conflict.

To check the migrations:

```bash
docker exec -it bankai-postgres psql -U bankai -d bankai -c "SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

## Running the project

### Option A: everything with Docker Compose

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `JWT_SECRET` in `.env`, then run:

```bash
docker compose up --build
```

| Service | Container | URL / port |
|---|---|---|
| `frontend` (Nginx) | `bankai-frontend` | http://localhost:4200 |
| `backend` (Spring Boot) | `bankai-backend` | http://localhost:8080 |
| `postgres` | `bankai-postgres` | `localhost:5432` |

Swagger UI is at http://localhost:8080/swagger-ui.html and the health check at http://localhost:8080/actuator/health.

PostgreSQL data lives in the named volume `bankai_pgdata`, so it survives `docker compose down`. Only `docker compose down -v` deletes it. The backend waits for the database health check before it starts.

### Option B: PostgreSQL in Docker, backend and frontend locally

**1. Generate the Maven Wrapper once** (skip it if `backend/mvnw` is already committed):

```bash
cd backend
mvn wrapper:wrapper -Dmaven=3.9.9 -Dtype=only-script
```

**2. Start the database** (from the repository root):

```bash
docker compose up -d postgres
```

**3. Start the backend** (new terminal):

```powershell
# Windows PowerShell
cd backend
$env:ADMIN_EMAIL="admin@bankai.local"
$env:ADMIN_PASSWORD="replace-with-a-strong-password-12+"
.\mvnw.cmd spring-boot:run
```

```bash
# Linux / macOS / Git Bash
cd backend
export ADMIN_EMAIL=admin@bankai.local
export ADMIN_PASSWORD='replace-with-a-strong-password-12+'
./mvnw spring-boot:run
```

**4. Start the frontend** (new terminal):

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200. The frontend calls `http://localhost:8080/api/v1`, set in `frontend/src/environments/environment.ts`.

To build the production bundle: `npm run build` (output in `frontend/dist/frontend/browser`).

## Accounts

### Administrator

There is **no default admin account and no registration page for admins**. The backend creates the first administrator at startup from two environment variables:

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` must both be set.
- The password must be at least 12 characters, otherwise the application refuses to start.
- If a user with that email already exists, nothing is changed.
- If either variable is empty, the step is skipped.

After starting the backend with these values, sign in on the normal login page (`/login`). An **Admin** link then appears in the header.

### Customer

Open `/register` in the frontend, or call the API:

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"replace-me-8+chars","fullName":"Example Customer"}'
```

Registration always creates a `CUSTOMER`. A `role` field in the request is ignored. Passwords must be 8 to 72 characters.

## API overview

All paths are prefixed with `/api/v1`. Interactive documentation is at `/swagger-ui.html`.

| Method and path | Access |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Public |
| `GET /auth/me`, `GET /users/me`, `PUT /users/me` | Authenticated |
| `GET /products`, `GET /products/{id}`, `GET /categories` | Public |
| `GET /cart`, `POST /cart/items`, `PUT /cart/items/{productId}`, `DELETE /cart/items/{productId}`, `DELETE /cart` | Authenticated |
| `GET /addresses`, `POST /addresses`, `PUT /addresses/{id}`, `DELETE /addresses/{id}` | Authenticated (own data only) |
| `POST /orders/checkout`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel` | Authenticated (own orders only) |
| `GET/POST /admin/products`, `GET/PUT/DELETE /admin/products/{id}`, `GET /admin/products/low-stock` | Admin |
| `GET/POST /admin/categories`, `PUT/DELETE /admin/categories/{id}` | Admin |
| `GET /admin/orders`, `GET /admin/orders/{id}`, `PATCH /admin/orders/{id}/status` | Admin |
| `GET /admin/customers`, `GET /admin/dashboard` | Admin |

Other public endpoints: `GET /actuator/health`, `GET /actuator/info`, Swagger UI and `/v3/api-docs`.

Product listing query parameters: `search` (title), `categoryId`, `page` (from 0), `size` (default 12, max 50), `sort` (`title`, `price` or `createdAt`) and `direction` (`asc` or `desc`). Unknown `sort` values fall back to `createdAt`.

Paged responses have the shape `{ content, page, size, totalElements, totalPages }`. Errors have the shape `{ timestamp, status, error, message, path, fieldErrors? }`. `fieldErrors` appears only for validation errors.

### Authentication example

Log in. The response contains an `accessToken` property:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"replace-me-8+chars"}'
```

Call a protected endpoint with that token (on Windows PowerShell use `curl.exe`):

```bash
curl http://localhost:8080/api/v1/cart \
  -H "Authorization: Bearer <accessToken>"
```

A missing, invalid or expired token returns 401. A valid token with the wrong role returns 403.

### Checkout example

```bash
# 1. Create an address
curl -X POST http://localhost:8080/api/v1/addresses \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"recipientName":"Example Customer","phone":"0100000000","line1":"1 Main Street","city":"Mansoura","postalCode":"35511","country":"Egypt"}'

# 2. Add a book to the cart
curl -X POST http://localhost:8080/api/v1/cart/items \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'

# 3. Check out (use the address id returned in step 1)
curl -X POST http://localhost:8080/api/v1/orders/checkout \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"addressId":1,"paymentMethod":"COD"}'
```

Use the real IDs returned by your database instead of the `1` values above.

## Running the tests

Backend tests (JUnit 5, Mockito, Testcontainers):

```bash
cd backend
./mvnw test                                # all tests; Docker must be running
./mvnw test -Dtest='!*IntegrationTest'     # unit tests only, no Docker needed
```

On Windows use `.\mvnw.cmd` instead of `./mvnw`.

The backend tests cover registration and password hashing, cart totals, checkout totals and stock changes, rollback on a failed checkout, cancellation and stock restoration, order ownership, JWT and role authorization, product validation, and concurrent checkout (overselling) and cancellation against a real PostgreSQL container.

The frontend has **no automated tests**. It is verified manually.

## Troubleshooting

| Problem | Fix |
|---|---|
| `mvnw` or `mvnw.cmd` not found | Generate the wrapper: `cd backend && mvn wrapper:wrapper -Dmaven=3.9.9 -Dtype=only-script` |
| Backend stops at startup with an admin password error | `ADMIN_PASSWORD` must be at least 12 characters. |
| No Admin link after signing in | The admin is created only at startup. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, restart the backend, and sign in with exactly that email. |
| Port 5432, 8080 or 4200 already in use | Stop the other program, or change the port (`SERVER_PORT` for the backend). |
| Backend cannot connect to the database | With Compose, check `docker compose ps` and wait for `postgres` to be healthy. When running locally, make sure `docker compose up -d postgres` was run. |
| Browser shows a CORS error | Add your frontend origin to `CORS_ALLOWED_ORIGINS` and restart the backend. |
| Frontend in Docker cannot reach the API | The API URL is baked into the bundle at build time. Set `FRONTEND_API_URL` to a URL the browser can open, then run `docker compose up --build`. |
| Flyway error about a changed checksum | An applied migration was edited. Restore the original file and add a new migration instead. |
| V4 fails with a unique-constraint error | Your database already has a category name or ISBN used by the seed. Rename or remove your own row, then restart. |
| Frontend shows a "no books" message | Check that V4 was applied (see the Flyway query above), or add books through the admin area. |
| Suddenly signed out | The token expired (default one hour). Sign in again. |
| Testcontainers tests fail | Docker must be running. Use the unit-tests-only command if you do not have Docker. |
| `npm start` fails on an old Node version | Install Node `^20.19`, `^22.12` or `^24`. |

## Current limitations

- Cash on Delivery is the only payment method. There is no payment gateway.
- No email verification, password reset, refresh tokens or social login.
- The JWT is stored in `localStorage` and could be read by an XSS attack. An httpOnly cookie would be safer, but the backend currently supports Bearer tokens only.
- The role is stored in the token, so a role change applies only after the token expires.
- No product reviews, wishlists, discounts, coupons or image upload (covers are URLs).
- Single currency. The frontend displays amounts in USD, set in `frontend/src/environments/environment.ts`.
- The customer cannot edit their profile in the frontend, only through the API.
- Swagger UI and the health endpoint are public.
- No automated frontend tests, and no CI pipeline.
- The project has not been deployed anywhere.

## Future improvements (planned, not implemented)

- Product reviews with rating and ownership checks.
- Email verification and password reset.
- Online payments through a gateway.
- Refresh tokens or cookie-based authentication.
- Order status history.
- Image upload for book covers.
- Frontend tests and a CI workflow.

## License

No license has been specified yet. Until one is added, all rights are reserved by the author.
# PageTurner

A Spring Boot API and Next.js 16 / React 19 / Tailwind CSS 4 frontend for book discovery, private bookshelves, and account administration.

## Run with Docker Compose

Requirements: Docker Engine with the Compose plugin, Make, and OpenSSL. Java, Maven, and Node are supplied by containers.

```sh
make init
make run
```

Open **http://localhost:8080** (or the `HOST_PORT` in `.env`). `make run` also runs initialization, builds the images, and waits for healthy services. Initialization generates secrets for new installations and preserves existing values. Configure optional administrator credentials in `.env` before startup.

| Service | Purpose | Port |
| --- | --- | --- |
| `nginx` | Public gateway, routing and protected-page authorization | `${HOST_PORT:-8080}` on host |
| `frontend` | Next.js standalone Node server | Internal 3000 |
| `backend` | Spring Boot JSON API, sessions and permissions | Internal 8080 |
| `db` | MySQL 8 with persistent `mysql-data` volume | Internal 3306 |

Only Nginx publishes a host port. `/api`, `/users`, and `/books` requests go to the backend with their original paths. Legacy JSON `POST /login` and `POST /register` also go to the backend; GET requests serve the corresponding pages. Other requests go to the frontend. Protected pages use an Nginx authorization subrequest to `/api/page-access`, preserving login and administrator redirects. All browser requests share one origin, so session cookies and CSRF continue to work without CORS configuration.

The backend JAR contains no frontend assets or templates and does not serve pages. Existing page URLs (`/login`, `/register`, `/home`, `/settings`, `/admin`, `/admin/users`, `/systeminfo`) are retained.

## Commands

Run `make help` for the command list.

```sh
make run                     # Build/start the stack, wait for health
make logs SERVICE=nginx       # Follow a service's logs (default: backend)
make ps                      # Container and health status
make test                    # Java tests, frontend tests and production build
make build                   # Build all three application images
make install                 # Maven install in a container
make update                  # Pull base images, refresh dependencies, rebuild
make shell SERVICE=frontend  # Shell inside a running service
make db-shell                # MySQL client
make db-up                   # Start only MySQL and wait for readiness
make db-down                 # Stop MySQL without removing its data
make stop                    # Stop services
make restart                 # Restart existing containers
make down                    # Remove containers/network, preserve volumes
make clean                   # Stop stack and remove Maven build output
make re                      # Clean, rebuild and start
make config                  # Validate Compose without printing secrets
make frontend-dev            # Next.js hot reload at localhost:3000 (Node 22+)
```

After changing code or `.env`, use `make run` to rebuild/recreate affected containers; `make restart` does not apply configuration changes. `make update` does not pull Git changes. All normal cleanup commands retain the database and Maven cache. Explicitly running `docker compose down --volumes` deletes that data.

Compose uses `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `MYSQL_DATABASE`, and `MYSQL_ROOT_PASSWORD` from `.env`. It constructs `DATABASE_URL` with the service hostname `db` and always runs Spring on internal port 8080. Older `.env` values for `DATABASE_URL` and `SERVER_PORT` do not override these internal settings. MySQL initialization variables apply only to an empty volume; changing credentials later requires updating the database users as well.

Existing standalone MySQL containers/data are not migrated automatically. Back up and restore any existing data into the Compose database before switching. The default project name is `pageturner`; set `COMPOSE_PROJECT_NAME` to isolate another stack and choose a different `HOST_PORT`.

## Source layout

- `src/main/java/`: API controllers, security, services, persistence.
- `src/main/resources/`: Spring configuration and database resources.
- `frontend/app/`: Next.js App Router pages, global Tailwind/CSS theme, error routes.
- `frontend/components/`: React library, shelf, book detail, authentication, account and administration UI.
- `frontend/lib/`: Typed API client, CSRF handling, book filtering, provider URL validation.
- `frontend/public/`: Favicons and public assets. Fonts are self-hosted through Fontsource.
- `frontend/e2e/`: Playwright interaction and responsive-layout tests with deterministic API fixtures.
- `frontend/Dockerfile`: Multi-stage Next.js build and unprivileged standalone Node runtime.
- `Dockerfile`: Multi-stage Java 25 backend build.
- `deploy/nginx/`: Public gateway image and reverse proxy configuration.
- `compose.yaml`: Services, readiness checks, persistent storage and test tools.
- `scripts/init.sh`: Idempotent environment initialization.

## Frontend development

The visual reference is the supplied `booklibrarydesign.mp4`: warm paper, serif typography, cloth book spines on wooden shelves, and an opening-book detail dialog. Shelf, cover and topic views share real backend data. Sign-in pairs the account form with illustrated classic book jackets. On phones the form comes first.

```sh
make run                              # Start the API, database and gateway
make frontend-dev                     # Hot reload at http://localhost:3000
# Or, with a custom gateway port:
cd frontend
npm ci
API_ORIGIN=http://localhost:8080 npm run dev
npm test                              # Filtering, sorting and safe reading-link tests
npm run build                         # TypeScript and production compilation
npx playwright install chromium       # Once, for browser testing
npm run test:e2e                       # Starts its own frontend test server
```

`API_ORIGIN` is server-side development configuration. In production the public Nginx gateway routes requests directly to Spring and Next.js. The frontend container serves on internal port 3000; only Nginx publishes a port. `make run` rebuilds after frontend edits. `make test-frontend` installs locked dependencies, runs unit tests, and compiles the frontend inside Node 22. Browser tests use clearly isolated fixtures; live integration testing should run against a disposable account.

Backend-only local development can still use `./mvnw spring-boot:run` with an explicitly configured database URL, but it does not serve the UI.

### Private bookshelves and discovery

- Saved-book list, details, updates, reading-status changes, and deletion are scoped to the authenticated account. Administrators cannot access another account’s bookshelf through the book API.
- The same title can be saved by different accounts; duplicate titles within one bookshelf return `409`.
- **Next selection** fetches the next 24 results for the current search or genre. **Previous** returns to the prior selection. At the end of the catalog, the empty view offers a reset; Previous remains available. Changing the search or genre starts at selection 1.
- **Refresh** reloads the user’s saved books and preserves the reading-status filter. Clicking a title opens its details.
- Existing books without an owner remain in the database but are not exposed to any account. Ownership cannot be inferred from the old shared collection; assign legacy rows only after verifying their owner.

### Sessions and API requests

`GET /users/me` returns the current account from the database. Protected pages redirect expired sessions to login; protected APIs return `401` with `X-Session-Expired: true`. Administrative permissions are checked against the current database role, including after demotion or deletion.

Global account administration requires SUPER_ADMIN. Sign-in and signup return 503 while Redis is unavailable. Bearer clients must sign in again after upgrading from email-based tokens.

All mutation requests require CSRF protection. API clients first request `GET /api/csrf`, retain the session cookie, and send the returned `headerName` and `token` on POST, PUT, PATCH, and DELETE requests. The typed `frontend/lib/api.ts` client handles this for the frontend. `PATCH /books/{id}/status` accepts a JSON body such as `{"readingStatus":"READING"}`.

### Production setup

1. Run `make init` to generate unique database passwords and a JWT signing key. Compose connects to its private MySQL service; configure TLS when using a remote database.
2. A fresh database has no built-in administrator. Optionally set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` for initial creation, then remove those bootstrap variables. Existing accounts and passwords are never overwritten.
3. Back up an existing database and apply `docs/migrations/001-private-bookshelves.sql` once, unless the development profile has already applied those schema changes. Compose initializes a fresh MySQL volume with `docs/migrations/fresh-schema.sql`, which already includes those changes. The production profile validates the schema instead of altering it automatically.
4. Run `make test`, then deploy the Compose stack with `SPRING_PROFILES_ACTIVE=prod` and a host HTTPS reverse proxy forwarding to the loopback-only gateway at `127.0.0.1:${HOST_PORT:-8080}`. Have the TLS proxy overwrite X-Real-IP with the client address. In Nginx configure `set_real_ip_from` for that proxy’s exact observed peer address and `real_ip_header X-Real-IP`. Without this setting browsers behind the proxy share one rate limit. Secure session cookies require HTTPS. The production profile disables development tools, the H2 console, SQL logging, and detailed error output.
5. Browser sessions are stored in application memory. A restart requires users to sign in again; multiple application instances require a shared session store before scaling horizontally.

GitHub Actions runs `./mvnw verify` on Java 25. The tests include a real H2-backed API suite for ownership isolation, tampered IDs, reading statuses, CSRF, expired sessions, and role changes, plus paginated search and upstream failure tests.


### Search, sorting, and reading

In **Your library**, search saved titles and authors, combine the search with reading-status filters, and sort by recently saved, oldest saved, title, author, reading status, or binding colour. Search is case- and accent-insensitive. Refresh preserves the current controls; Reset clears them. All filtering is local to the already authorized personal collection.

**Find a readable edition** in the open-book dialog checks its ISBN through the [Open Library Read API](https://openlibrary.org/dev/docs/api/read). Readable editions open in the provider’s reader in a new tab; borrowable editions open the provider’s borrowing page. Borrowing may require an external account, and availability is confirmed by the provider. Different-edition matches are labeled. Missing ISBNs or unavailable editions offer an Open Library edition search instead of claiming the full text is available. Provider failures offer a retry. Reading links are restricted to HTTPS Open Library and Internet Archive URLs.

`GET /books/reading?isbn=…` requires authentication, validates the ISBN format, and returns reading options without storing book content or altering reading status. No database migration is required for these features.

Run `npm --prefix frontend test` for bookshelf filtering/sorting tests, and `./mvnw test` for the Java API and reading-provider tests. Both run in CI.

# Book Library Management System

A full-stack Spring Boot web application for managing books, users, and administrative tasks. This project features secure user authentication via JWT, a responsive web interface using Thymeleaf, and integrates with the external OpenLibrary API to fetch book data.

## 🚀 Features

- **User Authentication & Security:** Secure login and registration utilizing Spring Security and JSON Web Tokens (JWT).
- **Role-Based Access Control:** Distinct roles and dashboards for standard Users and Administrators.
- **OpenLibrary Integration:** Fetches real-time book data and metadata using the OpenLibrary API.
- **Admin Dashboard:** Dedicated interface for user management and system information monitoring.
- **Private Bookshelves:** Saved books belong to individual accounts, with Want to read, Reading, and Finished statuses.
- **Custom UI:** Responsive Thymeleaf pages with a shared PageTurner theme, accessible forms, and interactive book discovery.

## 🛠️ Tech Stack

- **Backend:** Java, Spring Boot (Web, Security, Data JPA)
- **Security:** Spring Security, JWT (JSON Web Tokens)
- **Frontend:** HTML5, CSS3, JavaScript, Thymeleaf
- **Build Tool:** Maven
- **External APIs:** OpenLibrary API

## 📂 Project Structure

- `src/main/java/com/example/PageTurner/`
  - `config/` - Application and Security configurations.
  - `controller/` - REST and Web MVC controllers handling routing.
  - `dto/` - Data Transfer Objects (Requests/Responses/OpenLibrary mapping).
  - `filter/` - Custom filters, including `JwtAuthenticationFilter`.
  - `model/` - Entity classes representing database tables.
  - `repository/` - Data access interfaces extending Spring Data JPA.
  - `service/` - Core business logic and JWT utilities.
- `src/main/resources/`
  - `templates/` - HTML Thymeleaf views (Home, Login, Admin, User, Error pages).
  - `static/` - Static assets like custom JS, CSS, and favicons.
  - `application.properties` - Main configuration file.
  - `data.sql` - Initial database seeding scripts.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Java Development Kit (JDK) 25](https://adoptium.net/) or higher.
- [Node.js and npm](https://nodejs.org/) (optional, only if using the `package.json` for frontend asset management).

---

## 🚀 How to Run the Application

You have multiple options to start this application depending on your workflow.

### Option 1: Using the Makefile

If you have make installed, you can leverage the included Makefile.

```bash
make run
```

(Note: You can inspect the Makefile in the root directory for other helpful commands like `make clean` or `make build`).

### Option 2: Using the Maven Wrapper (Cross-platform)

You don't need to install Maven globally; the project comes with a Maven wrapper (mvnw).

On Windows:

```cmd
mvnw.cmd spring-boot:run
```

On macOS / Linux:

```bash
./mvnw spring-boot:run
```

### Option 3: Build a JAR and Run

To package the application into a standalone executable JAR file and run it:

```bash
./mvnw clean package
java -jar target/PageTurner-0.0.1-SNAPSHOT.jar
```

## 🌐 Accessing the Application

Once the server successfully starts, you can access the web application in your browser at:

```
http://localhost:8080
```

### Default Routes:

- **Home:** `/`
- **Login:** `/login`
- **Signup:** `/register`
- **Admin Dashboard:** `/admin`

---

## 💡 Important Notes & Troubleshooting

**JAR File Name:** In the run instructions (Option 4), the `target/PageTurner-0.0.1-SNAPSHOT.jar` filename is used because the default artifact name for a `com.example.PageTurner` package is usually `PageTurner`. If your `pom.xml` specifies a different `<finalName>`, you will need to update the `java -jar` command accordingly.

**Server Port:** Spring Boot runs on port 8080 by default. If your `src/main/resources/application.properties` file overrides this (e.g., `server.port=9090`), make sure to update the URL when accessing the application in your browser.

**Database:** The application connects to the database configured in `.env`. Optional administrator bootstrapping uses environment variables. Ensure your database connection settings in `application.properties` are correctly configured for your local environment (whether using an H2 in-memory database or an external SQL database).

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

### Frontend styling and behavior

All pages share `src/main/resources/static/css/app.css`. Its opening design tokens define the colors, surfaces, and spacing used by discovery, authentication, administration, account settings, and error pages. No frontend build step or external font service is required.

`static/js/library.js` handles book search, genre selection, saved books, loading states, retry feedback, and cover fallbacks. `static/js/ui.js` provides password visibility controls and navigation enhancements. Existing Spring routes and API endpoints are retained.

For frontend development, run the Spring Boot application and visit `/login`, `/register`, or `/home`; the optional static-only npm server does not render Thymeleaf pages.


### Private bookshelves and discovery

- Saved-book list, details, updates, reading-status changes, and deletion are scoped to the authenticated account. Administrators cannot access another account’s bookshelf through the book API.
- The same title can be saved by different accounts; duplicate titles within one bookshelf return `409`.
- **New books** fetches the next 24 results for the current search or genre. **Previous** returns to the prior selection. At the end of the catalog, discovery returns to the first selection. Changing the search or genre starts at selection 1.
- **Refresh bookshelf** reloads the user’s saved books and preserves the reading-status filter. Clicking a title opens its details.
- Existing books without an owner remain in the database but are not exposed to any account. Ownership cannot be inferred from the old shared collection; assign legacy rows only after verifying their owner.

### Sessions and API requests

`GET /users/me` returns the current account from the database. Protected pages redirect expired sessions to login; protected APIs return `401` with `X-Session-Expired: true`. Administrative permissions are checked against the current database role, including after PageTurnertion or deletion.

All mutation requests require CSRF protection. API clients first request `GET /api/csrf`, retain the session cookie, and send the returned `headerName` and `token` on POST, PUT, PATCH, and DELETE requests. The shared `session.js` handles this for the frontend. `PATCH /books/{id}/status` accepts a JSON body such as `{"readingStatus":"READING"}`.

### Production setup

1. Copy `.env.example` to `.env` and set your database connection and a unique `JWT_SECRET` (`openssl rand -hex 32`). The example MySQL URL is for local development; configure TLS for remote database connections.
2. A fresh database has no built-in administrator. Optionally set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` for initial creation, then remove those bootstrap variables. Existing accounts and passwords are never overwritten.
3. Back up an existing database and apply `docs/migrations/001-private-bookshelves.sql` once, unless the development profile has already applied those schema changes. For a fresh schema, provision the base tables before applying this incremental migration. The production profile validates the schema instead of altering it automatically.
4. Run `./mvnw verify`, then deploy the built JAR with `SPRING_PROFILES_ACTIVE=prod` behind an HTTPS reverse proxy. Secure session cookies require HTTPS. The production profile disables development tools, the H2 console, SQL logging, and detailed error output, and enables template/resource caching.
5. Browser sessions are stored in application memory. A restart requires users to sign in again; multiple application instances require a shared session store before scaling horizontally.

GitHub Actions runs `./mvnw verify` on Java 25. The tests include a real H2-backed API suite for ownership isolation, tampered IDs, reading statuses, CSRF, expired sessions, and role changes, plus paginated search and upstream failure tests.

-- MySQL entrypoint runs this only when initializing a new data directory.
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255),
    role ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'USER'),
    tenant_id VARCHAR(255) UNIQUE
);

CREATE TABLE book (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    author VARCHAR(255),
    cover_id BIGINT,
    description VARCHAR(2000),
    isbn VARCHAR(255),
    owner_id INT,
    reading_status ENUM('FINISHED', 'READING', 'WANT_TO_READ'),
    tenant_id VARCHAR(255),
    title VARCHAR(255),
    CONSTRAINT uk_book_owner_title UNIQUE (owner_id, title)
);

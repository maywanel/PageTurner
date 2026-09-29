-- Apply once to an existing MySQL database before enabling the prod profile.
-- Back up the database first. Development ddl-auto=update already applies these changes.
-- NULL owners intentionally leave legacy shared rows unassigned and inaccessible.
ALTER TABLE book ADD COLUMN owner_id INT NULL;
ALTER TABLE book ADD COLUMN reading_status ENUM('FINISHED','READING','WANT_TO_READ') NULL;
ALTER TABLE book MODIFY COLUMN description VARCHAR(2000);
ALTER TABLE book ADD CONSTRAINT uk_book_owner_title UNIQUE (owner_id, title);

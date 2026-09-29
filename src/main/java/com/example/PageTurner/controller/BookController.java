package com.example.PageTurner.controller;

import com.example.PageTurner.service.BookService;
import com.example.PageTurner.service.SessionUserService;
import com.example.PageTurner.model.Book;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/books")
public class BookController {
    private final BookService books;
    private final SessionUserService sessions;
    public BookController(BookService books, SessionUserService sessions) { this.books = books; this.sessions = sessions; }

    @GetMapping("/search")
    public List<Book> search(@RequestParam String query, @RequestParam(defaultValue = "1") int page,
                             HttpServletRequest request) {
        sessions.requireUserId(request);
        if (query.isBlank() || query.length() > 200 || page < 1 || page > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a search up to 200 characters and a page between 1 and 100");
        return books.searchBooksFromApi(query.trim(), page);
    }

    @GetMapping
    public List<Book> list(HttpServletRequest request) { return books.getAllBooks(sessions.requireUserId(request)); }

    @GetMapping("/{id}")
    public Book get(@PathVariable long id, HttpServletRequest request) { return books.getBookById(id, sessions.requireUserId(request)); }

    @PostMapping
    public Book add(@RequestBody Book book, HttpServletRequest request) {
        int ownerId = sessions.requireUserId(request);
        validate(book);
        return books.saveBook(book, ownerId);
    }

    @PutMapping("/{id}")
    public Book update(@PathVariable long id, @RequestBody Book book, HttpServletRequest request) {
        int ownerId = sessions.requireUserId(request);
        validate(book);
        return books.updateBook(id, ownerId, book);
    }

    public record StatusUpdate(Book.ReadingStatus readingStatus) {}

    @PatchMapping("/{id}/status")
    public Book updateStatus(@PathVariable long id, @RequestBody StatusUpdate update, HttpServletRequest request) {
        int ownerId = sessions.requireUserId(request);
        if (update.readingStatus() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a reading status");
        return books.updateStatus(id, ownerId, update.readingStatus());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, HttpServletRequest request) {
        books.deleteBook(id, sessions.requireUserId(request));
        return ResponseEntity.noContent().build();
    }

    private void validate(Book book) {
        if (book.getTitle() == null || book.getTitle().isBlank() || book.getAuthor() == null || book.getAuthor().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title and author are required");
        if (book.getTitle().length() > 255 || book.getAuthor().length() > 255
            || (book.getDescription() != null && book.getDescription().length() > 2000)
            || (book.getIsbn() != null && book.getIsbn().length() > 255))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book information exceeds the maximum length");
    }
}

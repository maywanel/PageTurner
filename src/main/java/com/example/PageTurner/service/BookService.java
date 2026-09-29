package com.example.PageTurner.service;

import com.example.PageTurner.dto.OpenLibraryResponse;
import com.example.PageTurner.model.Book;
import com.example.PageTurner.repository.BookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;
import java.util.List;

@Service
public class BookService {
    public static final int PAGE_SIZE = 24;
    private final BookRepository books;
    private final WebClient webClient;

    public BookService(BookRepository books, WebClient.Builder builder) {
        this.books = books;
        this.webClient = builder.baseUrl("https://openlibrary.org").build();
    }

    public List<Book> getAllBooks(int ownerId) { return books.findAllByOwnerIdOrderByIdDesc(ownerId); }

    public Book getBookById(long id, int ownerId) {
        return books.findByIdAndOwnerId(id, ownerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    @Transactional
    public Book saveBook(Book input, int ownerId) {
        if (books.findByTitleAndOwnerId(input.getTitle().trim(), ownerId).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This book is already on your bookshelf");
        // Never accept a client-supplied id or owner when creating a saved book.
        Book book = new Book();
        book.setOwnerId(ownerId);
        copyMetadata(input, book);
        book.setReadingStatus(input.getReadingStatus());
        return books.save(book);
    }

    @Transactional
    public void deleteBook(long id, int ownerId) { books.delete(getBookById(id, ownerId)); }

    @Transactional
    public Book updateBook(long id, int ownerId, Book input) {
        Book book = getBookById(id, ownerId);
        if (books.findByTitleAndOwnerId(input.getTitle().trim(), ownerId)
            .filter(existing -> !existing.getId().equals(id)).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This book is already on your bookshelf");
        copyMetadata(input, book);
        return books.save(book);
    }

    @Transactional
    public Book updateStatus(long id, int ownerId, Book.ReadingStatus status) {
        Book book = getBookById(id, ownerId);
        book.setReadingStatus(status);
        return books.save(book);
    }

    private void copyMetadata(Book input, Book book) {
        book.setTitle(input.getTitle().trim());
        book.setAuthor(input.getAuthor().trim());
        book.setDescription(input.getDescription() == null ? "" : input.getDescription().trim());
        book.setIsbn(input.getIsbn());
        book.setCoverId(input.getCoverId());
    }

    public List<Book> searchBooksFromApi(String query, int page) {
        try {
            OpenLibraryResponse response = webClient.get()
                .uri(uri -> uri.path("/search.json").queryParam("q", query)
                    .queryParam("page", page).queryParam("limit", PAGE_SIZE)
                    .queryParam("fields", "title,author_name,first_publish_year,isbn,cover_i").build())
                .retrieve().bodyToMono(OpenLibraryResponse.class)
                .timeout(Duration.ofSeconds(15)).block();
            if (response == null || response.docs() == null) return List.of();
            return response.docs().stream().filter(doc -> doc.title() != null && !doc.title().isBlank()).map(doc -> {
                Book book = new Book();
                book.setTitle(doc.title());
                book.setAuthor(doc.authorName() == null || doc.authorName().isEmpty() ? "Unknown author" : String.join(", ", doc.authorName()));
                book.setCoverId(doc.coverId());
                book.setIsbn(doc.isbn() == null || doc.isbn().isEmpty() ? "N/A" : doc.isbn().get(0));
                book.setDescription("First published in: " + (doc.firstPublishYear() == null ? "Unknown" : doc.firstPublishYear()));
                return book;
            }).toList();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Book search is temporarily unavailable. Please try again.", exception);
        }
    }
}

package com.example.PageTurner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_book_owner_title", columnNames = {"owner_id", "title"}))
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private String tenantId;

    private String title;
    private String author;
    @Column(length = 2000)
    private String description;
    private String isbn;
    private Long coverId;

    public enum ReadingStatus { WANT_TO_READ, READING, FINISHED }

    @JsonIgnore
    @Column(name = "owner_id")
    private Integer ownerId;

    @Enumerated(EnumType.STRING)
    private ReadingStatus readingStatus = ReadingStatus.WANT_TO_READ;

    public Integer getOwnerId() { return ownerId; }
    public void setOwnerId(Integer ownerId) { this.ownerId = ownerId; }
    public ReadingStatus getReadingStatus() { return readingStatus == null ? ReadingStatus.WANT_TO_READ : readingStatus; }
    public void setReadingStatus(ReadingStatus readingStatus) { this.readingStatus = readingStatus; }

    // Getters and Setters
    public Long getCoverId() {
        return coverId;
    }

    public void setCoverId(Long coverId) {
        this.coverId = coverId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }
}

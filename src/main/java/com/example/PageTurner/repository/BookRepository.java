package com.example.PageTurner.repository;

import com.example.PageTurner.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findAllByOwnerIdOrderByIdDesc(Integer ownerId);
    Optional<Book> findByIdAndOwnerId(Long id, Integer ownerId);
    Optional<Book> findByTitleAndOwnerId(String title, Integer ownerId);
}

package com.example.PageTurner.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import com.example.PageTurner.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
}

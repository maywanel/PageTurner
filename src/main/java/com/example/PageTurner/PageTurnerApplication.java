package com.example.PageTurner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.UserRepository;

@SpringBootApplication
public class PageTurnerApplication {
    public static void main(String[] args) { SpringApplication.run(PageTurnerApplication.class, args); }

    @Bean
    public CommandLineRunner initDatabase(UserRepository users, PasswordEncoder encoder,
        @Value("${app.bootstrap-admin.email:}") String email,
        @Value("${app.bootstrap-admin.password:}") String password) {
        return args -> {
            if (email.isBlank() && password.isBlank()) return;
            if (email.isBlank() || password.length() < 12 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
                throw new IllegalArgumentException("Bootstrap admin requires an email and a password of 12 characters or more (maximum 72 UTF-8 bytes)");
            String normalizedEmail = email.trim().toLowerCase();
            if (users.findByEmail(normalizedEmail).isPresent()) return;
            User admin = new User();
            admin.setName("Library administrator");
            admin.setEmail(normalizedEmail);
            admin.setPassword(encoder.encode(password));
            admin.setRole(User.Role.SUPER_ADMIN);
            users.save(admin);
        };
    }
}

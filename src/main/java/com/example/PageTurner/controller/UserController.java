package com.example.PageTurner.controller;

import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.UserRepository;
import com.example.PageTurner.service.SessionUserService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.regex.*;
import java.util.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
        Pattern.CASE_INSENSITIVE
    );

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody User user) {
        try {
            if (user.getName() == null || user.getEmail() == null || user.getPassword() == null)
                return ResponseEntity.badRequest().body("Missing required fields");
            String name = user.getName().trim();
            String email = user.getEmail().trim().toLowerCase();
            if (name.isEmpty() || email.isEmpty())
                return ResponseEntity.badRequest().body("Fields cannot be empty");
            if (name.length() > 100 || email.length() > 255)
                return ResponseEntity.badRequest().body("Input exceeds maximum length");
            if (!EMAIL_PATTERN.matcher(email).matches())
                return ResponseEntity.badRequest().body("Invalid email format");
            if (user.getPassword().length() < 6 || user.getPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
                return ResponseEntity.badRequest().body("Password must be at least 6 characters and at most 72 UTF-8 bytes");
            if (userRepository.findByEmail(email).isPresent())
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
            user.setId(0);
            user.setTenantId(null);
            user.setName(name);
            user.setEmail(email);
            user.setRole(User.Role.USER);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userRepository.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An error occurred during signup");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials, HttpServletRequest request) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");

            if (email == null || password == null)
                return ResponseEntity.badRequest().body("Missing email or password");
            email = email.trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty())
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            User user = userOpt.get();
            if (!passwordEncoder.matches(password, user.getPassword()))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");

            HttpSession session = request.getSession(true);
            request.changeSessionId();
            session.setAttribute("currentUser", user.getId());
            session.setAttribute("isAdmin", user.getRole() == User.Role.SUPER_ADMIN);
            session.setMaxInactiveInterval(30 * 60);
            
            return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .body(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An error occurred during login");
        }
    }


    @GetMapping("/me")
    public ResponseEntity<?> currentUser(HttpServletRequest request) {
        User user = new SessionUserService(userRepository).findCurrentUser(request);
        return user == null ? ResponseEntity.status(401).body("Please sign in first") : ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.ok("Signed out successfully");
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable int id, @RequestBody Map<String, String> passwordData,
                                            HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("currentUser") instanceof Number currentUserId))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please sign in first");
        if (currentUserId.intValue() != id)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only change your own password");
        String oldPassword = passwordData.get("oldPassword");
        String newPassword = passwordData.get("newPassword");

        if (oldPassword == null || newPassword == null)
            return ResponseEntity.badRequest().body("Missing password fields");
        if (newPassword.length() < 6 || newPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
            return ResponseEntity.badRequest().body("New password must be between 6 and 72 characters");
        return userRepository.findById(id)
            .map(user -> {
                if (!passwordEncoder.matches(oldPassword, user.getPassword()))
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Current password is incorrect");
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return ResponseEntity.ok("Password updated successfully!");
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @GetMapping
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updatedUser) {
        if (updatedUser.getName() == null || updatedUser.getName().isBlank()
                || updatedUser.getEmail() == null || !EMAIL_PATTERN.matcher(updatedUser.getEmail().trim()).matches())
            return ResponseEntity.badRequest().body("A name and valid email address are required");
        String email = updatedUser.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).filter(user -> user.getId() != id).isPresent())
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        String password = updatedUser.getPassword();
        if (password != null && !password.isEmpty() && (password.length() < 6 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72))
            return ResponseEntity.badRequest().body("Password must be between 6 and 72 characters");
        return userRepository.findById(id)
            .map(user -> {
                user.setName(updatedUser.getName().trim());
                user.setEmail(email);
                if (password != null && !password.isEmpty()) user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
                return ResponseEntity.ok("User updated!");
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) {
        if (!userRepository.findById(id).isPresent())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted!");
    }

    @PatchMapping("/{id}/admin")
    public ResponseEntity<?> updateAdminStatus(@PathVariable int id, @RequestBody Map<String, Boolean> body) {
        return userRepository.findById(id)
            .map(user -> {
                user.setRole(body.getOrDefault("isAdmin", false) ? User.Role.SUPER_ADMIN : User.Role.USER);
                userRepository.save(user);
                return ResponseEntity.ok("Admin status updated!");
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }
}

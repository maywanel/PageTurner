package com.example.PageTurner.controller;

import com.example.PageTurner.dto.AuthResponse;
import com.example.PageTurner.dto.LoginRequest;
import com.example.PageTurner.dto.RegisterRequest;
import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.UserRepository;
import com.example.PageTurner.service.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Authentication authenticated;
        try {
            authenticated = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException exception) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        
        // 2. Fetch the full User object to get the Tenant ID and Role
        User user = userRepository.findById(Integer.parseInt(authenticated.getName())).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("Invalid credentials");

        // 3. Generate the tenant-aware token
        String token = jwtUtil.generateToken(user);
        
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        return new UserController(userRepository).addUser(user);
    }
}

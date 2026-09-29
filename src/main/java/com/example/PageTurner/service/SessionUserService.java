package com.example.PageTurner.service;

import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SessionUserService {
    private final UserRepository users;
    public SessionUserService(UserRepository users) { this.users = users; }

    public User findCurrentUser(HttpServletRequest request) {
        if (request.getAttribute("authenticatedUser") instanceof User user) return user;
        var session = request.getSession(false);
        User user = null;
        if (session != null && session.getAttribute("currentUser") instanceof Number id) {
            user = users.findById(id.intValue()).orElse(null);
            if (user == null) session.invalidate();
        } else if (request.getUserPrincipal() != null) {
            user = users.findByEmail(request.getUserPrincipal().getName()).orElse(null);
        }
        if (user != null) request.setAttribute("authenticatedUser", user);
        return user;
    }

    public int requireUserId(HttpServletRequest request) {
        User user = findCurrentUser(request);
        if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in first");
        return user.getId();
    }

    public static boolean isAdmin(User user) {
        return user != null && (user.getRole() == User.Role.SUPER_ADMIN || user.getRole() == User.Role.TENANT_ADMIN);
    }
}

package com.example.PageTurner.service;

import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Enforces current database-backed permissions for page and API requests. */
@Component
public class AdminInterceptor implements HandlerInterceptor {
    private final SessionUserService sessions;
    public AdminInterceptor(UserRepository users) { this.sessions = new SessionUserService(users); }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws Exception {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (path.length() > 1 && path.endsWith("/")) path = path.substring(0, path.length() - 1);
        boolean publicPost = "POST".equals(request.getMethod()) &&
            (path.equals("/users") || path.equals("/users/login") || path.equals("/users/logout"));
        if (publicPost) return true;
        boolean api = path.equals("/users") || path.startsWith("/users/") || path.startsWith("/books") || path.startsWith("/api/");
        User user = sessions.findCurrentUser(request);
        if (user == null) {
            if (api) {
                response.setHeader("X-Session-Expired", "true");
                reject(response, 401, "Your session has expired. Please sign in.");
            } else response.sendRedirect(request.getContextPath() + "/login?expired=1");
            return false;
        }
        response.setHeader("Cache-Control", "no-store");
        boolean personal = path.equals("/users/me") || path.matches("/users/\\d+/password");
        boolean administrative = path.startsWith("/admin") || path.equals("/systeminfo")
            || path.startsWith("/api/system") || (path.startsWith("/users") && !personal);
        if (administrative && !SessionUserService.isAdmin(user)) {
            if (api) reject(response, 403, "Administrator access required");
            else response.sendRedirect(request.getContextPath() + "/error/403");
            return false;
        }
        return true;
    }

    private void reject(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}

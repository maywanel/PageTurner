package com.example.PageTurner.filter;

import com.example.PageTurner.config.TenantContextHolder;
import com.example.PageTurner.service.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.PageTurner.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository users) {
        this.jwtUtil = jwtUtil;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
            
        String authHeader = request.getHeader("Authorization");
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                int accountId;
                try {
                    var claims = jwtUtil.verify(authHeader.substring(7));
                    accountId = Integer.parseInt(claims.getSubject());
                    if (claims.getExpiration() == null) throw new IllegalArgumentException();
                    TenantContextHolder.setTenantId(claims.get("tenantId", String.class));
                } catch (JwtException | IllegalArgumentException invalid) {
                    response.sendError(401);
                    return;
                }
                var user = users.findById(accountId).orElse(null);
                if (user == null) {
                    response.sendError(401);
                    return;
                }
                var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(Integer.toString(accountId), null, List.of(authority)));
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
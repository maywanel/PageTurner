package com.example.PageTurner.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.lang.NonNull;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_SECONDS = 60;
    private static final long GENERAL_LIMIT = 100;
    private static final long AUTH_LIMIT = 10;

    private static final DefaultRedisScript<Long> INCREMENT_SCRIPT = new DefaultRedisScript<>(
        "local current = redis.call('INCR', KEYS[1]) " +
        "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end " +
        "return current",
        Long.class
    );

    private final StringRedisTemplate redisTemplate;

    private final boolean behindGateway;

    public RateLimitFilter(StringRedisTemplate redisTemplate,
            @Value("${app.trust-gateway-ip:false}") boolean behindGateway) {
        this.behindGateway = behindGateway;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (request.getRequestURI().equals("/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean authenticationRequest = isAuthenticationRequest(request);
        long limit = authenticationRequest ? AUTH_LIMIT : GENERAL_LIMIT;
        String bucket = authenticationRequest ? "auth" : "general";
        String key = "pageturner:rate-limit:" + bucket + ":" + clientIp(request);

        try {
            Long count = redisTemplate.execute(
                INCREMENT_SCRIPT,
                List.of(key),
                Long.toString(WINDOW_SECONDS)
            );
            if (count == null) throw new IllegalStateException("Rate limit unavailable");
            long requestCount = count;
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            long retryAfter = Math.max(1, ttl == null || ttl < 0 ? WINDOW_SECONDS : ttl);

            response.setHeader("X-RateLimit-Limit", Long.toString(limit));
            response.setHeader("X-RateLimit-Remaining", Long.toString(Math.max(0, limit - requestCount)));

            if (requestCount > limit) {
                response.setHeader("Retry-After", Long.toString(retryAfter));
                response.sendError(429,
                    "Too many requests. Please try again later.");
                return;
            }
        } catch (RuntimeException exception) {
            if (authenticationRequest) {
                response.sendError(503, "Sign-in and registration are temporarily unavailable");
                return;
            }
            response.setHeader("X-RateLimit-Status", "unavailable");
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isAuthenticationRequest(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = request.getServletPath();
        if (path.isEmpty()) path = request.getPathInfo();
        if (path == null) path = request.getRequestURI();
        return path.equals("/login")
            || path.equals("/register")
            || path.equals("/users/login")
            || path.equals("/users");
    }

    private String clientIp(HttpServletRequest request) {
        String gatewayIp = request.getHeader("X-Real-IP");
        return behindGateway && gatewayIp != null && !gatewayIp.isBlank()
            ? gatewayIp : request.getRemoteAddr();
    }
}

package com.example.PageTurner.controller;

import com.example.PageTurner.service.SessionUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Authorization subrequest for pages served by the frontend, without rendering HTML. */
@RestController
public class PageAccessController {
    private final SessionUserService sessions;

    public PageAccessController(SessionUserService sessions) { this.sessions = sessions; }

    @GetMapping("/api/page-access")
    public ResponseEntity<Void> access(HttpServletRequest request,
                                       @RequestParam(defaultValue = "false") boolean admin) {
        var user = sessions.findCurrentUser(request);
        int status = user == null ? 401 : admin && !SessionUserService.isAdmin(user) ? 403 : 204;
        return ResponseEntity.status(status).header("Cache-Control", "no-store").build();
    }
}

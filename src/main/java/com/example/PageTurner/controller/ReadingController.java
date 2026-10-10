package com.example.PageTurner.controller;

import com.example.PageTurner.service.ReadingService;
import com.example.PageTurner.service.SessionUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/books/reading")
public class ReadingController {
    private final ReadingService reading;
    private final SessionUserService sessions;
    public ReadingController(ReadingService reading, SessionUserService sessions) { this.reading = reading; this.sessions = sessions; }
    @GetMapping
    public ReadingService.ReadingOptions options(@RequestParam String isbn, HttpServletRequest request) {
        sessions.requireUserId(request);
        return reading.findByIsbn(isbn);
    }
}

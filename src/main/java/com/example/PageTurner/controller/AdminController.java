package com.example.PageTurner.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class AdminController {
    @GetMapping("/admin")
    public String home(Model model, HttpServletRequest request) {
        model.addAttribute("message", "Admin Section");
        return "admin_section/index";
    }
    
    @GetMapping("/admin/users")
    public String users() {
        return "user_management/users";
    }
}

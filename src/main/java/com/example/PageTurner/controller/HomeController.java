package com.example.PageTurner.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(Model model, HttpServletRequest request) {
        return "redirect:/login";
    }
    
    @GetMapping("/home")
    public String homePage(Model model, HttpServletRequest request) {
        model.addAttribute("message", "Welcome to the Spring Boot Application!");
        return "home/index.html";
    }
    
    @GetMapping("/login")
    public String login() {
        return "login/login.html";
    }
    
    @GetMapping("/register")
    public String register() {
        return "login/signup.html";
    }
    
    @GetMapping("/settings")
    public String settings() {
        return "user_management/settings.html";
    }
    
    @GetMapping("/systeminfo")
    public String systemInfo() {
        return "user_management/systeminfo.html";
    }
    
    @GetMapping("/error/403")
    public String forbidden() {
        return "error/403.html";
    }
    @GetMapping("/error/404")
    public String NotFound() {
        return "error/404.html";
    }

    @GetMapping("/error/500")
    public String internalServerError() {
        return "error/500.html";
    }

}

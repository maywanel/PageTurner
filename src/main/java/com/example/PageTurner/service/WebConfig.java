package com.example.PageTurner.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private @NonNull AdminInterceptor adminInterceptor;
    
    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(adminInterceptor)
                .addPathPatterns("/admin/**", "/systeminfo", "/users/**", "/api/system/**", "/books/**", "/home", "/settings")
                .excludePathPatterns("/error/**", "/login", "/register");
    }
}

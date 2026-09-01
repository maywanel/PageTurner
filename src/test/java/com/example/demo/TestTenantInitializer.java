package com.example.demo;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import com.example.demo.config.TenantContextHolder;

public class TestTenantInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        // Ensure a tenant id is available during test ApplicationContext bootstrap
        TenantContextHolder.setTenantId("public");
    }
}

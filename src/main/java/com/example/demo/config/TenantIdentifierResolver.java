package com.example.demo.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {
    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContextHolder.getTenantId();
        // Hibernate requires a default fallback for public routes or application startup
        return (tenantId != null) ? tenantId : "public"; 
    }

    @Override
    public boolean validateExistingCurrentSessions() { return true; }
}
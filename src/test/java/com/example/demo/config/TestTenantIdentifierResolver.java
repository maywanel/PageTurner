package com.example.demo.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Test-only resolver to ensure a tenant id is available during tests.
 */
@Component
@Primary
public class TestTenantIdentifierResolver implements CurrentTenantIdentifierResolver {

    @Override
    public String resolveCurrentTenantIdentifier() {
        return "public";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}

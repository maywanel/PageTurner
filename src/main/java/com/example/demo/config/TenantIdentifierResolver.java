package com.example.demo.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("'${spring.jpa.properties.hibernate.multitenancy.strategy:}' != 'NONE' and '${spring.jpa.properties.hibernate.multitenancy.strategy:}' != 'org.hibernate.MultiTenancyStrategy.NONE'")
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {
    @Override
    public String resolveCurrentTenantIdentifier() {
        return TenantContextHolder.getTenantId();
    }

    @Override
    public boolean validateExistingCurrentSessions() { return true; }
}
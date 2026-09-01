package com.example.demo.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class DevTenantConfig {

    @Bean
    @Primary
    @ConditionalOnProperty(prefix = "spring.jpa.properties.hibernate", name = "multitenancy.strategy", havingValue = "org.hibernate.MultiTenancyStrategy.NONE")
    public CurrentTenantIdentifierResolver devTenantResolver() {
        return new CurrentTenantIdentifierResolver<String>() {
            @Override
            public String resolveCurrentTenantIdentifier() {
                return "public";
            }

            @Override
            public boolean validateExistingCurrentSessions() { return true; }
        };
    }
}

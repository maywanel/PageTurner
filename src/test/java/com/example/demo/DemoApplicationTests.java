package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.context.annotation.Import;
import com.example.demo.config.SecurityConfig;

@SpringBootTest(properties = {
	"spring.jpa.properties.hibernate.multitenancy.strategy=org.hibernate.MultiTenancyStrategy.NONE",
	"spring.jpa.properties.hibernate.multitenancy.identifier_resolver=",
	"spring.data.jpa.repositories.bootstrap-mode=deferred"
})
@ComponentScan(excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class))
@ContextConfiguration(initializers = TestTenantInitializer.class)
@Import(com.example.demo.config.TestRepositoryStubsConfiguration.class)
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}

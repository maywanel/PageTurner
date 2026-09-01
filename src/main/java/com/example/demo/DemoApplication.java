package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.config.TenantContextHolder;


@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		// If multitenancy is disabled for local/dev runs, set a default tenant
		String strategy = System.getenv("SPRING_JPA_PROPERTIES_HIBERNATE_MULTITENANCY_STRATEGY");
		String disable = System.getenv("DISABLE_MULTITENANCY");
		if (strategy != null) strategy = strategy.trim();
		if (disable != null) disable = disable.trim();
		// Log values for debugging environment propagation in container
		System.out.println("[DEBUG] SPRING_JPA_PROPERTIES_HIBERNATE_MULTITENANCY_STRATEGY='" + strategy + "' DISABLE_MULTITENANCY='" + disable + "'");
		if ((strategy != null && (strategy.equals("org.hibernate.MultiTenancyStrategy.NONE") || strategy.equalsIgnoreCase("NONE")))
				|| (disable != null && disable.equalsIgnoreCase("true"))) {
			TenantContextHolder.setTenantId("public");
		}
		SpringApplication.run(DemoApplication.class, args);
	}
	
	@Bean
	public CommandLineRunner initDatabase(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
		return args -> {
			TenantContextHolder.setTenantId("public");
			try {
				if (userRepository.findByEmail("mouhamedelmessadi@gmail.com").isEmpty()) {
					User admin = new User();
					admin.setName("mohamed");
					admin.setEmail("mouhamedelmessadi@gmail.com");
					admin.setPassword(passwordEncoder.encode("simo6206"));
					admin.setRole(User.Role.SUPER_ADMIN);
					userRepository.save(admin);
				}
			} finally {
				TenantContextHolder.clear();
			}
		};
	}
}
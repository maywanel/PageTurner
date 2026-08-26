package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;


@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}
	
	@Bean
	public CommandLineRunner initDatabase(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.findByEmail("mouhamedelmessadi@gmail.com").isEmpty()) {
				User admin = new User();
				admin.setName("mohamed");
				admin.setEmail("mouhamedelmessadi@gmail.com");
				admin.setPassword(passwordEncoder.encode("simo6206"));
				admin.setRole(User.Role.SUPER_ADMIN);
				userRepository.save(admin);
			}
		};
	}
}

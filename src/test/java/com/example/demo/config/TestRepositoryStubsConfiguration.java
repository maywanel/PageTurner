package com.example.demo.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.BookRepository;
import org.mockito.Mockito;

@TestConfiguration
public class TestRepositoryStubsConfiguration {

    @Bean
    public UserRepository userRepository() {
        return Mockito.mock(UserRepository.class);
    }

    @Bean
    public BookRepository bookRepository() {
        return Mockito.mock(BookRepository.class);
    }

}

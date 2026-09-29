package com.example.PageTurner.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import com.example.PageTurner.repository.UserRepository;
import com.example.PageTurner.repository.BookRepository;
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

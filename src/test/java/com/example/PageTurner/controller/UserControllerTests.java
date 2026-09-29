package com.example.PageTurner.controller;

import com.example.PageTurner.controller.UserController;
import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.UserRepository;
import com.example.PageTurner.service.AdminInterceptor;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerTests {
    private UserRepository repository;
    private UserController controller;
    private MockMvc mvc;
    private User reader;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setup() {
        repository = mock(UserRepository.class);
        controller = new UserController(repository);
        mvc = MockMvcBuilders.standaloneSetup(controller)
            .addMappedInterceptors(new String[]{"/users", "/users/*", "/users/*/admin"}, new AdminInterceptor(repository))
            .build();
        reader = new User();
        reader.setId(7);
        reader.setName("Reader");
        reader.setEmail("reader@example.com");
        reader.setPassword(encoder.encode("old-password"));
        when(repository.findById(7)).thenReturn(Optional.of(reader));
    }

    @Test
    void readerCanChangeOwnPassword() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("currentUser", 7);
        mvc.perform(put("/users/7/password").session(session).contentType("application/json")
            .content("{\"oldPassword\":\"old-password\",\"newPassword\":\"new-password\"}"))
            .andExpect(status().isOk());
        assertTrue(encoder.matches("new-password", reader.getPassword()));
        verify(repository).save(reader);
    }

    @Test
    void passwordChangeRequiresTheOwningSession() throws Exception {
        String body = "{\"oldPassword\":\"old-password\",\"newPassword\":\"new-password\"}";
        mvc.perform(put("/users/7/password").contentType("application/json").content(body))
            .andExpect(status().isUnauthorized());
        MockHttpSession other = new MockHttpSession();
        other.setAttribute("currentUser", 9);
        mvc.perform(put("/users/7/password").session(other).contentType("application/json").content(body))
            .andExpect(status().isForbidden());
        verify(repository, never()).save(any());
    }

    @Test
    void wrongCurrentPasswordDoesNotChangeThePassword() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("currentUser", 7);
        mvc.perform(put("/users/7/password").session(session).contentType("application/json")
            .content("{\"oldPassword\":\"incorrect\",\"newPassword\":\"new-password\"}"))
            .andExpect(status().isUnauthorized());
        verify(repository, never()).save(any());
    }

    @Test
    void logoutInvalidatesTheSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("currentUser", 7);
        mvc.perform(post("/users/logout").session(session)).andExpect(status().isOk());
        assertTrue(session.isInvalid());
        mvc.perform(post("/users/logout")).andExpect(status().isOk());
    }

    @Test
    void adminEditUpdatesPasswordAndBlankEditPreservesIt() {
        User update = new User();
        update.setName("Updated reader");
        update.setEmail("reader@example.com");
        update.setPassword("edited-password");
        assertEquals(200, controller.updateUser(7, update).getStatusCode().value());
        assertTrue(encoder.matches("edited-password", reader.getPassword()));
        String hash = reader.getPassword();
        update.setPassword("");
        controller.updateUser(7, update);
        assertEquals(hash, reader.getPassword());
    }

    @Test
    void passwordIsAcceptedAsInputButNeverSerialized() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        assertFalse(mapper.readTree(mapper.writeValueAsString(reader)).has("password"));
        assertEquals("input-password", mapper.readValue("{\"password\":\"input-password\"}", User.class).getPassword());
    }
}

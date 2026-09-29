package com.example.PageTurner;

import com.example.PageTurner.model.Book;
import com.example.PageTurner.model.User;
import com.example.PageTurner.repository.BookRepository;
import com.example.PageTurner.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=",
    "spring.datasource.url=jdbc:h2:mem:privatebooks;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.data.jpa.repositories.bootstrap-mode=default",
    "spring.jpa.properties.hibernate.multitenancy.strategy=NONE",
    "spring.jpa.properties.hibernate.multitenancy.identifier_resolver=",
    "app.bootstrap-admin.email=", "app.bootstrap-admin.password="
})
@AutoConfigureMockMvc
class PrivateBookshelfTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired BookRepository books;
    @Autowired ObjectMapper mapper;
    private User alice, bob;
    private MockHttpSession aliceSession, bobSession;
    private static final String BOOK = "{\"title\":\"A shared title\",\"author\":\"An Author\",\"description\":\"A book\"}";

    @BeforeEach
    void setup() {
        books.deleteAll(); users.deleteAll();
        alice = user("alice@example.com"); bob = user("bob@example.com");
        aliceSession = session(alice); bobSession = session(bob);
    }
    private User user(String email) {
        User user = new User(); user.setName(email); user.setEmail(email); user.setPassword("unused-test-password");
        return users.save(user);
    }
    private MockHttpSession session(User user) {
        MockHttpSession session = new MockHttpSession(); session.setAttribute("currentUser", user.getId()); return session;
    }
    private MockHttpServletRequestBuilder csrf(MockHttpServletRequestBuilder request, MockHttpSession session) throws Exception {
        var response = mvc.perform(get("/api/csrf").session(session)).andExpect(status().isOk()).andReturn();
        JsonNode token = mapper.readTree(response.getResponse().getContentAsString());
        return request.session(session).header(token.get("headerName").asText(), token.get("token").asText()).contentType("application/json");
    }
    private long save(MockHttpSession session) throws Exception {
        var result = mvc.perform(csrf(post("/books"), session).content(BOOK)).andExpect(status().isOk()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void twoUsersCanSaveSameTitleWithoutSharingRecords() throws Exception {
        long a = save(aliceSession), b = save(bobSession);
        assertNotEquals(a, b);
        mvc.perform(get("/books").session(aliceSession)).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(a));
        mvc.perform(get("/books").session(bobSession)).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(b));
        mvc.perform(csrf(post("/books"), aliceSession).content(BOOK)).andExpect(status().isConflict());
    }

    @Test
    void otherUsersCannotReadModifyOrDeleteABook() throws Exception {
        long id = save(aliceSession);
        mvc.perform(get("/books/" + id).session(bobSession)).andExpect(status().isNotFound());
        mvc.perform(csrf(put("/books/" + id), bobSession).content(BOOK)).andExpect(status().isNotFound());
        mvc.perform(csrf(patch("/books/" + id + "/status"), bobSession).content("{\"readingStatus\":\"FINISHED\"}")).andExpect(status().isNotFound());
        mvc.perform(csrf(delete("/books/" + id), bobSession)).andExpect(status().isNotFound());
        assertTrue(books.findById(id).isPresent());
    }

    @Test
    void suppliedIdentityCannotOverwriteAnotherUsersBook() throws Exception {
        long id = save(aliceSession);
        String input = BOOK.replace("A shared title", "Different title").replace("{", "{\"id\":" + id + ",\"ownerId\":" + alice.getId() + ",");
        var result = mvc.perform(csrf(post("/books"), bobSession).content(input)).andExpect(status().isOk()).andReturn();
        long created = mapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertNotEquals(id, created);
        assertEquals(bob.getId(), books.findById(created).orElseThrow().getOwnerId());
        assertEquals(alice.getId(), books.findById(id).orElseThrow().getOwnerId());
    }

    @Test
    void readingStatusPersistsAndInvalidValuesAreRejected() throws Exception {
        long id = save(aliceSession);
        for (String value : new String[]{"READING", "FINISHED", "WANT_TO_READ"}) {
            mvc.perform(csrf(patch("/books/" + id + "/status"), aliceSession).content("{\"readingStatus\":\"" + value + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.readingStatus").value(value));
            assertEquals(value, books.findById(id).orElseThrow().getReadingStatus().name());
        }
        mvc.perform(csrf(patch("/books/" + id + "/status"), aliceSession).content("{\"readingStatus\":\"INVALID\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void legacyBooksStayUnassigned() throws Exception {
        Book legacy = new Book(); legacy.setTitle("Legacy"); legacy.setAuthor("Unknown owner"); books.save(legacy);
        mvc.perform(get("/books").session(aliceSession)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/books/" + legacy.getId()).session(aliceSession)).andExpect(status().isNotFound());
        assertEquals(1, books.count());
    }

    @Test
    void expiredSessionAndCsrfAreEnforced() throws Exception {
        mvc.perform(get("/books")).andExpect(status().isUnauthorized()).andExpect(header().string("X-Session-Expired", "true"));
        mvc.perform(get("/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/home")).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/login?expired=1"));
        mvc.perform(post("/books").session(aliceSession).contentType("application/json").content(BOOK)).andExpect(status().isForbidden());
    }

    @Test
    void rolesAndAccountDetailsComeFromDatabase() throws Exception {
        aliceSession.setAttribute("isAdmin", true);
        mvc.perform(get("/users").session(aliceSession)).andExpect(status().isForbidden());
        alice.setRole(User.Role.SUPER_ADMIN); users.save(alice);
        mvc.perform(get("/users").session(aliceSession)).andExpect(status().isOk());
        alice.setRole(User.Role.USER); alice.setName("Updated name"); users.save(alice);
        mvc.perform(get("/users").session(aliceSession)).andExpect(status().isForbidden());
        mvc.perform(get("/users/me").session(aliceSession)).andExpect(jsonPath("$.name").value("Updated name")).andExpect(jsonPath("$.password").doesNotExist());
        users.delete(alice);
        mvc.perform(get("/users/me").session(aliceSession)).andExpect(status().isUnauthorized());
    }

    @Test
    void searchRejectsInvalidPagesBeforeCallingExternalApi() throws Exception {
        mvc.perform(get("/books/search?query=fantasy&page=0").session(aliceSession)).andExpect(status().isBadRequest());
        mvc.perform(get("/books/search?query=fantasy&page=101").session(aliceSession)).andExpect(status().isBadRequest());
    }
}

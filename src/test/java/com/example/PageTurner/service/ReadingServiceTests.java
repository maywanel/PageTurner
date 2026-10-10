package com.example.PageTurner.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import static org.junit.jupiter.api.Assertions.*;

class ReadingServiceTests {
    private ReadingService service(String json) {
        return new ReadingService(WebClient.builder().exchangeFunction(request -> Mono.just(
            ClientResponse.create(HttpStatus.OK).header("Content-Type", "application/json").body(json).build())));
    }
    @Test void returnsReadableAndBorrowableEditionsButNotRestrictedOnes() {
        var options = service("""
            {"items":[
              {"status":"full access","itemURL":"http://archive.org/stream/example","match":"exact"},
              {"status":"lendable","itemURL":"https://openlibrary.org/books/OL1M","match":"similar"},
              {"status":"restricted","itemURL":"https://archive.org/details/restricted"},
              {"status":"full access","itemURL":"https://evil.example/book"}
            ]}
            """).findByIsbn("978-0141439518").options();
        assertEquals(2, options.size());
        assertEquals("https://archive.org/stream/example", options.getFirst().url());
        assertEquals("Read online", options.getFirst().label());
        assertTrue(options.getLast().differentEdition());
    }
    @Test void rejectsUnsafeLinks() {
        for (String url : new String[]{"javascript:alert(1)", "https://archive.org.evil.example/book", "https://name:pass@archive.org/book", "//archive.org/book", "https://archive.org:444/book"})
            assertNull(ReadingService.safeReaderUrl(url));
    }
    @Test void absentEditionsAreNotInvented() { assertTrue(service("{\"items\":[]}").findByIsbn("0141439513").options().isEmpty()); }
    @Test void malformedIdentifiersAreRejectedBeforeFetching() {
        var error = assertThrows(ResponseStatusException.class, () -> service("{}").findByIsbn("../../x"));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }
    @Test void networkFailuresRemainRetryableErrors() {
        var service = new ReadingService(WebClient.builder().exchangeFunction(request -> Mono.error(new RuntimeException("Offline"))));
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(ResponseStatusException.class, () -> service.findByIsbn("0141439513")).getStatusCode());
    }
}

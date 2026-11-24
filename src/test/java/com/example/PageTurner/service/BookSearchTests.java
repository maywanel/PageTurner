package com.example.PageTurner.service;

import com.example.PageTurner.repository.BookRepository;
import com.example.PageTurner.service.BookService;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import java.util.ArrayList;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import com.sun.net.httpserver.HttpServer;
import org.springframework.web.reactive.function.client.ClientRequest;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class BookSearchTests {
    @Test
    void refreshRequestsDifferentPagesAndMapsMetadata() {
        var requested = new ArrayList<String>();
        WebClient.Builder builder = WebClient.builder().exchangeFunction(request -> {
            requested.add(request.url().toString());
            return Mono.just(ClientResponse.create(HttpStatus.OK).header("Content-Type", "application/json")
                .body("{\"docs\":[{\"title\":\"Book " + requested.size() + "\",\"author_name\":[\"Writer\"],\"cover_i\":123}]}").build());
        });
        BookService service = new BookService(mock(BookRepository.class), builder);
        assertEquals("Book 1", service.searchBooksFromApi("fantasy", 1).getFirst().getTitle());
        assertEquals("Book 2", service.searchBooksFromApi("fantasy", 2).getFirst().getTitle());
        assertTrue(requested.getFirst().contains("page=1"));
        assertTrue(requested.getLast().contains("page=2"));
        assertTrue(requested.getLast().contains("limit=24"));
    }
    @Test
    void upstreamFailureIsAnErrorInsteadOfAnEmptyCollection() {
        var builder = WebClient.builder().exchangeFunction(request -> Mono.just(ClientResponse.create(HttpStatus.SERVICE_UNAVAILABLE).build()));
        var error = assertThrows(ResponseStatusException.class, () -> new BookService(mock(BookRepository.class), builder).searchBooksFromApi("fantasy", 1));
        assertEquals(HttpStatus.BAD_GATEWAY, error.getStatusCode());
    }
    @Test
    void popularSubjectsCanDecodeMoreThanTheDefaultBufferLimit() throws Exception {
        String isbns = "\"9780141439518\",".repeat(30_000) + "\"9780141439518\"";
        byte[] payload = ("{\"docs\":[{\"title\":\"Fiction classic\",\"author_name\":[\"Writer\"],"
            + "\"cover_i\":123,\"isbn\":[" + isbns + "]}]}").getBytes(StandardCharsets.UTF_8);
        assertTrue(payload.length > 256 * 1024);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/search.json", exchange -> {
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, payload.length);
            try (var body = exchange.getResponseBody()) { body.write(payload); }
        });
        server.start();
        try {
            URI endpoint = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/search.json");
            var builder = WebClient.builder().filter((request, next) ->
                next.exchange(ClientRequest.from(request).url(endpoint).build()));
            var result = new BookService(mock(BookRepository.class), builder).searchBooksFromApi("subject:fiction", 1);
            assertEquals(1, result.size());
            assertEquals("Fiction classic", result.getFirst().getTitle());
            assertEquals("9780141439518", result.getFirst().getIsbn());
            assertEquals(123L, result.getFirst().getCoverId());
        } finally {
            server.stop(0);
        }
    }

}

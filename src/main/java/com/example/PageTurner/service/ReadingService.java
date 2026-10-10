package com.example.PageTurner.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ReadingService {
    private final WebClient client;
    public ReadingService(WebClient.Builder builder) { client = builder.baseUrl("https://openlibrary.org").build(); }
    public record ReadingOption(String label, String url, String access, boolean differentEdition) {}
    public record ReadingOptions(List<ReadingOption> options) {}

    public ReadingOptions findByIsbn(String isbn) {
        String normalized = isbn.replaceAll("[\\s-]", "").toUpperCase(java.util.Locale.ROOT);
        if (!normalized.matches("(?:[0-9]{9}[0-9X]|[0-9]{13})"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid ISBN is required");
        try {
            JsonNode result = client.get().uri("/api/volumes/brief/isbn/{isbn}.json", normalized)
                .retrieve().bodyToMono(JsonNode.class).timeout(Duration.ofSeconds(12)).block();
            List<ReadingOption> options = new ArrayList<>();
            if (result != null && result.path("items").isArray()) {
                for (JsonNode item : result.path("items")) {
                    String access = item.path("status").asText();
                    String label = switch (access) {
                        case "full access" -> "Read online";
                        case "lendable" -> "Borrow on Open Library";
                        case "checked out" -> "Check borrowing availability";
                        default -> null;
                    };
                    String url = safeReaderUrl(item.path("itemURL").asText());
                    if (label != null && url != null && options.stream().noneMatch(option -> option.url().equals(url))) {
                        options.add(new ReadingOption(label, url, access, "similar".equals(item.path("match").asText())));
                        if (options.size() == 3) break;
                    }
                }
            }
            return new ReadingOptions(options);
        } catch (Exception error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Reading availability could not be checked. Please try again.", error);
        }
    }

    static String safeReaderUrl(String value) {
        try {
            URI uri = URI.create(value);
            if (!Set.of("http", "https").contains(uri.getScheme()) || uri.getUserInfo() != null
                || !Set.of("archive.org", "www.archive.org", "openlibrary.org", "www.openlibrary.org").contains(uri.getHost())
                || (uri.getPort() != -1 && uri.getPort() != 443 && uri.getPort() != 80)) return null;
            return new URI("https", null, uri.getHost(), -1, uri.getPath(), uri.getQuery(), uri.getFragment()).toASCIIString();
        } catch (Exception ignored) { return null; }
    }
}

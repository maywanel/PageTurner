package com.example.PageTurner.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record OpenLibraryResponse(
    @JsonProperty("docs") List<Doc> docs
) {
    public record Doc(
        @JsonProperty("title") String title,
        @JsonProperty("author_name") List<String> authorName,
        @JsonProperty("first_publish_year") Integer firstPublishYear,
        @JsonProperty("isbn") List<String> isbn,
        @JsonProperty("cover_i") Long coverId
    ) {}
}
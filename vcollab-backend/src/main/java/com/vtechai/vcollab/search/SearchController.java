package com.vtechai.vcollab.search;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.search.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {
    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
        @RequestParam(value = "query", required = false) String query,
        @RequestParam(value = "size", defaultValue = "4") int size
    ) {
        SearchResponse response = searchService.search(query, size);
        return ResponseEntity.ok(ApiResponse.ok("Search results", response));
    }
}

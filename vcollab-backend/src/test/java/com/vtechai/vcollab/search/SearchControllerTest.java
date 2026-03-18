package com.vtechai.vcollab.search;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vtechai.vcollab.search.dto.SearchResponse;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SearchControllerTest {
    @Mock
    private SearchService searchService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new SearchController(searchService)).build();
    }

    @Test
    void returnsAggregatedSearchResults() throws Exception {
        SearchResponse response = SearchResponse.builder()
            .query("react")
            .requestedSize(6)
            .stats(SearchResponse.SearchStats.builder()
                .totalResults(12)
                .userCount(2)
                .projectCount(4)
                .postCount(3)
                .blogCount(3)
                .build())
            .users(Collections.emptyList())
            .projects(Collections.emptyList())
            .posts(Collections.emptyList())
            .blogs(Collections.emptyList())
            .build();

        when(searchService.search("react", 6)).thenReturn(response);

        mockMvc.perform(get("/api/v1/search")
                .param("query", "react")
                .param("size", "6"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.query").value("react"))
            .andExpect(jsonPath("$.data.requestedSize").value(6))
            .andExpect(jsonPath("$.data.stats.totalResults").value(12))
            .andExpect(jsonPath("$.data.stats.userCount").value(2))
            .andExpect(jsonPath("$.data.stats.projectCount").value(4))
            .andExpect(jsonPath("$.data.stats.postCount").value(3))
            .andExpect(jsonPath("$.data.stats.blogCount").value(3));
    }
}

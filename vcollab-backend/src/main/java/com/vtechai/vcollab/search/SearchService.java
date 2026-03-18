package com.vtechai.vcollab.search;

import com.vtechai.vcollab.search.dto.SearchResponse;

public interface SearchService {
    SearchResponse search(String query, int size);
}

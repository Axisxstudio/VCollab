package com.vtechai.vcollab.save.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SavedContentResponse {
    private int itemCount;
    private List<SavedItemResponse> items;
}

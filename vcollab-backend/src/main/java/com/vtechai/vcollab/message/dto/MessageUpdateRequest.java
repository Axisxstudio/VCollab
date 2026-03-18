package com.vtechai.vcollab.message.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MessageUpdateRequest {
    @NotBlank(message = "Message content is required")
    private String content;
}

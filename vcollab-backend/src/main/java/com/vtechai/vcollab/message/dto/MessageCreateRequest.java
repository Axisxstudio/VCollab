package com.vtechai.vcollab.message.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageCreateRequest {
    @NotNull
    private Long conversationId;

    private String content;

    private String attachmentUrl;
}

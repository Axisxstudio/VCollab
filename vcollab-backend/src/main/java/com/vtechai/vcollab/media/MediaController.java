package com.vtechai.vcollab.media;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.media.dto.MediaUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {
    private final MediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<MediaUploadResponse>> upload(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "context", defaultValue = "general") String context
    ) {
        MediaType type = inferMediaType(file);
        MediaUploadResponse response = mediaService.upload(file, context, type);
        return ResponseEntity.ok(ApiResponse.ok("Upload successful", response));
    }

    private MediaType inferMediaType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && contentType.startsWith("video/")) {
            return MediaType.VIDEO;
        }
        if (contentType != null && contentType.equalsIgnoreCase("application/pdf")) {
            return MediaType.DOCUMENT;
        }
        return MediaType.IMAGE;
    }
}

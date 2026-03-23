package com.vtechai.vcollab.media;

import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.media.dto.MediaUploadResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {
    private static final Set<String> IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp"
    );
    private static final Set<String> VIDEO_TYPES = Set.of(
        "video/mp4", "video/webm"
    );
    private static final Set<String> DOCUMENT_TYPES = Set.of(
        "application/pdf"
    );
    private static final long MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    private static final long MAX_VIDEO_BYTES = 200 * 1024 * 1024;
    private static final long MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;

    @Value("${app.media.upload-dir}")
    private String uploadDir;

    @Value("${app.media.base-url}")
    private String baseUrl;

    @Override
    public MediaUploadResponse upload(MultipartFile file, String folder, MediaType mediaType) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String contentType = file.getContentType();
        if (mediaType == MediaType.IMAGE) {
            if (contentType == null || !IMAGE_TYPES.contains(contentType)) {
                throw new IllegalArgumentException("Invalid image type");
            }
            if (file.getSize() > MAX_IMAGE_BYTES) {
                throw new IllegalArgumentException("Image too large");
            }
        }
        if (mediaType == MediaType.VIDEO) {
            if (contentType == null || !VIDEO_TYPES.contains(contentType)) {
                throw new IllegalArgumentException("Invalid video type");
            }
            if (file.getSize() > MAX_VIDEO_BYTES) {
                throw new IllegalArgumentException("Video too large");
            }
        }
        if (mediaType == MediaType.DOCUMENT) {
            if (contentType == null || !DOCUMENT_TYPES.contains(contentType)) {
                throw new IllegalArgumentException("Invalid document type");
            }
            if (file.getSize() > MAX_DOCUMENT_BYTES) {
                throw new IllegalArgumentException("Document too large");
            }
        }

        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID().toString();
        if (extension != null && !extension.isBlank()) {
            fileName = fileName + "." + extension;
        }

        Path folderPath = Paths.get(uploadDir, folder);
        try {
            Files.createDirectories(folderPath);
            Path target = folderPath.resolve(fileName);
            Files.copy(file.getInputStream(), target);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store file");
        }

        String url = baseUrl + "/" + folder + "/" + fileName;
        return new MediaUploadResponse(url, fileName, file.getSize(), mediaType);
    }
}

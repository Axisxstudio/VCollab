package com.vtechai.vcollab.media;

import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.media.dto.MediaUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MediaService {
    MediaUploadResponse upload(MultipartFile file, String folder, MediaType mediaType);
}

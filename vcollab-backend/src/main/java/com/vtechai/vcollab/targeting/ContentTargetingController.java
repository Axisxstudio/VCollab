package com.vtechai.vcollab.targeting;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.targeting.dto.ContentTargetingRequest;
import com.vtechai.vcollab.targeting.dto.ContentTargetingResponse;
import jakarta.validation.Valid;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/targeting")
@RequiredArgsConstructor
public class ContentTargetingController {

    private final ContentTargetingService targetingService;

    @PutMapping
    public ResponseEntity<ApiResponse<ContentTargetingResponse>> upsert(
        @Valid @RequestBody ContentTargetingRequest request
    ) {
        ContentTargetingResponse response = targetingService.upsert(request);
        return ResponseEntity.ok(ApiResponse.ok("Targeting saved", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ContentTargetingResponse>> get(
        @RequestParam Long contentId,
        @RequestParam ContentType contentType
    ) {
        Optional<ContentTargetingResponse> response = targetingService.findByContent(contentId, contentType);
        return response
            .map(r -> ResponseEntity.ok(ApiResponse.ok("Targeting", r)))
            .orElse(ResponseEntity.ok(ApiResponse.ok("No targeting set", null)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> remove(
        @RequestParam Long contentId,
        @RequestParam ContentType contentType
    ) {
        targetingService.remove(contentId, contentType);
        return ResponseEntity.ok(ApiResponse.ok("Targeting removed", null));
    }
}

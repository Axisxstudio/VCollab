package com.vtechai.vcollab.save;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.enums.ContentType;
import com.vtechai.vcollab.save.dto.SaveRequest;
import com.vtechai.vcollab.save.dto.SavedContentResponse;
import com.vtechai.vcollab.save.dto.SaveStatusResponse;
import com.vtechai.vcollab.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/saves")
@RequiredArgsConstructor
public class SaveController {
    private final SaveService saveService;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> save(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody SaveRequest request
    ) {
        saveService.save(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Saved", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> unsave(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam ContentType contentType,
        @RequestParam Long contentId
    ) {
        saveService.unsave(contentType, contentId, principal);
        return ResponseEntity.ok(ApiResponse.ok("Unsaved", null));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SaveStatusResponse>> status(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam ContentType contentType,
        @RequestParam Long contentId
    ) {
        boolean saved = saveService.isSaved(contentType, contentId, principal);
        return ResponseEntity.ok(ApiResponse.ok("Save status", new SaveStatusResponse(saved)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<SavedContentResponse>> listSaved(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        SavedContentResponse response = saveService.listSaved(principal);
        return ResponseEntity.ok(ApiResponse.ok("Saved content", response));
    }
}

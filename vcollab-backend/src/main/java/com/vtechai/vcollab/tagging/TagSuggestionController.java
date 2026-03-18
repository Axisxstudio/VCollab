package com.vtechai.vcollab.tagging;

import com.vtechai.vcollab.common.ApiResponse;
import com.vtechai.vcollab.tagging.dto.TagSuggestionDto;
import com.vtechai.vcollab.tagging.entity.SystemTag;
import com.vtechai.vcollab.user.UserRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides unified @mention suggestions combining:
 * 1. User handles (username-based)
 * 2. System audience tags (education metadata-based)
 */
@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagSuggestionController {

    private final SystemTagRepository systemTagRepository;
    private final UserRepository userRepository;

    @GetMapping("/suggest")
    public ResponseEntity<ApiResponse<List<TagSuggestionDto>>> suggest(
        @RequestParam(value = "q", required = false, defaultValue = "") String q
    ) {
        List<TagSuggestionDto> suggestions = new ArrayList<>();

        // 1. User suggestions (match username or fullName)
        userRepository.searchPublicUsers(q.isBlank() ? null : q, null, PageRequest.of(0, 5))
            .forEach(user -> suggestions.add(TagSuggestionDto.builder()
                .handle(user.getUsername())
                .label(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                .type("USER")
                .avatarUrl(user.getProfile() != null ? user.getProfile().getProfileImage() : null)
                .build()));

        // 2. System tag suggestions (audience / education tags)
        if (!q.isBlank()) {
            List<SystemTag> tags = systemTagRepository.searchByNameOrLabel(q);
            tags.stream().limit(8).forEach(tag -> suggestions.add(TagSuggestionDto.builder()
                .handle(tag.getTagName())
                .label(tag.getLabel())
                .type("SYSTEM")
                .icon(tag.getIcon())
                .mappedAttribute(tag.getMappedAttribute())
                .build()));
        }

        return ResponseEntity.ok(ApiResponse.ok("Tag suggestions", suggestions));
    }
}

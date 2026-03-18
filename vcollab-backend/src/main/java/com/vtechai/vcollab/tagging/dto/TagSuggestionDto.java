package com.vtechai.vcollab.tagging.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Unified suggestion item for @mention dropdown —
 * can be a user or a system audience tag.
 */
@Data
@Builder
public class TagSuggestionDto {
    /** The full tag handle (without @) */
    private String handle;
    /** Display name or label */
    private String label;
    /** "USER" or "SYSTEM" */
    private String type;
    /** Avatar URL (for user suggestions) */
    private String avatarUrl;
    /** Icon name (for system tags) */
    private String icon;
    /** Attribute mapping string (for system tags) */
    private String mappedAttribute;
}

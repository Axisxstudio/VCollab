package com.vtechai.vcollab.web;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.vtechai.vcollab.blog.entity.BlogMedia;
import com.vtechai.vcollab.enums.MediaType;
import com.vtechai.vcollab.post.entity.PostMedia;
import com.vtechai.vcollab.project.entity.ProjectMedia;
import org.junit.jupiter.api.Test;

class MediaEntityBuilderDefaultsTest {

    @Test
    void projectMediaBuilderSetsCreatedAt() {
        ProjectMedia media = ProjectMedia.builder()
            .url("http://localhost/project.png")
            .mediaType(MediaType.IMAGE)
            .build();

        assertNotNull(media.getCreatedAt());
    }

    @Test
    void postMediaBuilderSetsCreatedAt() {
        PostMedia media = PostMedia.builder()
            .url("http://localhost/post.png")
            .mediaType(MediaType.IMAGE)
            .build();

        assertNotNull(media.getCreatedAt());
    }

    @Test
    void blogMediaBuilderSetsCreatedAt() {
        BlogMedia media = BlogMedia.builder()
            .url("http://localhost/blog.png")
            .mediaType(MediaType.IMAGE)
            .build();

        assertNotNull(media.getCreatedAt());
    }
}
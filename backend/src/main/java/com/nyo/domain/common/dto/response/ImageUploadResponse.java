package com.nyo.domain.common.dto.response;

import lombok.Builder;

@Builder
public record ImageUploadResponse(
        String imageUrl
) {
}
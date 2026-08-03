package com.nyo.domain.common.dto.response;

import lombok.Builder;

// GCS 업로드 직후 반환용 DTO (DB 저장 전이라 id/생성시각 없이 업로드 결과만 담는다)
@Builder
public record ImageUploadResponse(
        String imageUrl,
        String originalName,
        Long fileSize
) {
}

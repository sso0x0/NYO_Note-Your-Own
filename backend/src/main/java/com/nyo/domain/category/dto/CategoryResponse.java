package com.nyo.domain.category.dto;

import com.nyo.domain.category.entity.Category;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "카테고리 응답 DTO")
public class CategoryResponse {

    @Schema(description = "카테고리 PK", example = "1")
    private Long id;

    @Schema(description = "카테고리명", example = "프론트엔드")
    private String name;

    /** Entity -> DTO 변환용 정적 팩토리 메서드 */
    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}

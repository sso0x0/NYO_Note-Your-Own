package com.nyo.domain.category.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "카테고리 등록/수정 요청 DTO")
public class CategoryRequest {

    @NotBlank(message = "카테고리명은 필수입니다.")
    @Size(max = 100)
    @Schema(description = "카테고리명", example = "프론트엔드")
    private String name;
}

package com.nyo.domain.common.dto.request;

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
@Schema(description = "해시태그 등록 요청 DTO")
public class TagRequest {

    @NotBlank(message = "태그명은 필수입니다.")
    @Size(max = 50)
    @Schema(description = "태그명", example = "Spring")
    private String name;
}

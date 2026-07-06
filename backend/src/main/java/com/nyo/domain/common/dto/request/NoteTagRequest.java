package com.nyo.domain.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "노트-태그 매핑 등록 요청 DTO (사용자가 직접 태그를 지정할 때 사용)")
public class NoteTagRequest {

    @NotNull(message = "노트 ID는 필수입니다.")
    @Schema(description = "노트 FK", example = "1")
    private Long noteId;

    @NotEmpty(message = "태그는 1개 이상 지정해야 합니다.")
    @Schema(description = "매핑할 태그 FK 목록", example = "[1, 2, 3]")
    private List<Long> tagIds;
}

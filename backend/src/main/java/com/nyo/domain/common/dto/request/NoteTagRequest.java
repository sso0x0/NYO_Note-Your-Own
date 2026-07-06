package com.nyo.domain.common.dto.request;

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
public class NoteTagRequest {

    @NotNull(message = "노트 ID는 필수입니다.")
    private Long noteId;

    @NotEmpty(message = "태그는 1개 이상 지정해야 합니다.")
    private List<Long> tagIds;
}

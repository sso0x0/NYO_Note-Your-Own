package com.nyo.domain.common.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteRequest {

    @NotNull(message = "강의 ID는 필수입니다.")
    private Long lectureId;

    @NotBlank(message = "노트 제목은 필수입니다.")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "노트 본문은 필수입니다.")
    private String content;

    @Size(max = 1000)
    private String thumbnailUrl;
}

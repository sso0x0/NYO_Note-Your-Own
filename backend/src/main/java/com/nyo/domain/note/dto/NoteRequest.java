package com.nyo.domain.note.dto;

import com.nyo.domain.common.dto.request.ImageRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "노트 등록/수정 요청 DTO")
public class NoteRequest {

    @NotNull(message = "강의 ID는 필수입니다.")
    @Schema(description = "연결된 강의 ID", example = "1")
    private Long lectureId;

    @NotBlank(message = "노트 제목은 필수입니다.")
    @Size(max = 200)
    @Schema(description = "노트 제목", example = "1주차 스프링 정리")
    private String title;

    @NotBlank(message = "노트 본문은 필수입니다.")
    @Schema(description = "노트 본문")
    private String content;

    @Size(max = 1000)
    @Schema(description = "노트 이미지 URL")
    private String thumbnailUrl;

    @Size(max = 255)
    @Schema(description = "업로드한 이미지 원본 파일명")
    private String imageOriginalName;

    @Schema(description = "업로드한 이미지 파일 크기(byte)")
    private Long imageFileSize;

    @Schema(description = "본문 중간에 삽입된 이미지 목록")
    private List<ImageRequest> contentImages;
}

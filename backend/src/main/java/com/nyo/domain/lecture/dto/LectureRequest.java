package com.nyo.domain.lecture.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
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
@Schema(description = "강의(녹화본) 등록/수정 요청 DTO (관리자 전용, createdBy는 인증 정보에서 추출)")
public class LectureRequest {

    @NotNull(message = "카테고리 ID는 필수입니다.")
    @Schema(description = "소속 카테고리 FK", example = "1")
    private Long categoryId;

    @NotBlank(message = "강의명은 필수입니다.")
    @Size(max = 200)
    @Schema(description = "강의명", example = "스프링 부트 마스터 클래스")
    private String title;

    @Schema(description = "강의 설명")
    private String description;

    @Size(max = 1000)
    @Schema(description = "강의 링크", example = "https://example.com/lectures/1")
    private String lectureUrl;

    @Size(max = 100)
    @Schema(description = "강사명", example = "김강사")
    private String instructor;

    @Min(value = 1, message = "정원은 1명 이상이어야 합니다.")
    @Schema(description = "수강 정원 (미입력 시 무제한)", example = "30")
    private Integer capacity;
}

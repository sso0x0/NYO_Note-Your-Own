package com.nyo.domain.chat.dto;

import com.nyo.domain.lecture.dto.LectureResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "챗봇 대화 내역 응답 DTO")
public class ChatHistoryResponse {

    @Schema(description = "챗봇 대화 PK", example = "1")
    private Long id;

    @Schema(description = "질문한/답변받는 회원 FK", example = "10")
    private Long userId;

    @Schema(description = "질문의 맥락이 된 관련 강의 FK", example = "1")
    private Long lectureId;

    @Schema(description = "발신자 구분", example = "ASSISTANT")
    private String senderRole;

    @Schema(description = "질문 및 답변 내용")
    private String message;

    @Schema(description = "대화 발생 시각")
    private LocalDateTime createdAt;

    private Long postId;

    private String content;

    @Schema(description = "이 답변에서 추천한 강의 목록 (추천 요청이 아니면 빈 배열). 실시간 응답에만 채워지고, 지난 대화 기록 조회 시에는 항상 빈 배열이다.")
    @Builder.Default
    private List<LectureResponse> recommendedLectures = List.of();

}

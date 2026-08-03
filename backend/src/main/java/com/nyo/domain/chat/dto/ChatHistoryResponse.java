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
// 챗봇 대화 내역 응답 DTO.
@Schema(description = "챗봇 대화 내역 응답 DTO")
public class ChatHistoryResponse {

    @Schema(description = "챗봇 대화 PK", example = "1")
    private Long id;

    @Schema(description = "질문한/답변받는 회원 FK", example = "10")
    private Long userId;

    @Schema(description = "질문의 맥락이 된 관련 강의 FK", example = "1")
    private Long lectureId;

    @Schema(description = "위 lectureId에 해당하는 강의명 (삭제된 강의거나 lectureId가 없으면 null)")
    private String lectureTitle;

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

    @Schema(description = "이 항목이 속한 대화의 루트 질문 FK. null이면 이 항목 자체가 새 대화의 시작(루트)이다. " +
            "대화 목록 화면은 이 값이 null인 항목만 최상위로 보여주고, 값이 있는 항목은 그 루트 대화를 열었을 때만 같이 보여준다.")
    private Long rootQuestionId;

    @Schema(description = "이 답변에 대응하는 질문(USER) 행의 PK. 실시간 응답(chat/chatStream)에만 채워진다 — " +
            "이어서 질문할 때 이 값을 다음 요청의 rootQuestionId로 그대로 실어 보내면 같은 대화로 묶인다.")
    private Long questionId;

}

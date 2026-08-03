package com.nyo.domain.chat.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// 챗봇 질의 요청 DTO.
@Schema(description = "챗봇 질의 요청 DTO (userId는 인증 정보에서 추출, senderRole은 서버에서 'USER'로 고정)")
public class ChatHistoryRequest {

    @Schema(description = "질문의 맥락이 된 관련 강의 FK (선택)", example = "1")
    private Long lectureId;

    @Schema(description = "지금 보고 있는 노트 FK (선택). 있으면 검색 결과와 무관하게 이 노트를 항상 컨텍스트에 포함한다.", example = "1")
    private Long noteId;

    @Schema(description = "사용자가 직접 고른 노트 FK 목록 (선택). 있으면 검색/최근 노트로 채우지 않고 이 노트들만 컨텍스트로 쓴다 (본인 소유 노트만 인정).")
    private List<Long> noteIds;

    @Schema(description = "이 질문이 이어서 하는 대화의 루트 질문 FK (선택). 없으면 이 질문 자체가 새 대화의 시작이 된다 " +
            "(응답의 rootQuestionId로 이 질문 자신의 id가 내려간다 — 이후 같은 대화를 이어가려면 그 값을 계속 실어 보내면 된다).", example = "10")
    private Long rootQuestionId;

    @NotBlank(message = "메시지 내용은 필수입니다.")
    @Schema(description = "질문 내용 (텍스트/마크다운)", example = "리액트의 useEffect는 언제 사용하나요?")
    private String message;
}

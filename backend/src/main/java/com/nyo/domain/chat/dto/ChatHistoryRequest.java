package com.nyo.domain.chat.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "챗봇 질의 요청 DTO (userId는 인증 정보에서 추출, senderRole은 서버에서 'USER'로 고정)")
public class ChatHistoryRequest {

    @Schema(description = "질문의 맥락이 된 관련 강의 FK (선택)", example = "1")
    private Long lectureId;

    @NotBlank(message = "메시지 내용은 필수입니다.")
    @Schema(description = "질문 내용 (텍스트/마크다운)", example = "리액트의 useEffect는 언제 사용하나요?")
    private String message;
}

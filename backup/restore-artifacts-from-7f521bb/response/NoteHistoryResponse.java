package com.nyo.domain.common.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "노트 수정 이력 응답 DTO (노트 수정 시 서버에서 자동 생성)")
public class NoteHistoryResponse {

    @Schema(description = "수정 이력 PK", example = "1")
    private Long id;

    @Schema(description = "대상 노트 FK", example = "1")
    private Long noteId;

    @Schema(description = "수정한 사용자 FK", example = "10")
    private Long editorId;

    @Schema(description = "수정한 사용자 닉네임", example = "길동이")
    private String editorNickname;

    @Schema(description = "수정 전 제목 스냅샷")
    private String prevTitle;

    @Schema(description = "수정 전 본문 스냅샷")
    private String prevContent;

    @Schema(description = "수정이 발생한 시각")
    private LocalDateTime editedAt;
}

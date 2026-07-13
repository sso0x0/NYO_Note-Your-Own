package com.nyo.domain.common.dto.response;

import com.nyo.domain.note.dto.NoteTagResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "AI 자동 태깅 결과 응답 DTO")
public class AiTagResponse {

    @Schema(description = "대상 노트 FK", example = "1")
    private Long noteId;

    @Schema(description = "AI가 분류한 추천 카테고리 (참고용, DB에 저장되지 않음)", example = "백엔드")
    private String suggestedCategory;

    @Schema(description = "이번 요청으로 새로 매핑된 태그 목록 (이미 매핑돼 있던 태그는 제외)")
    private List<NoteTagResponse> tags;
}

package com.nyo.domain.ai.controller;

import com.nyo.domain.ai.service.AiTaggingService;
import com.nyo.domain.common.dto.response.AiTagResponse;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI Tagging", description = "AI 자동 태깅 API")
@RestController
@RequiredArgsConstructor
public class AiTaggingController {

    private final AiTaggingService aiTaggingService;

    @Operation(summary = "노트 내용 기반 AI 자동 태깅 및 카테고리 분류",
            description = "노트 본문을 OpenAI로 분석해 태그 3~5개를 생성하고 note_tags에 저장합니다.")
    @PostMapping("/api/notes/{noteId}/ai-tags")
    public ApiResponse<AiTagResponse> generateTags(@PathVariable Long noteId) {
        return ApiResponse.ok(aiTaggingService.generateTags(noteId));
    }
}

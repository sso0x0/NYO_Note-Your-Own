package com.nyo.domain.ai.controller;

import com.nyo.domain.ai.service.AiTaggingService;
import com.nyo.domain.common.dto.response.AiTagResponse;
import com.nyo.domain.note.dto.NoteTagResponse;
import com.nyo.domain.tag.service.TagService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 노트 내용을 AI로 분석해 태그를 자동 생성/조회하는 API 컨트롤러.
@Tag(name = "AI Tagging", description = "AI 자동 태깅 API")
@RestController
@RequiredArgsConstructor
public class AiTaggingController {

    private final AiTaggingService aiTaggingService;
    private final TagService tagService;

    // 노트 본문을 AI로 분석해 태그를 생성하고 저장한 뒤 결과를 반환한다.
    @Operation(summary = "노트 내용 기반 AI 자동 태깅 및 카테고리 분류",
            description = "노트 본문을 OpenAI로 분석해 태그 3~5개를 생성하고 note_tags에 저장합니다.")
    @PostMapping("/api/notes/{noteId}/ai-tags")
    public ApiResponse<AiTagResponse> generateTags(@PathVariable Long noteId) {
        return ApiResponse.ok(aiTaggingService.generateTags(noteId));
    }

    // 노트에 매핑된 태그 목록을 조회한다.
    @Operation(summary = "노트에 매핑된 태그 목록 조회", description = "AI가 생성했거나 이후 수동으로 추가된 태그를 등록순으로 반환합니다.")
    @GetMapping("/api/notes/{noteId}/ai-tags")
    public ApiResponse<List<NoteTagResponse>> getNoteTags(@PathVariable Long noteId) {
        return ApiResponse.ok(tagService.getNoteTags(noteId));
    }
}

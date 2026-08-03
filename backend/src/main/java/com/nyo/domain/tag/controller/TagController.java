package com.nyo.domain.tag.controller;

import com.nyo.domain.note.dto.NoteTagCreateRequest;
import com.nyo.domain.note.dto.NoteTagResponse;
import com.nyo.domain.tag.service.TagService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Tag", description = "해시태그 API")
@RestController
@RequiredArgsConstructor
// 노트에 대한 수동 태그 추가/삭제를 처리하는 컨트롤러
public class TagController {

    private final TagService tagService;

    // 이 도메인이 어떤 기능을 담당하는지 자기소개 텍스트를 반환
    @Operation(summary = "이 도메인이 어떤 기능을 담당하는지 자기소개")
    @GetMapping("/api/tags/intro")
    public ApiResponse<String> introduce() {
        return ApiResponse.ok(tagService.introduce());
    }

    // 노트에 태그 수동 추가
    @Operation(summary = "노트에 태그 수동 추가",
            description = "작성자 본인이 태그명을 직접 입력해 노트에 추가합니다. 이미 있는 태그명이면 기존 태그에 매핑하고, 없으면 새로 만듭니다.")
    @PostMapping("/api/notes/{noteId}/tags")
    public ApiResponse<NoteTagResponse> addTag(
            @PathVariable Long noteId,
            @Valid @RequestBody NoteTagCreateRequest request
    ) {
        return ApiResponse.ok(tagService.addTag(noteId, SecurityUtil.getCurrentUserId(), request.getName()));
    }

    // 노트 태그 삭제
    @Operation(summary = "노트 태그 삭제", description = "작성자 본인만 노트에 매핑된 태그(AI 생성분 포함)를 삭제할 수 있습니다.")
    @DeleteMapping("/api/notes/{noteId}/tags/{tagId}")
    public ApiResponse<Void> removeTag(@PathVariable Long noteId, @PathVariable Long tagId) {
        tagService.removeTag(noteId, SecurityUtil.getCurrentUserId(), tagId);
        return ApiResponse.ok();
    }
}

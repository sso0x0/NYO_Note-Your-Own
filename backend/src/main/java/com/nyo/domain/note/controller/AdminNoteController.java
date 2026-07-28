package com.nyo.domain.note.controller;

import com.nyo.domain.note.dto.NoteAdminResponse;
import com.nyo.domain.note.service.NoteService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 노트 관리 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호된다.
 */
@Tag(name = "Admin - Note", description = "관리자 노트 관리 API")
@RestController
@RequestMapping("/api/admin/notes")
@RequiredArgsConstructor
public class AdminNoteController {

    private final NoteService noteService;

    // 관리자 노트 관리 목록 (작성자 이메일/권한 등 상세 정보 포함)
    @Operation(summary = "노트 목록 조회 (작성자 상세 정보 포함)")
    @GetMapping
    public ApiResponse<Page<NoteAdminResponse>> getNoteList(@PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(noteService.adminGetNoteList(pageable));
    }

    // 검색 색인 재구축
    @Operation(summary = "노트 검색 색인 재구축", description = "DB의 전체 노트(+태그)로 Elasticsearch 색인을 다시 만듭니다. 색인 유실 복구, 기존 데이터 최초 반영 등에 사용합니다.")
    @PostMapping("/reindex")
    public ApiResponse<Void> reindexNotes() {
        noteService.reindexAllNotes();
        return ApiResponse.ok();
    }
}

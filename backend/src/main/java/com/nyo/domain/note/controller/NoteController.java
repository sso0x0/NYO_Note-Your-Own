package com.nyo.domain.note.controller;


import com.nyo.domain.note.dto.NoteRequest;
import com.nyo.domain.note.dto.NoteResponse;
import com.nyo.domain.note.service.NoteService;
import com.nyo.global.response.PageResponse;
import com.nyo.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    // 전체 노트 목록 조회
    @GetMapping
    public PageResponse<NoteResponse> findAll(
            // 노트 목록은 한 페이지에 12개씩 서버에서 조회하며 요청한 정렬 조건을 DB에 적용합니다.
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return noteService.findAll(pageable);
    }

    // 노트 작성
    @PostMapping
    public NoteResponse create(
            @Valid @RequestBody NoteRequest request
    ) {
        // 작성자는 요청 파라미터가 아니라 JWT로 인증된 사용자로 고정합니다.
        return noteService.create(SecurityUtil.getCurrentUserId(), request);
    }

    // 노트 검색 (제목/본문/태그 대상, Elasticsearch 기반)
    @GetMapping("/search")
    public PageResponse<NoteResponse> searchNotes(
            @RequestParam String keyword,
            @PageableDefault(size = 12) Pageable pageable
    ) {
        return noteService.searchNotes(keyword, pageable);
    }

    // 강의별 노트 목록 조회
    @GetMapping("/lectures/{lectureId}")
    public List<NoteResponse> findByLecture(@PathVariable Long lectureId) {
        return noteService.findByLecture(lectureId);
    }

    // 노트 상세 조회
    @GetMapping("/{noteId}")
    public NoteResponse findOne(@PathVariable Long noteId) {
        return noteService.findOne(noteId);
    }

    // 노트 상세 진입 시 호출하면 common.view_logs로 중복 조회를 막고 조회수를 증가시킨다.
    @PostMapping("/{noteId}/view")
    public void increaseViewCount(
            @PathVariable Long noteId
    ) {
        // 조회자는 요청 파라미터가 아니라 JWT로 인증된 사용자로 고정합니다.
        noteService.increaseViewCount(noteId, SecurityUtil.getCurrentUserId());
    }

    // 노트 좋아요 등록: common.likes에 NOTE 타입으로 저장한다.
    @GetMapping("/{noteId}/like")
    public boolean isLiked(@PathVariable Long noteId) {
        // 현재 로그인 사용자의 좋아요 여부를 반환해 상세 화면의 하트 아이콘 상태를 결정합니다.
        return noteService.isLiked(noteId, SecurityUtil.getCurrentUserId());
    }

    @PostMapping("/{noteId}/like")
    public void like(
            @PathVariable Long noteId
    ) {
        noteService.likeNote(noteId, SecurityUtil.getCurrentUserId());
    }

    // 노트 좋아요 취소: common.likes의 NOTE 기록을 삭제한다.
    @DeleteMapping("/{noteId}/like")
    public void unlike(
            @PathVariable Long noteId
    ) {
        noteService.unlikeNote(noteId, SecurityUtil.getCurrentUserId());
    }

    // 노트 수정
    @PutMapping("/{noteId}")
    public NoteResponse update(
            @PathVariable Long noteId,
            @Valid @RequestBody NoteRequest request
    ) {
        // 수정자는 요청 파라미터가 아닌 JWT 사용자로 고정하며 서비스에서 작성자 본인인지 검증합니다.
        return noteService.update(noteId, SecurityUtil.getCurrentUserId(), request);
    }

    // 노트 삭제
    @DeleteMapping("/{noteId}")
    public void delete(
            @PathVariable Long noteId
    ) {
        // 삭제 권한은 요청 파라미터가 아니라 JWT로 인증된 작성자 또는 ADMIN인지 서비스에서 검증합니다.
        noteService.delete(noteId, SecurityUtil.getCurrentUserId());

    }
}

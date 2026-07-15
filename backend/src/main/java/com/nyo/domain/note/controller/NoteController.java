package com.nyo.domain.note.controller;


import com.nyo.domain.note.dto.NoteRequest;
import com.nyo.domain.note.dto.NoteResponse;
import com.nyo.domain.note.service.NoteService;
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

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    // 전체 노트 목록 조회
    @GetMapping
    public List<NoteResponse> findAll() {
        return noteService.findAll();
    }

    // 노트 작성
    @PostMapping
    public NoteResponse create(
            @RequestParam Long userId,
            @Valid @RequestBody NoteRequest request
    ) {
        return noteService.create(userId, request);
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

    // 노트 수정
    @PutMapping("/{noteId}")
    public NoteResponse update(
            @PathVariable Long noteId,
            @RequestParam Long userId,
            @Valid @RequestBody NoteRequest request
    ) {
        return noteService.update(noteId, userId, request);
    }

    // 노트 삭제
    @DeleteMapping("/{noteId}")
    public void delete(
            @PathVariable Long noteId,
            @RequestParam Long userId
    ) {
        noteService.delete(noteId, userId);

    }
}

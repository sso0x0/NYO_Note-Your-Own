package com.nyo.domain.note.service;

import com.nyo.domain.note.dto.NoteRequest;
import com.nyo.domain.note.dto.NoteResponse;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.entity.NoteHistory;
import com.nyo.domain.note.repository.NoteHistoryRepository;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteHistoryRepository noteHistoryRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public NoteResponse create(Long userId, NoteRequest request) {
        Note note = Note.create(
                userId,
                request.getLectureId(),
                request.getTitle(),
                request.getContent(),
                request.getThumbnailUrl()
        );

        return toResponse(noteRepository.save(note));
    }

    public List<NoteResponse> findAll() {
        return noteRepository.findByIsDeletedOrderByCreatedAtDesc(0)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NoteResponse> findByLecture(Long lectureId) {
        return noteRepository.findByLectureIdAndIsDeletedOrderByCreatedAtDesc(lectureId, 0)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public NoteResponse findOne(Long noteId) {
        return toResponse(getNote(noteId));
    }

    @Transactional
    public NoteResponse update(Long noteId, Long userId, NoteRequest request) {
        Note note = getNote(noteId);

        if (!note.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        noteHistoryRepository.save(NoteHistory.from(note, userId));
        note.update(request.getTitle(), request.getContent(), request.getThumbnailUrl());

        return toResponse(note);
    }

    @Transactional
    public void delete(Long noteId, Long userId) {
        Note note = getNote(noteId);

        if (!note.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        noteRepository.delete(note);
    }

    private Note getNote(Long noteId) {
        return noteRepository.findByIdAndIsDeleted(noteId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
    }

    private boolean isAdmin(Long userId) {
        try {
            String role = jdbcTemplate.queryForObject(
                    "SELECT role FROM users WHERE id = ?",
                    String.class,
                    userId
            );
            return "ADMIN".equals(role);
        } catch (EmptyResultDataAccessException e) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
    }

    private NoteResponse toResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .lectureId(note.getLectureId())
                .userId(note.getUserId())
                .title(note.getTitle())
                .content(note.getContent())
                .thumbnailUrl(note.getThumbnailUrl())
                .viewCount(note.getViewCount())
                .likeCount(note.getLikeCount())
                .isDeleted(note.isDeleted())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}

package com.nyo.domain.note.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.request.ViewRequest;
import com.nyo.domain.common.entity.Image;
import com.nyo.domain.common.repository.ImageRepository;
import com.nyo.domain.common.service.LikeService;
import com.nyo.domain.common.service.ViewService;
import com.nyo.domain.note.dto.NoteRequest;
import com.nyo.domain.note.dto.NoteResponse;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.entity.NoteHistory;
import com.nyo.domain.note.repository.NoteHistoryRepository;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteHistoryRepository noteHistoryRepository;
    private final ImageRepository imageRepository;
    private final LikeService likeService;
    private final ViewService viewService;
    private final FileStorageService fileStorageService;
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

        Note savedNote = noteRepository.save(note);
        saveNoteImage(savedNote.getId(), request.getThumbnailUrl(), request.getImageOriginalName(), request.getImageFileSize());

        return toResponse(savedNote);
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
    public void increaseViewCount(Long noteId, Long userId) {
        getNote(noteId);
        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());

        if (isNewView) {
            noteRepository.increaseViewCountOnly(noteId);
        }
    }

    @Transactional
    public void likeNote(Long noteId, Long userId) {
        getNote(noteId);
        likeService.like(userId, LikeRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());
        noteRepository.increaseLikeCountOnly(noteId);
    }

    @Transactional
    public void unlikeNote(Long noteId, Long userId) {
        getNote(noteId);
        likeService.unlike(userId, LikeRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());
        noteRepository.decreaseLikeCountOnly(noteId);
    }

    @Transactional
    public NoteResponse update(Long noteId, Long userId, NoteRequest request) {
        Note note = getNote(noteId);

        if (!note.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        noteHistoryRepository.save(NoteHistory.from(note, userId));
        String previousThumbnailUrl = note.getThumbnailUrl();
        note.update(request.getTitle(), request.getContent(), request.getThumbnailUrl());
        saveChangedNoteImage(noteId, previousThumbnailUrl, request);

        return toResponse(note);
    }

    @Transactional
    public void delete(Long noteId, Long userId) {
        Note note = getNote(noteId);

        if (!note.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        deleteNoteImages(noteId, note.getThumbnailUrl());
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

    private void saveNoteImage(Long noteId, String imageUrl, String originalName, Long fileSize) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        imageRepository.save(Image.createForNote(noteId, imageUrl, originalName, fileSize));
    }

    private void saveChangedNoteImage(Long noteId, String previousImageUrl, NoteRequest request) {
        String newImageUrl = request.getThumbnailUrl();
        if (newImageUrl == null || newImageUrl.isBlank() || newImageUrl.equals(previousImageUrl)) {
            return;
        }

        deleteNoteImageUrl(noteId, previousImageUrl);
        imageRepository.save(Image.createForNote(noteId, newImageUrl, request.getImageOriginalName(), request.getImageFileSize()));
    }

    private void deleteNoteImageUrl(Long noteId, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        fileStorageService.delete(imageUrl);
        imageRepository.deleteAll(imageRepository.findByNoteIdAndImageUrl(noteId, imageUrl));
    }

    private void deleteNoteImages(Long noteId, String thumbnailUrl) {
        List<Image> images = imageRepository.findByNoteId(noteId);
        Set<String> imageUrls = new LinkedHashSet<>();

        if (thumbnailUrl != null && !thumbnailUrl.isBlank()) {
            imageUrls.add(thumbnailUrl);
        }

        for (Image image : images) {
            imageUrls.add(image.getImageUrl());
        }

        for (String imageUrl : imageUrls) {
            fileStorageService.delete(imageUrl);
        }

        imageRepository.deleteAll(images);
    }
}
package com.nyo.domain.note.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.request.ImageRequest;
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
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.storage.FileStorageService;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
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
    private final UserService userService;

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
        saveNoteContentImages(savedNote.getId(), request.getContentImages());

        return toResponse(savedNote);
    }

    public PageResponse<NoteResponse> findAll(Pageable pageable) {
        // 전체 목록을 메모리에 올리지 않고 요청받은 페이지의 노트만 DB에서 조회합니다.
        Page<Note> notePage = noteRepository.findByIsDeleted(0, pageable);
        List<Note> notes = notePage.getContent();
        // 카드형 게시판 nickname 표시: 목록 작성자를 한 번에 조회해 N+1 쿼리를 방지한다.
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                notes.stream().map(Note::getUserId).distinct().toList()
        );

        Page<NoteResponse> responsePage = notePage.map(
                note -> toResponse(note, nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자"))
        );
        return PageResponse.of(responsePage);
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

    public boolean isLiked(Long noteId, Long userId) {
        getNote(noteId);
        return likeService.isLiked(userId, "NOTE", noteId);
    }

    @Transactional
    public void increaseViewCount(Long noteId, Long userId) {
        getNote(noteId);

        // common의 view_logs에 오늘 조회 기록이 없을 때만 notes.view_count를 증가시킨다.
        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());

        if (isNewView) {
            // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
            noteRepository.increaseViewCountOnly(noteId);
        }
    }

    @Transactional
    public void likeNote(Long noteId, Long userId) {
        getNote(noteId);

        // common의 likes 테이블에 NOTE 좋아요 기록을 저장하고 캐시 카운트를 올린다.
        likeService.like(userId, LikeRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());
        // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
        noteRepository.increaseLikeCountOnly(noteId);
    }

    @Transactional
    public void unlikeNote(Long noteId, Long userId) {
        getNote(noteId);

        // common의 likes 테이블에서 NOTE 좋아요 기록을 삭제하고 캐시 카운트를 내린다.
        likeService.unlike(userId, LikeRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());
        // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
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
        saveNoteContentImages(noteId, request.getContentImages());

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
        return toResponse(note, userService.getDisplayNickname(note.getUserId()));
    }

    private NoteResponse toResponse(Note note, String authorNickname) {
        return NoteResponse.builder()
                .id(note.getId())
                .lectureId(note.getLectureId())
                .userId(note.getUserId())
                .authorNickname(authorNickname)
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
        // 노트 이미지가 없으면 images 테이블에는 저장하지 않는다.
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 업로드된 이미지 URL, 원본 파일명, 파일 크기를 노트 ID와 함께 images 테이블에 저장한다.
        imageRepository.save(Image.createForNote(noteId, imageUrl, originalName, fileSize));
    }

    private void saveChangedNoteImage(Long noteId, String previousImageUrl, NoteRequest request) {
        String newImageUrl = request.getThumbnailUrl();
        // 수정 화면에서 새 이미지 URL로 바뀐 경우에만 images 테이블에 추가 기록한다.
        if (newImageUrl == null || newImageUrl.isBlank() || newImageUrl.equals(previousImageUrl)) {
            return;
        }

        deleteNoteImageUrl(noteId, previousImageUrl);
        // 노트 수정에서 이미지가 바뀌면 기존 GCS 이미지를 삭제하고 새 이미지 정보를 저장한다.
        imageRepository.save(Image.createForNote(noteId, newImageUrl, request.getImageOriginalName(), request.getImageFileSize()));
    }

    private void saveNoteContentImages(Long noteId, List<ImageRequest> contentImages) {
        if (contentImages == null || contentImages.isEmpty()) {
            return;
        }

        for (int i = 0; i < contentImages.size(); i++) {
            ImageRequest image = contentImages.get(i);
            if (image.getImageUrl() == null || image.getImageUrl().isBlank()) {
                continue;
            }

            // 본문 중간에 삽입된 여러 이미지를 순서와 함께 images 테이블에 저장한다.
            imageRepository.save(Image.createForNote(
                    noteId,
                    image.getImageUrl(),
                    image.getOriginalName(),
                    image.getFileSize(),
                    image.getDisplayOrder() == null ? i + 1 : image.getDisplayOrder()
            ));
        }
    }

    private void deleteNoteImageUrl(Long noteId, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 썸네일 교체 시에는 본문 이미지는 유지하고 기존 썸네일 URL만 GCS와 DB에서 삭제한다.
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
            // images 테이블과 노트 대표 이미지 URL을 모두 확인해서 GCS 파일을 삭제한다.
            fileStorageService.delete(imageUrl);
        }

        imageRepository.deleteAll(images);
    }
}

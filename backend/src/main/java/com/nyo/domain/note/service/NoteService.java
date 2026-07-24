package com.nyo.domain.note.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.request.ImageRequest;
import com.nyo.domain.common.dto.request.ViewRequest;
import com.nyo.domain.common.entity.Image;
import com.nyo.domain.common.entity.Like;
import com.nyo.domain.common.entity.TargetType;
import com.nyo.domain.common.repository.ImageRepository;
import com.nyo.domain.common.repository.LikeRepository;
import com.nyo.domain.common.service.LikeService;
import com.nyo.domain.common.service.ViewService;
import com.nyo.domain.note.document.NoteDocument;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.note.dto.NoteRequest;
import com.nyo.domain.note.dto.NoteResponse;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.entity.NoteHistory;
import com.nyo.domain.note.repository.NoteHistoryRepository;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.note.repository.NoteSearchRepository;
import com.nyo.domain.tag.repository.NoteTagRepository;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.storage.FileStorageService;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final LectureRepository lectureRepository;
    private final NoteHistoryRepository noteHistoryRepository;
    private final NoteSearchRepository noteSearchRepository; // 노트 검색 색인 (Elasticsearch)
    private final NoteTagRepository noteTagRepository;
    private final ImageRepository imageRepository;
    private final LikeRepository likeRepository;
    private final LikeService likeService;
    private final ViewService viewService;
    private final FileStorageService fileStorageService;
    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;

    @Transactional
    public NoteResponse create(Long userId, NoteRequest request) {
        // 작성자는 컨트롤러가 JWT에서 전달하며, 강의는 임시 정책으로 DB의 첫 활성 강의를 자동 연결한다.
        Long lectureId = lectureRepository.findFirstByIsDeletedFalseOrderByIdAsc()
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND))
                .getId();

        Note note = Note.create(
                userId,
                lectureId,
                request.getTitle(),
                request.getContent(),
                request.getThumbnailUrl()
        );

        Note savedNote = noteRepository.save(note);
        saveNoteImage(savedNote.getId(), request.getThumbnailUrl(), request.getImageOriginalName(), request.getImageFileSize());
        saveNoteContentImages(savedNote.getId(), request.getContentImages());
        // 신규 노트는 아직 AI 태그가 없으므로 빈 태그 목록으로 색인한다.
        indexNote(NoteDocument.from(savedNote, List.of()));

        return toResponse(savedNote);
    }

    // 키워드로 노트 검색 (Elasticsearch에서 관련도순 id를 찾은 뒤, DB에서 실제 데이터를 조회해 순서를 맞춘다)
    public PageResponse<NoteResponse> searchNotes(String keyword, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return PageResponse.of(Page.empty(pageable));
        }

        // 검색 결과는 ES 관련도 점수순으로 정렬되므로 요청에 담긴 정렬 조건(sort)은 무시한다.
        Pageable searchPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        Page<NoteDocument> searchResult = noteSearchRepository.searchByKeyword(keyword, searchPageable);
        List<Long> ids = searchResult.getContent().stream().map(NoteDocument::getId).toList();

        if (ids.isEmpty()) {
            return PageResponse.of(Page.empty(searchPageable));
        }

        Map<Long, Note> notesById = noteRepository.findAllByIdInAndIsDeleted(ids, 0).stream()
                .collect(Collectors.toMap(Note::getId, Function.identity()));

        Map<Long, String> nicknames = userService.getDisplayNicknames(
                notesById.values().stream().map(Note::getUserId).distinct().toList()
        );

        // ES가 매긴 관련도 순서를 유지하기 위해 id 순서대로 재조립 (DB와 색인이 일시적으로 어긋난 id는 건너뜀)
        List<NoteResponse> content = ids.stream()
                .map(notesById::get)
                .filter(Objects::nonNull)
                .map(note -> toResponse(note, nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자")))
                .toList();

        // 건너뛴 id 수만큼 totalElements를 보정해 실제 반환된 content 개수와 어긋나지 않게 한다.
        long missing = ids.size() - content.size();
        long totalElements = searchResult.getTotalElements() - missing;

        return PageResponse.of(new PageImpl<>(content, searchPageable, totalElements));
    }

    // 전체 노트로 검색 색인 재구축 (색인 유실 복구, 초기 데이터 반영 등)
    @Transactional
    public void reindexAllNotes() {
        List<Note> notes = noteRepository.findByIsDeleted(0, Pageable.unpaged()).getContent();

        // 노트마다 태그를 따로 조회하면 N+1이 되므로, 전체 노트 id로 한 번에 조회해 노트별로 묶는다.
        List<Long> noteIds = notes.stream().map(Note::getId).toList();
        Map<Long, List<String>> tagNamesByNoteId = noteIds.isEmpty()
                ? Map.of()
                : noteTagRepository.findTagNamesByNoteIdIn(noteIds).stream()
                        .collect(Collectors.groupingBy(
                                NoteTagRepository.NoteIdTagName::getNoteId,
                                Collectors.mapping(NoteTagRepository.NoteIdTagName::getTagName, Collectors.toList())
                        ));

        List<NoteDocument> documents = notes.stream()
                .map(note -> NoteDocument.from(note, tagNamesByNoteId.getOrDefault(note.getId(), List.of())))
                .toList();

        noteSearchRepository.deleteAll();
        noteSearchRepository.saveAll(documents);
    }

    // 노트 하나의 색인만 태그를 포함해 다시 반영 (AI 자동 태깅 직후 호출)
    @Transactional
    public void reindexNote(Long noteId) {
        noteRepository.findByIdAndIsDeleted(noteId, 0).ifPresent(note ->
                indexNote(NoteDocument.from(note, noteTagRepository.findTagNamesByNoteId(noteId))));
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

    // 마이페이지 - 내가 작성한 노트 목록
    public PageResponse<NoteResponse> findMine(Long userId, Pageable pageable) {
        Page<Note> notePage = noteRepository.findByUserIdAndIsDeleted(userId, 0, pageable);
        String nickname = userService.getDisplayNickname(userId);
        return PageResponse.of(notePage.map(note -> toResponse(note, nickname)));
    }

    // 마이페이지 - 내가 좋아요한 노트 목록. Like 기록의 좋아요 시각 순서를 유지하기 위해
    // searchNotes()와 같은 방식으로 id 목록을 먼저 얻은 뒤 노트를 다시 조립한다.
    public PageResponse<NoteResponse> findLiked(Long userId, Pageable pageable) {
        Page<Like> likePage = likeRepository.findByUserIdAndTargetType(userId, TargetType.NOTE, pageable);
        List<Long> ids = likePage.getContent().stream().map(Like::getTargetId).toList();

        Map<Long, Note> notesById = ids.isEmpty()
                ? Map.of()
                : noteRepository.findAllByIdInAndIsDeleted(ids, 0).stream()
                        .collect(Collectors.toMap(Note::getId, Function.identity()));

        Map<Long, String> nicknames = userService.getDisplayNicknames(
                notesById.values().stream().map(Note::getUserId).distinct().toList()
        );

        // 삭제된 노트는 조용히 건너뛴다 (좋아요 기록은 남아있어도 이미 사라진 노트일 수 있음).
        List<NoteResponse> content = ids.stream()
                .map(notesById::get)
                .filter(Objects::nonNull)
                .map(note -> toResponse(note, nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자")))
                .toList();

        return PageResponse.of(new PageImpl<>(content, pageable, likePage.getTotalElements()));
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
        // 제목/본문 수정 사항을 색인에 반영하되, 기존에 붙은 태그명은 유지한다.
        indexNote(NoteDocument.from(note, noteTagRepository.findTagNamesByNoteId(noteId)));

        return toResponse(note);
    }

    @Transactional
    public void delete(Long noteId, Long userId) {
        Note note = getNote(noteId);

        if (!note.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        deleteNoteImages(noteId, note.getThumbnailUrl());
        // isDeleted 기반 소프트 삭제: note_histories 등 자식 데이터가 참조하는 row를 물리 삭제하지 않는다.
        note.delete();
        deindexNote(noteId); // 검색 결과에서도 제외
    }

    // ES 색인 저장 실패가 노트 생성/수정/AI 태깅 트랜잭션 자체를 롤백시키지 않도록 격리한다.
    // 색인이 어긋나더라도 /api/admin/notes/reindex로 복구할 수 있으므로 예외를 삼키고 로그만 남긴다.
    private void indexNote(NoteDocument document) {
        try {
            noteSearchRepository.save(document);
        } catch (Exception e) {
            log.warn("노트 검색 색인 저장 실패 (noteId={})", document.getId(), e);
        }
    }

    // ES 색인 삭제 실패가 노트 삭제 트랜잭션 자체를 롤백시키지 않도록 격리한다.
    private void deindexNote(Long noteId) {
        try {
            noteSearchRepository.deleteById(noteId);
        } catch (Exception e) {
            log.warn("노트 검색 색인 삭제 실패 (noteId={})", noteId, e);
        }
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

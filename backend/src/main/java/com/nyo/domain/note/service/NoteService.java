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
import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.note.dto.NoteAdminResponse;
import com.nyo.domain.note.dto.NoteRequest;
import com.nyo.domain.note.dto.NoteResponse;
import com.nyo.domain.note.dto.NoteTagResponse;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.entity.NoteHistory;
import com.nyo.domain.note.repository.NoteHistoryRepository;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.note.repository.NoteSearchRepository;
import com.nyo.domain.tag.repository.NoteTagRepository;
import com.nyo.domain.user.dto.UserResponse;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.moderation.ProhibitedWordFilter;
import com.nyo.global.storage.FileStorageService;
import com.nyo.global.response.PageResponse;
import com.nyo.global.moderation.ProhibitedWordFilter;
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

// 노트의 등록/조회/검색/수정/삭제와 검색 색인(Elasticsearch) 동기화를 담당하는 서비스
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {


    private final NoteRepository noteRepository;
    private final ProhibitedWordFilter prohibitedWordFilter;
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

    // 노트를 생성하고 대표 이미지/본문 이미지를 저장한 뒤 검색 색인에 반영한다.
    @Transactional
    public NoteResponse create(Long userId, NoteRequest request) {
        // 강의 시청 화면에서는 현재 URL의 강의 ID를 사용하고, 레거시 작성 화면만 첫 활성 강의로 보완한다.
        Long lectureId = request.getLectureId() == null
                ? lectureRepository.findFirstActiveLectureId()
                    .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND))
                : lectureRepository.findActiveLectureIdById(request.getLectureId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

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
        indexNote(NoteDocument.from(savedNote, List.of(), userService.getDisplayNickname(savedNote.getUserId())));

        return toResponse(savedNote);
    }

    // 키워드로 노트 검색 (Elasticsearch에서 관련도순 id를 찾은 뒤, DB에서 실제 데이터를 조회해 순서를 맞춘다)
    public PageResponse<NoteResponse> searchNotes(String keyword, String searchType, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return PageResponse.of(Page.empty(pageable));
        }

        // 태그 칩 클릭은 Elasticsearch의 제목·본문 전문 검색을 거치지 않고 DB의 태그 매핑만 정확히 조회한다.
        if ("tag".equals(searchType)) {
            Page<Note> tagPage = noteRepository.findActiveByExactTagName(keyword.trim(), pageable);
            List<Note> notes = tagPage.getContent();
            Map<Long, String> nicknames = userService.getDisplayNicknames(
                    notes.stream().map(Note::getUserId).distinct().toList()
            );
            Map<Long, List<NoteTagResponse>> tagsByNoteId = getTagsByNoteIds(
                    notes.stream().map(Note::getId).toList()
            );
            Map<Long, Lecture> lecturesById = getLecturesByIds(
                    notes.stream().map(Note::getLectureId).toList()
            );

            return PageResponse.of(tagPage.map(note -> toResponse(
                    note,
                    nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자"),
                    lecturesById.get(note.getLectureId()),
                    tagsByNoteId.getOrDefault(note.getId(), List.of())
            )));
        }

        // 검색 결과는 ES 관련도 점수순으로 정렬되므로 요청에 담긴 정렬 조건(sort)은 무시한다.
        Pageable searchPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        // 선택한 검색 종류에 따라 노트 제목, 본문, 작성자 또는 전체 필드를 검색한다.
        Page<NoteDocument> searchResult = switch (searchType) {
            case "title" -> noteSearchRepository.searchByTitle(keyword, searchPageable);
            case "content" -> noteSearchRepository.searchByContent(keyword, searchPageable);
            case "author" -> noteSearchRepository.searchByAuthor(keyword, searchPageable);
            default -> noteSearchRepository.searchByKeyword(keyword, searchPageable);
        };
        List<Long> indexedIds = searchResult.getContent().stream().map(NoteDocument::getId).toList();

        // ES 색인이 누락되어도 검색 결과에서 빠지지 않도록 DB 제목 검색 결과를 합친다.
        Page<Note> databaseResult = ("all".equals(searchType) || "title".equals(searchType))
                ? noteRepository.searchActiveByKeyword(keyword.trim(), searchPageable)
                : Page.empty(searchPageable);
        List<Long> nicknameUserIds = ("all".equals(searchType) || "author".equals(searchType))
                ? userService.findUserIdsByNickname(keyword.trim())
                : List.of();
        Page<Note> authorResult = nicknameUserIds.isEmpty()
                ? Page.empty(searchPageable)
                : noteRepository.findByUserIdInAndIsDeleted(nicknameUserIds, 0, searchPageable);

        // 작성자 닉네임 직접 일치 결과를 가장 먼저 배치해 다른 ES 결과에 밀려 잘리지 않게 한다.
        LinkedHashSet<Long> mergedIds = authorResult.getContent().stream()
                .map(Note::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        databaseResult.getContent().stream().map(Note::getId).forEach(mergedIds::add);
        mergedIds.addAll(indexedIds);
        List<Long> ids = List.copyOf(mergedIds);

        if (ids.isEmpty()) {
            return PageResponse.of(Page.empty(searchPageable));
        }

        Map<Long, Note> notesById = noteRepository.findAllByIdInAndIsDeleted(ids, 0).stream()
                .collect(Collectors.toMap(Note::getId, Function.identity()));

        // DB에는 있지만 ES에 없던 노트는 검색 과정에서 다시 색인해 이후 검색 결과도 복구한다.
        Set<Long> indexedIdSet = Set.copyOf(indexedIds);
        List<Note> databaseMatches = java.util.stream.Stream.concat(
                        authorResult.getContent().stream(),
                        databaseResult.getContent().stream()
                )
                .distinct()
                .toList();
        databaseMatches.stream()
                .filter(note -> !indexedIdSet.contains(note.getId()))
                .forEach(note -> indexNote(NoteDocument.from(
                        note,
                        noteTagRepository.findTagNamesByNoteId(note.getId()),
                        userService.getDisplayNickname(note.getUserId())
                )));

        Map<Long, String> nicknames = userService.getDisplayNicknames(
                notesById.values().stream().map(Note::getUserId).distinct().toList()
        );
        Map<Long, List<NoteTagResponse>> tagsByNoteId = getTagsByNoteIds(List.copyOf(notesById.keySet()));
        Map<Long, Lecture> lecturesById = getLecturesByIds(
                notesById.values().stream().map(Note::getLectureId).toList()
        );

        // ES가 매긴 관련도 순서를 유지하기 위해 id 순서대로 재조립 (DB와 색인이 일시적으로 어긋난 id는 건너뜀)
        List<NoteResponse> content = ids.stream()
                .map(notesById::get)
                .filter(Objects::nonNull)
                .map(note -> toResponse(
                        note,
                        nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자"),
                        lecturesById.get(note.getLectureId()),
                        tagsByNoteId.getOrDefault(note.getId(), List.of())
                ))
                .limit(searchPageable.getPageSize())
                .toList();

        // ES와 DB 중 더 많은 결과 수를 사용해 색인 누락 중에도 페이지 정보가 지나치게 작아지지 않게 한다.
        long databaseTotal = authorResult.getTotalElements() + databaseResult.getTotalElements();
        long totalElements = Math.max(searchResult.getTotalElements(), databaseTotal);

        return PageResponse.of(new PageImpl<>(content, searchPageable, totalElements));
    }

    // 전체 노트로 검색 색인 재구축 (색인 유실 복구, 초기 데이터 반영 등)
    @Transactional
    public void reindexAllNotes() {
        List<Note> notes = noteRepository.findByIsDeleted(0, Pageable.unpaged()).getContent();

        // 노트마다 태그를 따로 조회하면 N+1이 되므로, 전체 노트 id로 한 번에 조회해 노트별로 묶는다.
        List<Long> noteIds = notes.stream().map(Note::getId).toList();
        Map<Long, String> authorNicknames = userService.getDisplayNicknames(
                notes.stream().map(Note::getUserId).distinct().toList()
        );
        Map<Long, List<String>> tagNamesByNoteId = noteIds.isEmpty()
                ? Map.of()
                : noteTagRepository.findTagNamesByNoteIdIn(noteIds).stream()
                .collect(Collectors.groupingBy(
                        NoteTagRepository.NoteIdTagName::getNoteId,
                        Collectors.mapping(NoteTagRepository.NoteIdTagName::getTagName, Collectors.toList())
                ));

        List<NoteDocument> documents = notes.stream()
                .map(note -> NoteDocument.from(
                        note,
                        tagNamesByNoteId.getOrDefault(note.getId(), List.of()),
                        authorNicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자")
                ))
                .toList();

        noteSearchRepository.deleteAll();
        noteSearchRepository.saveAll(documents);
    }

    // 노트 하나의 색인만 태그를 포함해 다시 반영 (AI 자동 태깅 직후 호출)
    @Transactional
    public void reindexNote(Long noteId) {
        noteRepository.findByIdAndIsDeleted(noteId, 0).ifPresent(note ->
                indexNote(NoteDocument.from(
                        note,
                        noteTagRepository.findTagNamesByNoteId(noteId),
                        userService.getDisplayNickname(note.getUserId())
                )));
    }

    // 전체 노트 목록 조회 (categoryId가 있으면 해당 강의 카테고리로 필터링)
    public PageResponse<NoteResponse> findAll(Pageable pageable, Long categoryId) {
        // 전체 목록을 메모리에 올리지 않고 요청받은 페이지의 노트만 DB에서 조회합니다.
        // categoryId가 있으면 노트가 연결된 강의의 카테고리를 기준으로 서버에서 필터링한다.
        Page<Note> notePage = categoryId == null
                ? noteRepository.findByIsDeleted(0, pageable)
                : noteRepository.findByLectureCategoryId(categoryId, pageable);
        return toPageResponse(notePage);
    }

    // 메인 페이지 "인기 노트" 목록 조회 (좋아요*5 + 조회수 가중치 점수 내림차순)
    public PageResponse<NoteResponse> getPopular(Pageable pageable) {
        return toPageResponse(noteRepository.findPopular(pageable));
    }

    // Note 페이지를 작성자 닉네임/태그/강의 정보까지 배치 조회해 응답 DTO 페이지로 변환한다.
    private PageResponse<NoteResponse> toPageResponse(Page<Note> notePage) {
        List<Note> notes = notePage.getContent();
        // 카드형 게시판 nickname 표시: 목록 작성자를 한 번에 조회해 N+1 쿼리를 방지한다.
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                notes.stream().map(Note::getUserId).distinct().toList()
        );
        Map<Long, List<NoteTagResponse>> tagsByNoteId = getTagsByNoteIds(notes.stream().map(Note::getId).toList());
        // 노트 카드에 강의명/카테고리를 함께 보여주기 위해 강의도 한 번에 배치 조회한다.
        Map<Long, Lecture> lecturesById = getLecturesByIds(notes.stream().map(Note::getLectureId).toList());

        Page<NoteResponse> responsePage = notePage.map(note -> toResponse(
                note,
                nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자"),
                lecturesById.get(note.getLectureId()),
                tagsByNoteId.getOrDefault(note.getId(), List.of())
        ));
        return PageResponse.of(responsePage);
    }

    // 관리자 노트 관리 목록: 최신순으로 페이징하고, 작성자 상세 정보(이메일/권한 등)와
    // 연결된 강의명을 함께 내려준다.
    public Page<NoteAdminResponse> adminGetNoteList(Pageable pageable) {
        // 관리자 목록에는 삭제된 노트도 포함해 isDeleted 상태를 확인할 수 있게 한다.
        // 일반 사용자용 조회는 기존 findByIsDeleted(0, ...) 조건을 그대로 사용한다.
        Page<Note> notePage = noteRepository.findAll(pageable);
        List<Note> notes = notePage.getContent();

        Map<Long, UserResponse> usersById = userService.adminGetUsersByIds(
                notes.stream().map(Note::getUserId).distinct().toList()
        );
        // JOIN FETCH로 카테고리까지 함께 가져와야 트랜잭션 종료 전에 category.getName()을 지연 로딩 없이 읽을 수 있다.
        Map<Long, Lecture> lecturesById = lectureRepository.findAllByIdInAndIsDeletedFalse(
                notes.stream().map(Note::getLectureId).filter(Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(Lecture::getId, Function.identity()));

        return notePage.map(note -> toAdminResponse(note, usersById, lecturesById));
    }

    // 마이페이지 - 내가 작성한 노트 목록
    public PageResponse<NoteResponse> findMine(Long userId, Pageable pageable) {
        Page<Note> notePage = noteRepository.findByUserIdAndIsDeleted(userId, 0, pageable);
        String nickname = userService.getDisplayNickname(userId);
        Map<Long, List<NoteTagResponse>> tagsByNoteId = getTagsByNoteIds(
                notePage.getContent().stream().map(Note::getId).toList()
        );
        Map<Long, Lecture> lecturesById = getLecturesByIds(
                notePage.getContent().stream().map(Note::getLectureId).toList()
        );
        return PageResponse.of(notePage.map(
                note -> toResponse(note, nickname, lecturesById.get(note.getLectureId()), tagsByNoteId.getOrDefault(note.getId(), List.of()))
        ));
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
        Map<Long, List<NoteTagResponse>> tagsByNoteId = getTagsByNoteIds(List.copyOf(notesById.keySet()));
        Map<Long, Lecture> lecturesById = getLecturesByIds(
                notesById.values().stream().map(Note::getLectureId).toList()
        );

        // 삭제된 노트는 조용히 건너뛴다 (좋아요 기록은 남아있어도 이미 사라진 노트일 수 있음).
        List<NoteResponse> content = ids.stream()
                .map(notesById::get)
                .filter(Objects::nonNull)
                .map(note -> toResponse(
                        note,
                        nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자"),
                        lecturesById.get(note.getLectureId()),
                        tagsByNoteId.getOrDefault(note.getId(), List.of())
                ))
                .toList();

        return PageResponse.of(new PageImpl<>(content, pageable, likePage.getTotalElements()));
    }

    // 강의별 노트 목록 조회
    public List<NoteResponse> findByLecture(Long lectureId) {
        List<Note> notes = noteRepository.findByLectureIdAndIsDeletedOrderByCreatedAtDesc(lectureId, 0);
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                notes.stream().map(Note::getUserId).distinct().toList()
        );
        Map<Long, List<NoteTagResponse>> tagsByNoteId = getTagsByNoteIds(
                notes.stream().map(Note::getId).toList()
        );
        Map<Long, Lecture> lecturesById = getLecturesByIds(
                notes.stream().map(Note::getLectureId).toList()
        );

        // 강의 안의 다른 학습자 노트 목록에서도 AI 여부를 포함한 태그 목록을 함께 내려준다.
        return notes.stream()
                .map(note -> toResponse(
                        note,
                        nicknames.getOrDefault(note.getUserId(), "알 수 없는 사용자"),
                        lecturesById.get(note.getLectureId()),
                        tagsByNoteId.getOrDefault(note.getId(), List.of())
                ))
                .toList();
    }

    // 노트 상세 조회
    public NoteResponse findOne(Long noteId) {
        Note note = getNote(noteId);
        String lectureTitle = lectureRepository.findActiveLectureTitleById(note.getLectureId())
                .orElse("강의 정보 없음");
        // 노트 상세 응답에 연결 강의 제목을 채워 프론트의 강의 정보란에 표시한다.
        return toResponse(note, userService.getDisplayNickname(note.getUserId()), lectureTitle);
    }

    // 현재 사용자가 해당 노트에 좋아요를 눌렀는지 조회한다 (노트 존재 여부도 함께 검증).
    public boolean isLiked(Long noteId, Long userId) {
        getNote(noteId);
        return likeService.isLiked(userId, "NOTE", noteId);
    }

    // 노트 상세 조회수를 증가시킨다 (동일 사용자의 중복 조회는 카운트하지 않음).
    @Transactional
    public void increaseViewCount(Long noteId, Long userId) {
        getNote(noteId);

        // 조회할 때마다 notes.view_count를 증가시킨다.
        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("NOTE")
                .targetId(noteId)
                .build());

        if (isNewView) {
            // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
            noteRepository.increaseViewCountOnly(noteId);
        }
    }

    // 노트에 좋아요를 등록한다.
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

    // 노트 좋아요를 취소한다.
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

    // 노트를 수정한다. 수정 전 스냅샷을 이력으로 남기고, 이미지/검색 색인도 함께 갱신한다.
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
        indexNote(NoteDocument.from(
                note,
                noteTagRepository.findTagNamesByNoteId(noteId),
                userService.getDisplayNickname(note.getUserId())
        ));

        return toResponse(note);
    }

    // 노트를 삭제한다. 작성자 본인 또는 관리자만 가능하며, 이미지 삭제 및 검색 색인 제거도 함께 처리한다.
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

    // 삭제되지 않은 노트를 조회하되, 없으면 예외를 던진다.
    private Note getNote(Long noteId) {
        return noteRepository.findByIdAndIsDeleted(noteId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
    }

    // JDBC로 users 테이블의 role을 직접 조회해 관리자 여부를 확인한다.
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

    // 노트 엔티티를 관리자 목록용 응답 DTO로 변환한다 (작성자 상세 정보, 강의 정보, 금지어 포함).
    private NoteAdminResponse toAdminResponse(Note note, Map<Long, UserResponse> usersById, Map<Long, Lecture> lecturesById) {
        UserResponse author = usersById.get(note.getUserId());
        Lecture lecture = lecturesById.get(note.getLectureId());
        return NoteAdminResponse.builder()
                .id(note.getId())
                .lectureId(note.getLectureId())
                .lectureTitle(lecture != null ? lecture.getTitle() : null)
                .lectureCategoryName(lecture != null ? lecture.getCategory().getName() : null)
                .lectureInstructor(lecture != null ? lecture.getInstructor() : null)
                .lectureCapacity(lecture != null ? lecture.getCapacity() : null)
                .lectureCurrentEnrolled(lecture != null ? lecture.getCurrentEnrolled() : null)
                .userId(note.getUserId())
                .authorLoginId(author != null ? author.getLoginId() : null)
                .authorNickname(author != null ? author.getNickname() : "알 수 없는 사용자")
                .authorEmail(author != null ? author.getEmail() : null)
                .authorRole(author != null ? author.getRole() : null)
                .authorStatus(author != null ? author.getStatus() : null)
                .title(note.getTitle())
                .content(note.getContent())
                .thumbnailUrl(note.getThumbnailUrl())
                .viewCount(note.getViewCount())
                .likeCount(note.getLikeCount())
                .prohibitedWords(prohibitedWordFilter.findMatchedWords(note.getTitle(), note.getContent()))
                .isDeleted(note.isDeleted())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }

    // 작성자 닉네임을 직접 조회해 응답 DTO로 변환하는 편의 오버로드.
    private NoteResponse toResponse(Note note) {
        return toResponse(note, userService.getDisplayNickname(note.getUserId()));
    }

    // 강의 제목 없이 응답 DTO로 변환하는 편의 오버로드.
    private NoteResponse toResponse(Note note, String authorNickname) {
        return toResponse(note, authorNickname, null);
    }

    // 태그 없이 강의 제목까지 채워 응답 DTO로 변환하는 편의 오버로드.
    private NoteResponse toResponse(Note note, String authorNickname, String lectureTitle) {
        return toResponse(note, authorNickname, lectureTitle, List.of());
    }

    // 노트 엔티티를 작성자 닉네임/강의 제목/태그 목록과 함께 응답 DTO로 변환한다.
    private NoteResponse toResponse(Note note, String authorNickname, String lectureTitle, List<NoteTagResponse> tags) {
        return NoteResponse.builder()
                .id(note.getId())
                .lectureId(note.getLectureId())
                .lectureTitle(lectureTitle)
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
                .tags(tags)
                .build();
    }

    // 목록형 응답(카드)에서 강의명과 함께 카테고리명도 채워주기 위한 오버로드.
    private NoteResponse toResponse(Note note, String authorNickname, Lecture lecture, List<NoteTagResponse> tags) {
        return NoteResponse.builder()
                .id(note.getId())
                .lectureId(note.getLectureId())
                .lectureTitle(lecture != null ? lecture.getTitle() : null)
                .categoryName(lecture != null && lecture.getCategory() != null ? lecture.getCategory().getName() : null)
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
                .tags(tags)
                .build();
    }

    // 노트 카드 목록에서 노트마다 태그를 따로 조회하는 N+1을 피하기 위한 배치 조회 (AI 자동 태그 카드 표시용)
    private Map<Long, List<NoteTagResponse>> getTagsByNoteIds(List<Long> noteIds) {
        if (noteIds.isEmpty()) {
            return Map.of();
        }
        return noteTagRepository.findResponsesByNoteIdIn(noteIds).stream()
                .collect(Collectors.groupingBy(NoteTagResponse::getNoteId));
    }

    // 노트 카드 목록에서 노트마다 강의를 따로 조회하는 N+1을 피하기 위한 배치 조회 (강의명/카테고리명 표시용)
    private Map<Long, Lecture> getLecturesByIds(List<Long> lectureIds) {
        List<Long> distinctIds = lectureIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) {
            return Map.of();
        }
        return lectureRepository.findAllByIdInAndIsDeletedFalse(distinctIds).stream()
                .collect(Collectors.toMap(Lecture::getId, Function.identity()));
    }

    // 노트 대표 이미지가 있으면 images 테이블에 저장한다.
    private void saveNoteImage(Long noteId, String imageUrl, String originalName, Long fileSize) {
        // 노트 이미지가 없으면 images 테이블에는 저장하지 않는다.
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 업로드된 이미지 URL, 원본 파일명, 파일 크기를 노트 ID와 함께 images 테이블에 저장한다.
        imageRepository.save(Image.createForNote(noteId, imageUrl, originalName, fileSize));
    }

    // 대표 이미지가 실제로 바뀐 경우에만 기존 이미지를 지우고 새 이미지 정보를 저장한다.
    private void saveChangedNoteImage(Long noteId, String previousImageUrl, NoteRequest request) {
        String newImageUrl = request.getThumbnailUrl();
        // 수정 화면에서 새 이미지 URL로 바뀐 경우에만 images 테이블에 추가 기록한다.
        if (newImageUrl == null || newImageUrl.isBlank()
                || stripUrlFragment(newImageUrl).equals(stripUrlFragment(previousImageUrl))) {
            return;
        }

        deleteNoteImageUrl(noteId, previousImageUrl);
        // 노트 수정에서 이미지가 바뀌면 기존 GCS 이미지를 삭제하고 새 이미지 정보를 저장한다.
        imageRepository.save(Image.createForNote(noteId, newImageUrl, request.getImageOriginalName(), request.getImageFileSize()));
    }

    // 본문에 삽입된 이미지 목록을 순서와 함께 images 테이블에 저장한다.
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

    // 지정한 이미지 URL을 GCS와 images 테이블에서 함께 삭제한다.
    private void deleteNoteImageUrl(Long noteId, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 썸네일 교체 시에는 본문 이미지는 유지하고 기존 썸네일 URL만 GCS와 DB에서 삭제한다.
        fileStorageService.delete(imageUrl);
        imageRepository.deleteAll(imageRepository.findByNoteIdAndImageUrl(noteId, imageUrl));
    }

    // 이미지 크기만 URL fragment로 바뀐 경우 같은 GCS 파일을 새 이미지로 오인하지 않게 합니다.
    private String stripUrlFragment(String imageUrl) {
        if (imageUrl == null) {
            return "";
        }
        int fragmentIndex = imageUrl.indexOf('#');
        return fragmentIndex >= 0 ? imageUrl.substring(0, fragmentIndex) : imageUrl;
    }

    // 노트에 연결된 대표 이미지와 본문 이미지를 모두 모아 GCS 파일과 images 레코드를 삭제한다.
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

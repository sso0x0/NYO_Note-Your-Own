package com.nyo.domain.lecture.service;

import com.nyo.domain.category.entity.Category;
import com.nyo.domain.category.repository.CategoryRepository;
import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.request.ViewRequest;
import com.nyo.domain.common.entity.Like;
import com.nyo.domain.common.entity.TargetType;
import com.nyo.domain.common.repository.LikeRepository;
import com.nyo.domain.common.service.LikeService;
import com.nyo.domain.common.service.ViewService;
import com.nyo.domain.comment.repository.CommentRepository;
import com.nyo.domain.lecture.document.LectureDocument;
import com.nyo.domain.lecture.dto.LectureAdminResponse;
import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.entity.LectureStatus;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.lecture.repository.LectureSearchRepository;
import com.nyo.domain.lecture.util.YoutubeUrlUtils;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.enums.Role;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
// 강의 CRUD와 승인/반려, 좋아요·조회수·수강신청, 검색 색인 연동을 담당하는 서비스 구현체
public class LectureServiceImpl implements LectureService {

    // 인기 강의로 표시할 상위 개수 (AdminStatsController의 인기도 조회 기본값과 동일하게 맞춤)
    private static final int POPULAR_LECTURE_COUNT = 10;

    private final LectureRepository lectureRepository;
    private final LectureSearchRepository lectureSearchRepository; // 강의 검색 색인 (Elasticsearch)
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final LikeService likeService; // 좋아요 공용 서비스 (common 도메인)
    private final ViewService viewService; // 조회수 공용 서비스 (common 도메인)
    // 수강신청은 좋아요와 동일한 (user, targetType, targetId) 구조라 likes 테이블을 ENROLL 타입으로 재사용
    // (별도 테이블 대신 재활용, LikeService는 "좋아요" 전용 메시지라 우회하고 Repository 직접 사용)
    private final LikeRepository likeRepository;
    // 관리자 강의 관리 목록에서 강의별 노트/댓글 개수를 집계하기 위해 직접 의존한다.
    private final NoteRepository noteRepository;
    private final CommentRepository commentRepository;

    // 강의 존재 + 삭제 여부 검증 (존재하지 않거나 삭제된 경우 예외)
    private void validateLectureExists(Long id) {
        boolean exists = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .isPresent();

        // 존재하지 않는 강의일 경우
        if (!exists) {
            throw new BusinessException(ErrorCode.COURSE_NOT_FOUND);
        }
    }

    // 관리자 조회 (존재하지 않으면 예외). ADMIN 권한 자체는 SecurityConfig의 "/api/admin/**" → hasRole("ADMIN")에서
    // 이미 걸러지므로(AdminLectureController), 여기서는 회원 존재 여부만 확인한다.
    private User findAdmin(Long adminId) {
        return userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    // 수강신청 여부 조회 (likes 테이블 ENROLL 타입 재사용)
    private boolean hasEnrolled(Long userId, Long lectureId) {
        return likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, lectureId);
    }

    // 강의 URL(현재는 유튜브만 지원)에서 대표 썸네일을 자동으로 뽑아낸다. 유튜브 링크가 아니면 등록 자체를 막는다.
    private String resolveThumbnailUrl(String lectureUrl) {
        String thumbnailUrl = YoutubeUrlUtils.buildThumbnailUrl(lectureUrl);
        if (thumbnailUrl == null) {
            throw new BusinessException(ErrorCode.LECTURE_URL_NOT_YOUTUBE);
        }
        return thumbnailUrl;
    }

    // 복습용 URL은 선택 입력이라, 빈 문자열은 저장하지 않고 null로 정규화한다.
    private String normalizeReviewUrl(String reviewUrl) {
        return StringUtils.hasText(reviewUrl) ? reviewUrl : null;
    }

    // 강의 등록
    @Override
    @Transactional
    public LectureResponse createLecture(LectureRequest request, Long adminId) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)); // 존재하지 않는 카테고리

        User admin = findAdmin(adminId);

        Lecture lecture = Lecture.builder()
                .category(category)
                .createdBy(admin)
                .title(request.getTitle())
                .description(request.getDescription())
                .lectureUrl(request.getLectureUrl())
                .thumbnailUrl(resolveThumbnailUrl(request.getLectureUrl()))
                .reviewUrl(normalizeReviewUrl(request.getReviewUrl()))
                .instructor(request.getInstructor())
                .capacity(request.getCapacity())
                .status(LectureStatus.APPROVED) // 관리자가 직접 등록하는 강의는 심사 없이 즉시 공개
                .build();

        Lecture saved = lectureRepository.save(lecture);
        indexLecture(LectureDocument.from(saved)); // 검색 색인 반영

        return LectureResponse.from(saved);
    }

    // 강사의 강의 등록 신청. INSTRUCTOR 권한만 가능하며, 관리자 승인 전까지는 PENDING 상태로 검색/목록에 노출되지 않는다.
    @Override
    @Transactional
    public LectureResponse createInstructorLecture(LectureRequest request, Long instructorUserId) {
        User instructor = userRepository.findById(instructorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (instructor.getRole() != Role.INSTRUCTOR) {
            throw new BusinessException(ErrorCode.ACCESS_FORBIDDEN);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        Lecture lecture = Lecture.builder()
                .category(category)
                .createdBy(instructor)
                .title(request.getTitle())
                .description(request.getDescription())
                .lectureUrl(request.getLectureUrl())
                .thumbnailUrl(resolveThumbnailUrl(request.getLectureUrl()))
                .reviewUrl(normalizeReviewUrl(request.getReviewUrl()))
                .instructor(request.getInstructor())
                .capacity(request.getCapacity())
                .status(LectureStatus.PENDING) // 관리자 승인 전까지는 비공개
                .build();

        Lecture saved = lectureRepository.save(lecture);
        // 승인되기 전에는 검색 결과에 나오면 안 되므로 여기서는 색인하지 않는다 (approveLecture에서 색인).

        return LectureResponse.from(saved);
    }

    // 강사 본인의 강의 등록 신청 내역 (마이페이지 "강의 등록" 탭)
    @Override
    public Page<LectureResponse> getMyLectures(Long userId, Pageable pageable) {
        return lectureRepository.findByCreatedByIdOrderByCreatedAtDesc(userId, pageable)
                .map(LectureResponse::from);
    }

    // 마이페이지 "수강 강의" 탭: likes 테이블의 ENROLL 기록을 신청 순서대로 가져온 뒤 강의를 재조립한다.
    // (findLiked()에서 쓰는 것과 동일한 패턴 - NoteService.findLiked 참고)
    @Override
    public Page<LectureResponse> getEnrolledLectures(Long userId, Pageable pageable) {
        Page<Like> likePage = likeRepository.findByUserIdAndTargetType(userId, TargetType.ENROLL, pageable);
        List<Long> ids = likePage.getContent().stream().map(Like::getTargetId).toList();

        Map<Long, Lecture> lecturesById = ids.isEmpty()
                ? Map.of()
                : lectureRepository.findAllByIdInAndIsDeletedFalse(ids).stream()
                        .collect(Collectors.toMap(Lecture::getId, Function.identity()));

        List<LectureResponse> content = ids.stream()
                .map(lecturesById::get)
                .filter(Objects::nonNull)
                .map(LectureResponse::from)
                .toList();

        return new PageImpl<>(content, pageable, likePage.getTotalElements());
    }

    // 강의 등록 신청 승인
    @Override
    @Transactional
    public void approveLecture(Long lectureId, Long adminId) {
        findAdmin(adminId);
        Lecture lecture = getPendingLectureOrThrow(lectureId);
        lecture.approve();
        indexLecture(LectureDocument.from(lecture)); // 승인 시점부터 검색/목록에 노출
    }

    // 강의 등록 신청 반려
    @Override
    @Transactional
    public void rejectLecture(Long lectureId, Long adminId, String reason) {
        findAdmin(adminId);
        Lecture lecture = getPendingLectureOrThrow(lectureId);
        lecture.reject(reason);
    }

    // 심사 대기(PENDING) 상태의 강의를 조회. 존재하지 않거나 이미 처리(승인/반려)된 강의면 예외
    private Lecture getPendingLectureOrThrow(Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (lecture.getStatus() != LectureStatus.PENDING) {
            throw new BusinessException(ErrorCode.LECTURE_ALREADY_PROCESSED);
        }
        return lecture;
    }

    // 강의 전체 목록 조회 (승인된 강의만)
    @Override
    public Page<LectureResponse> getLectureList(Pageable pageable) {
        return lectureRepository.findByIsDeletedFalseAndStatus(LectureStatus.APPROVED, pageable)
                .map(LectureResponse::from);
    }

    // 메인 페이지 "인기 강의" 목록 조회 (승인된 강의만, 좋아요*5 + 조회수 가중치 점수 내림차순)
    @Override
    public Page<LectureResponse> getPopularLectures(Pageable pageable) {
        return lectureRepository.findPopularByStatus(LectureStatus.APPROVED, pageable)
                .map(LectureResponse::from);
    }

    // 관리자 강의 관리 목록: 강의별 노트/댓글 개수를 함께 집계해 내려준다.
    // categoryId/status가 있으면 각각 필터링하고, 없으면(null) 전체를 대상으로 한다.
    @Override
    public Page<LectureAdminResponse> adminGetLectureList(Long categoryId, LectureStatus status, Pageable pageable) {
        if (categoryId != null && !categoryRepository.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        // 삭제된 강의도 관리자 목록에는 그대로 남겨 두고(복구 전까지 내역 확인용) 화면에서 구분 표시한다.
        Page<Lecture> lectures;
        if (categoryId != null && status != null) {
            lectures = lectureRepository.findByCategoryIdAndStatusForAdmin(categoryId, status, pageable);
        } else if (categoryId != null) {
            lectures = lectureRepository.findByCategoryIdForAdmin(categoryId, pageable);
        } else if (status != null) {
            lectures = lectureRepository.findByStatusForAdmin(status, pageable);
        } else {
            lectures = lectureRepository.findAllForAdmin(pageable);
        }
        List<Long> lectureIds = lectures.getContent().stream().map(Lecture::getId).toList();

        Map<Long, Long> noteCountsById = lectureIds.isEmpty() ? Map.of() : noteRepository.countByLectureIdsGrouped(lectureIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, Long> commentCountsById = lectureIds.isEmpty() ? Map.of() : commentRepository.countByLectureIdsGrouped(lectureIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        return lectures.map(lecture -> LectureAdminResponse.from(
                lecture,
                noteCountsById.getOrDefault(lecture.getId(), 0L),
                commentCountsById.getOrDefault(lecture.getId(), 0L)
        ));
    }

    // 카테고리별 강의 목록 조회 (승인된 강의만)
    @Override
    public Page<LectureResponse> getLectureListByCategory(Long categoryId, Pageable pageable) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND); // 존재하지 않는 카테고리
        }
        return lectureRepository.findByCategoryIdAndIsDeletedFalseAndStatus(categoryId, LectureStatus.APPROVED, pageable)
                .map(LectureResponse::from);
    }

    // 하나의 강의 조회. 승인 전(PENDING/REJECTED) 강의는 등록한 강사 본인 또는 관리자만 볼 수 있고,
    // 그 외 사용자에게는 존재 자체를 드러내지 않기 위해 조회된 강의와 동일하게 404로 처리한다.
    @Override
    public LectureResponse getLecture(Long id, Long userId) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted()) // 강의 삭제 여부 확인
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND)); // 존재하지 않는 강의

        if (lecture.getStatus() != LectureStatus.APPROVED && !canViewUnapprovedLecture(lecture, userId)) {
            throw new BusinessException(ErrorCode.COURSE_NOT_FOUND);
        }

        return LectureResponse.from(lecture);
    }

    // 미승인(PENDING/REJECTED) 강의를 볼 수 있는지 판단 (등록한 강사 본인이거나 관리자인 경우만 허용)
    private boolean canViewUnapprovedLecture(Lecture lecture, Long userId) {
        if (lecture.getCreatedBy().getId().equals(userId)) {
            return true;
        }
        return userRepository.findById(userId).map(u -> u.getRole() == Role.ADMIN).orElse(false);
    }

    // 관리자용 하나의 강의 조회
    @Override
    public LectureResponse getLectureForAdmin(Long id, Long adminId) {
        findAdmin(adminId);

        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return LectureResponse.from(lecture);
    }

    // 강의 수정
    @Override
    @Transactional
    public LectureResponse updateLecture(Long id, LectureRequest request, Long adminId) {
        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        // 이미 삭제된 강의일 경우
        if (lecture.getIsDeleted()) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_DELETED);
        }

        findAdmin(adminId);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        // 정원이 현재 등록 인원보다 작아지는 걸 방지
        if (request.getCapacity() != null && request.getCapacity() < lecture.getCurrentEnrolled()) {
            throw new BusinessException(ErrorCode.CAPACITY_LESS_THAN_ENROLLED);
        }

        lecture.update(category, request.getTitle(), request.getDescription(),
                request.getLectureUrl(), resolveThumbnailUrl(request.getLectureUrl()),
                normalizeReviewUrl(request.getReviewUrl()), request.getInstructor(), request.getCapacity());
        // 아직 승인 전(PENDING/REJECTED)인 강의는 수정해도 색인하지 않는다 — 승인 전 검색 노출 방지.
        if (lecture.getStatus() == LectureStatus.APPROVED) {
            indexLecture(LectureDocument.from(lecture)); // 검색 색인 반영
        }

        return LectureResponse.from(lecture);
    }

    // 강의 삭제
    @Override
    @Transactional
    public void deleteLecture(Long id, Long adminId) {
        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        // 이미 삭제된 강의일 경우
        if (lecture.getIsDeleted()) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_DELETED);
        }

        findAdmin(adminId);

        // 삭제 여부만 true로 바뀜, 실제 삭제 X
        lecture.delete();

        // 삭제된 강의에 달려있던 좋아요/수강신청 레코드 정리 (통계/목록 정합성)
        likeRepository.deleteByTargetTypeAndTargetId(TargetType.LECTURE, id);
        likeRepository.deleteByTargetTypeAndTargetId(TargetType.ENROLL, id);

        deindexLecture(id); // 검색 결과에서도 제외
    }

    // 삭제된 강의 복구 (DB에서 완전히 삭제되기 전까지는 관리자가 되돌릴 수 있다)
    @Override
    @Transactional
    public void restoreLecture(Long id, Long adminId) {
        findAdmin(adminId);

        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        lecture.restore();

        // 승인된 강의만 일반 목록/검색에 노출되므로, 그 경우에만 색인을 되살린다.
        if (lecture.getStatus() == LectureStatus.APPROVED) {
            indexLecture(LectureDocument.from(lecture));
        }
    }

    // ES 색인 저장 실패가 강의 생성/수정 트랜잭션 자체를 롤백시키지 않도록 격리한다.
    // 색인이 어긋나더라도 /api/admin/lectures/reindex로 복구할 수 있으므로 예외를 삼키고 로그만 남긴다.
    private void indexLecture(LectureDocument document) {
        try {
            lectureSearchRepository.save(document);
        } catch (Exception e) {
            log.warn("강의 검색 색인 저장 실패 (lectureId={})", document.getId(), e);
        }
    }

    // ES 색인 삭제 실패가 강의 삭제 트랜잭션 자체를 롤백시키지 않도록 격리한다.
    private void deindexLecture(Long lectureId) {
        try {
            lectureSearchRepository.deleteById(lectureId);
        } catch (Exception e) {
            log.warn("강의 검색 색인 삭제 실패 (lectureId={})", lectureId, e);
        }
    }

    // ===== 조회수 / 좋아요 / 수강신청 =====

    // 조회수 증가 (조회할 때마다 증가)
    @Override
    @Transactional
    public void increaseViewCount(Long id, Long userId) {
        validateLectureExists(id);

        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        if (isNewView) {
            lectureRepository.increaseViewCount(id); // 캐시된 조회수 원자 증가
        }
    }

    // 좋아요
    @Override
    @Transactional
    public void likeLecture(Long id, Long userId) {
        validateLectureExists(id);

        likeService.like(userId, LikeRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        lectureRepository.increaseLikeCount(id); // 캐시된 좋아요 수 원자 증가
    }

    // 좋아요 취소
    @Override
    @Transactional
    public void unlikeLecture(Long id, Long userId) {
        validateLectureExists(id);

        likeService.unlike(userId, LikeRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        lectureRepository.decreaseLikeCount(id); // 캐시된 좋아요 수 원자 감소
    }

    // 좋아요 여부 조회
    @Override
    public boolean isLiked(Long id, Long userId) {
        return likeService.isLiked(userId, "LECTURE", id);
    }

    // 수강신청 (likes 테이블을 ENROLL 타입으로 재사용)
    @Override
    @Transactional
    public void enrollLecture(Long id, Long userId) {
        validateLectureExists(id);

        // 수강신청을 이미 했을 경우
        if (hasEnrolled(userId, id)) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_ENROLLED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 정원 체크 + 등록 인원 증가를 하나의 조건부 UPDATE로 원자 처리 (동시 요청에 의한 정원 초과 방지)
        int updated = lectureRepository.enrollIfAvailable(id);

        // 반환값 0일 경우 마감 처리
        if (updated == 0) {
            throw new BusinessException(ErrorCode.COURSE_CAPACITY_EXCEEDED);
        }

        likeRepository.save(Like.builder()
                .user(user)
                .targetType(TargetType.ENROLL)
                .targetId(id)
                .build());
    }

    // 수강신청 취소
    @Override
    @Transactional
    public void cancelEnrollment(Long id, Long userId) {
        validateLectureExists(id);

        if (!hasEnrolled(userId, id)) {
            throw new BusinessException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND);
        }

        likeRepository.deleteByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, id);

        lectureRepository.decreaseEnrolledCount(id); // 캐시된 등록 인원 원자 감소
    }

    // 수강신청 여부 조회 (상세/시청 화면에서 접근 가능 여부를 판단하는 데 사용)
    @Override
    public boolean isEnrolled(Long id, Long userId) {
        validateLectureExists(id);
        return hasEnrolled(userId, id);
    }

    // 인기 강의 갱신 (좋아요수 desc, 조회수 desc 상위 N개만 isPopular=true)
    @Override
    @Transactional
    public void refreshPopularLectures() {
        List<Lecture> topLectures = lectureRepository
                .findByIsDeletedFalseOrderByLikeCountDescViewCountDesc(PageRequest.of(0, POPULAR_LECTURE_COUNT));

        lectureRepository.clearPopularStatus();

        if (!topLectures.isEmpty()) {
            List<Long> topIds = topLectures.stream().map(Lecture::getId).toList();
            lectureRepository.markPopular(topIds);
        }
    }

    // 키워드로 강의 검색 (Elasticsearch에서 관련도순 id를 찾은 뒤, DB에서 실제 데이터를 조회해 순서를 맞춘다)
    @Override
    public Page<LectureResponse> searchLectures(String keyword, String searchType, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return Page.empty(pageable);
        }

        // 검색 결과는 ES 관련도 점수순으로 정렬되므로 요청에 담긴 정렬 조건(sort)은 무시한다.
        // (그대로 넘기면 색인에 없는 필드로 정렬을 시도해 전체 샤드 실패로 이어질 수 있음)
        Pageable searchPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        // 선택한 검색 종류에 따라 강의 제목, 설명, 강사명 또는 전체 필드를 검색한다.
        Page<LectureDocument> searchResult = switch (searchType) {
            case "title" -> lectureSearchRepository.searchByTitle(keyword, searchPageable);
            case "content" -> lectureSearchRepository.searchByContent(keyword, searchPageable);
            case "author" -> lectureSearchRepository.searchByAuthor(keyword, searchPageable);
            default -> lectureSearchRepository.searchByKeyword(keyword, searchPageable);
        };
        List<Long> ids = searchResult.getContent().stream().map(LectureDocument::getId).toList();

        if (ids.isEmpty()) {
            return Page.empty(searchPageable);
        }

        Map<Long, Lecture> lecturesById = lectureRepository.findAllByIdInAndIsDeletedFalse(ids).stream()
                .collect(Collectors.toMap(Lecture::getId, Function.identity()));

        // ES가 매긴 관련도 순서를 유지하기 위해 id 순서대로 재조립 (DB와 색인이 일시적으로 어긋난 id는 건너뜀)
        List<LectureResponse> content = ids.stream()
                .map(lecturesById::get)
                .filter(Objects::nonNull)
                .map(LectureResponse::from)
                .toList();

        return new PageImpl<>(content, searchPageable, searchResult.getTotalElements());
    }

    // 전체 강의로 검색 색인 재구축 (색인 유실 복구, 초기 데이터 반영 등)
    @Override
    @Transactional
    public void reindexAllLectures() {
        // 심사 대기/반려된 강의는 검색 결과에 노출되면 안 되므로 승인된 강의만 색인한다.
        List<Lecture> lectures = lectureRepository
                .findByIsDeletedFalseAndStatus(LectureStatus.APPROVED, Pageable.unpaged()).getContent();
        List<LectureDocument> documents = lectures.stream().map(LectureDocument::from).toList();

        lectureSearchRepository.deleteAll();
        lectureSearchRepository.saveAll(documents);
    }
}

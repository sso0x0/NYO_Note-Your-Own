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
import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LectureServiceImpl implements LectureService {

    // 인기 강의로 표시할 상위 개수 (AdminStatsController의 인기도 조회 기본값과 동일하게 맞춤)
    private static final int POPULAR_LECTURE_COUNT = 10;

    private final LectureRepository lectureRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final LikeService likeService; // 좋아요 공용 서비스 (common 도메인)
    private final ViewService viewService; // 조회수 공용 서비스 (common 도메인)
    // 수강신청은 좋아요와 동일한 (user, targetType, targetId) 구조라 likes 테이블을 ENROLL 타입으로 재사용
    // (별도 테이블 대신 재활용, LikeService는 "좋아요" 전용 메시지라 우회하고 Repository 직접 사용)
    private final LikeRepository likeRepository;

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

    // 관리자 조회 (존재하지 않으면 예외)
    private User findAdmin(Long adminId) {
        // TODO: admin.getRole()이 "ADMIN"인지 검증 로직 추가 권장
        return userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    // 수강신청 여부 조회 (likes 테이블 ENROLL 타입 재사용)
    private boolean isEnrolled(Long userId, Long lectureId) {
        return likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, lectureId);
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
                .thumbnailUrl(request.getThumbnailUrl())
                .instructor(request.getInstructor())
                .capacity(request.getCapacity())
                .build();

        Lecture saved = lectureRepository.save(lecture);
        return LectureResponse.from(saved);
    }

    // 강의 전체 목록 조회
    @Override
    public Page<LectureResponse> getLectureList(Pageable pageable) {
        return lectureRepository.findByIsDeletedFalse(pageable) // 삭제된 강의 제외
                .map(LectureResponse::from);
    }

    // 카테고리별 강의 목록 조회
    @Override
    public Page<LectureResponse> getLectureListByCategory(Long categoryId, Pageable pageable) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND); // 존재하지 않는 카테고리
        }
        return lectureRepository.findByCategoryIdAndIsDeletedFalse(categoryId, pageable)
                .map(LectureResponse::from);
    }

    // 하나의 강의 조회
    @Override
    public LectureResponse getLecture(Long id) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted()) // 강의 삭제 여부 확인
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND)); // 존재하지 않는 강의
        return LectureResponse.from(lecture);
    }

    // TODO: 이게 과연 필요한가?
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
                request.getLectureUrl(), request.getThumbnailUrl(), request.getInstructor(), request.getCapacity());
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
    }

    // ===== 조회수 / 좋아요 / 수강신청 =====

    // 조회수 증가 (하루 1회 제한)
    @Override
    @Transactional
    public void increaseViewCount(Long id, Long userId) {
        validateLectureExists(id);

        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        if (isNewView) {
            lectureRepository.increaseViewCount(id); // 오늘 처음 본 경우에만 캐시된 조회수 원자 증가
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

    // 수강신청 (likes 테이블을 ENROLL 타입으로 재사용)
    @Override
    @Transactional
    public void enrollLecture(Long id, Long userId) {
        validateLectureExists(id);

        // 수강신청을 이미 했을 경우
        if (isEnrolled(userId, id)) {
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

        if (!isEnrolled(userId, id)) {
            throw new BusinessException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND);
        }

        likeRepository.deleteByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, id);

        lectureRepository.decreaseEnrolledCount(id); // 캐시된 등록 인원 원자 감소
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
}
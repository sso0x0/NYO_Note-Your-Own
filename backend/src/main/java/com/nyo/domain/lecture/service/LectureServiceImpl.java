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

    // 강의 등록
    @Override
    @Transactional
    public LectureResponse createLecture(LectureRequest request, Long categoryId, Long adminId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // TODO: admin.getRole()이 "ADMIN"인지 검증 로직 추가 권장

        Lecture lecture = Lecture.builder()
                .category(category)
                .createdBy(admin)
                .title(request.getTitle())
                .description(request.getDescription())
                .lectureUrl(request.getLectureUrl())
                .instructor(request.getInstructor())
                .capacity(request.getCapacity())
                .build();

        Lecture saved = lectureRepository.save(lecture);
        return LectureResponse.from(saved);
    }

    // 강의 전체 목록 조회
    @Override
    public Page<LectureResponse> getLectureList(Pageable pageable) {
        return lectureRepository.findByIsDeletedFalse(pageable)
                .map(LectureResponse::from);
    }

    // 카테고리별 강의 목록 조회
    @Override
    public Page<LectureResponse> getLectureListByCategory(Long categoryId, Pageable pageable) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return lectureRepository.findByCategoryIdAndIsDeletedFalse(categoryId, pageable)
                .map(LectureResponse::from);
    }

    // 하나의 강의 조회
    @Override
    public LectureResponse getLecture(Long id) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return LectureResponse.from(lecture);
    }

    // 관리자용 하나의 강의 조회
    @Override
    public LectureResponse getLectureForAdmin(Long id, Long adminId) {
        userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        // TODO: admin.getRole()이 "ADMIN"인지 검증 로직 추가 권장

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

        if (lecture.getIsDeleted()) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_DELETED);
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        // TODO: admin.getRole()이 "ADMIN"인지 검증 로직 추가 권장

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        // 정원이 현재 등록 인원보다 작아지는 걸 방지
        if (request.getCapacity() != null && request.getCapacity() < lecture.getCurrentEnrolled()) {
            throw new BusinessException(ErrorCode.CAPACITY_LESS_THAN_ENROLLED);
        }

        lecture.update(category, request.getTitle(), request.getDescription(),
                request.getLectureUrl(), request.getInstructor(), request.getCapacity());
        return LectureResponse.from(lecture);
    }

    // 강의 삭제
    @Override
    @Transactional
    public void deleteLecture(Long id, Long adminId) {
        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (lecture.getIsDeleted()) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_DELETED);
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        // TODO: admin.getRole()이 "ADMIN"인지 검증 로직 추가 권장

        // 삭제 여부만 true로 바뀜, 실제 삭제 X
        lecture.delete();
    }

    // 조회수 증가 (하루 1회 제한)
    @Override
    @Transactional
    public void increaseViewCount(Long id, Long userId) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        if (isNewView) {
            lecture.increaseViewCount(); // 오늘 처음 본 경우에만 캐시된 조회수 증가
        }
    }

    // 좋아요
    @Override
    @Transactional
    public void likeLecture(Long id, Long userId) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        likeService.like(userId, LikeRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        lecture.increaseLikeCount(); // 캐시된 좋아요 수 증가
    }

    // 좋아요 취소
    @Override
    @Transactional
    public void unlikeLecture(Long id, Long userId) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        likeService.unlike(userId, LikeRequest.builder()
                .targetType("LECTURE")
                .targetId(id)
                .build());

        lecture.decreaseLikeCount(); // 캐시된 좋아요 수 감소
    }

    // 수강신청 (likes 테이블을 ENROLL 타입으로 재사용)
    @Override
    @Transactional
    public void enrollLecture(Long id, Long userId) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, id)) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_ENROLLED);
        }

        if (lecture.isFull()) {
            throw new BusinessException(ErrorCode.COURSE_CAPACITY_EXCEEDED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        likeRepository.save(Like.builder()
                .user(user)
                .targetType(TargetType.ENROLL)
                .targetId(id)
                .build());

        lecture.increaseEnrolledCount(); // 캐시된 등록 인원 증가
    }

    // 수강신청 취소
    @Override
    @Transactional
    public void cancelEnrollment(Long id, Long userId) {
        Lecture lecture = lectureRepository.findById(id)
                .filter(l -> !l.getIsDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, id)) {
            throw new BusinessException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND);
        }

        likeRepository.deleteByUserIdAndTargetTypeAndTargetId(userId, TargetType.ENROLL, id);

        lecture.decreaseEnrolledCount(); // 캐시된 등록 인원 감소
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
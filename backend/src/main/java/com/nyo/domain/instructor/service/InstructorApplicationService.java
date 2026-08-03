package com.nyo.domain.instructor.service;

import com.nyo.domain.category.entity.Category;
import com.nyo.domain.category.repository.CategoryRepository;
import com.nyo.domain.instructor.dto.InstructorApplicationAdminResponse;
import com.nyo.domain.instructor.dto.InstructorApplicationRequest;
import com.nyo.domain.instructor.dto.InstructorApplicationResponse;
import com.nyo.domain.instructor.entity.InstructorApplication;
import com.nyo.domain.instructor.entity.InstructorApplicationStatus;
import com.nyo.domain.instructor.repository.InstructorApplicationRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.enums.Role;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 강사 등록 신청 생성, 신청 내역 조회, 관리자 승인/반려 처리를 담당하는 서비스
@Service
@RequiredArgsConstructor
public class InstructorApplicationService {

    private final InstructorApplicationRepository instructorApplicationRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    // 강사 등록 신청을 생성한다
    @Transactional
    public void create(Long userId, InstructorApplicationRequest request) {
        // 이미 대기 중인 신청이 있으면 새 신청을 막는다. 반려된 신청은 재신청할 수 있어야 하므로 PENDING만 체크한다.
        if (instructorApplicationRepository.existsByUserIdAndStatus(userId, InstructorApplicationStatus.PENDING)) {
            throw new BusinessException(ErrorCode.INSTRUCTOR_APPLICATION_ALREADY_PENDING);
        }
        if (!categoryRepository.existsById(request.categoryId())) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        instructorApplicationRepository.save(InstructorApplication.builder()
                .userId(userId)
                .categoryId(request.categoryId())
                .bio(request.bio())
                .portfolioUrl(request.portfolioUrl())
                .careerYears(request.careerYears())
                .company(request.company())
                .curriculum(request.curriculum())
                .attachmentUrl(request.attachmentUrl())
                .attachmentName(request.attachmentName())
                .motivation(request.motivation())
                .privacyConsent(request.privacyConsent())
                .build());
    }

    // 마이페이지 - 내 강사 신청 내역을 최신순으로 조회
    @Transactional(readOnly = true)
    public Page<InstructorApplicationResponse> findMy(Long userId, Pageable pageable) {
        return instructorApplicationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    // 관리자 심사 목록: status가 없으면 전체, 있으면 해당 상태만 최신순으로 조회
    @Transactional(readOnly = true)
    public Page<InstructorApplicationAdminResponse> findAll(InstructorApplicationStatus status, Pageable pageable) {
        Page<InstructorApplication> applications = status == null
                ? instructorApplicationRepository.findAllByOrderByCreatedAtDesc(pageable)
                : instructorApplicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return applications.map(this::toAdminResponse);
    }

    // 승인: 신청서 상태 변경 + 실제 권한 승격을 한 트랜잭션에서 같이 처리한다.
    @Transactional
    public void approve(Long applicationId, Long adminId) {
        InstructorApplication application = getPendingOrThrow(applicationId);
        application.approve(adminId);

        User user = userRepository.findById(application.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        user.changeRole(Role.INSTRUCTOR);
    }

    // 반려: 신청서 상태를 REJECTED로 변경하고 사유를 남긴다.
    @Transactional
    public void reject(Long applicationId, Long adminId, String reason) {
        getPendingOrThrow(applicationId).reject(adminId, reason);
    }

    // 신청서를 조회하되, 이미 심사(승인/반려)가 끝난 건이면 예외를 던져 중복 처리를 막는다.
    private InstructorApplication getPendingOrThrow(Long applicationId) {
        InstructorApplication application = instructorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INSTRUCTOR_APPLICATION_NOT_FOUND));
        if (application.getStatus() != InstructorApplicationStatus.PENDING) {
            throw new BusinessException(ErrorCode.INSTRUCTOR_APPLICATION_ALREADY_PROCESSED);
        }
        return application;
    }

    // 신청서 엔티티를 신청자 본인용 응답 DTO로 변환한다.
    private InstructorApplicationResponse toResponse(InstructorApplication application) {
        return new InstructorApplicationResponse(
                application.getId(),
                application.getCategoryId(),
                findCategoryName(application.getCategoryId()),
                application.getBio(),
                application.getPortfolioUrl(),
                application.getCareerYears(),
                application.getCompany(),
                application.getCurriculum(),
                application.getAttachmentUrl(),
                application.getAttachmentName(),
                application.getMotivation(),
                application.isPrivacyConsent(),
                application.getStatus(),
                application.getRejectReason(),
                application.getReviewedAt(),
                application.getCreatedAt());
    }

    // 신청서 엔티티를 관리자 심사 화면용 응답 DTO로 변환한다 (신청자 닉네임 등 부가 정보 포함).
    private InstructorApplicationAdminResponse toAdminResponse(InstructorApplication application) {
        User applicant = userRepository.findById(application.getUserId()).orElse(null);
        return new InstructorApplicationAdminResponse(
                application.getId(),
                application.getUserId(),
                applicant == null ? "(탈퇴한 사용자)" : applicant.getNickname(),
                application.getCategoryId(),
                findCategoryName(application.getCategoryId()),
                application.getBio(),
                application.getPortfolioUrl(),
                application.getCareerYears(),
                application.getCompany(),
                application.getCurriculum(),
                application.getAttachmentUrl(),
                application.getAttachmentName(),
                application.getMotivation(),
                application.isPrivacyConsent(),
                application.getStatus(),
                application.getRejectReason(),
                application.getReviewedBy(),
                application.getReviewedAt(),
                application.getCreatedAt());
    }

    // 카테고리 ID로 이름을 찾되, 삭제 등으로 없으면 null을 반환한다.
    private String findCategoryName(Long categoryId) {
        return categoryRepository.findById(categoryId).map(Category::getName).orElse(null);
    }
}

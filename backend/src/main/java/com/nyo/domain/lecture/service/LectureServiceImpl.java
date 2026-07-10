package com.nyo.domain.lecture.service;

import com.nyo.domain.category.entity.Category;
import com.nyo.domain.category.repository.CategoryRepository;
import com.nyo.domain.lecture.dto.LectureRequest;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LectureServiceImpl implements LectureService {

    private final LectureRepository lectureRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

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

    @Override
    public List<LectureResponse> getLectureList() {
        return lectureRepository.findAll().stream()
                .filter(lecture -> !lecture.getIsDeleted())
                .map(LectureResponse::from)
                .toList();
    }

    @Override
    public LectureResponse getLecture(Long id) {
        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return LectureResponse.from(lecture);
    }

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

        lecture.update(category, request.getTitle(), request.getDescription(),
                request.getLectureUrl(), request.getInstructor(), request.getCapacity());

        return LectureResponse.from(lecture);
    }

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

        lecture.delete();
    }
}
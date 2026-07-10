package com.nyo.domain.category.service;

import com.nyo.domain.category.dto.CategoryRequest;
import com.nyo.domain.category.dto.CategoryResponse;
import com.nyo.domain.category.entity.Category;
import com.nyo.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    // 카테고리 생성 메소드
    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        // 카테고리명 중복 체크
        if (categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("이미 존재하는 카테고리명입니다: " + request.getName());
        }

        // 요청 DTO -> 엔티티 변환
        Category category = Category.builder()
                .name(request.getName())
                .build();

        // DB 저장
        Category saved = categoryRepository.save(category);

        // 엔티티 -> 응답 DTO 변환 후 반환
        return CategoryResponse.from(saved);
    }

    // 카테고리 전체 목록 조회
    @Override
    public List<CategoryResponse> getCategoryList() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::from) // 각 엔티티를 DTO로 매핑
                .toList();
    }

    // 하나의 카테고리 조회 (예외 처리 포함)
    @Override
    public CategoryResponse getCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다: " + id));
        return CategoryResponse.from(category);
    }
}
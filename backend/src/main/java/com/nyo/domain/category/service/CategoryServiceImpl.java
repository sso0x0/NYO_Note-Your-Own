package com.nyo.domain.category.service;

import com.nyo.domain.category.dto.CategoryResponse;
import com.nyo.domain.category.entity.Category;
import com.nyo.domain.category.repository.CategoryRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

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
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        return CategoryResponse.from(category);
    }
}
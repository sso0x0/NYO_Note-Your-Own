package com.nyo.domain.category.service;

import com.nyo.domain.category.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {

    // 전체 카테고리 조회
    List<CategoryResponse> getCategoryList();

    // 하나의 카테고리 반환 (id 기준)
    CategoryResponse getCategory(Long id);
}
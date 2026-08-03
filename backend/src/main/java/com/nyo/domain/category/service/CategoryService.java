package com.nyo.domain.category.service;

import com.nyo.domain.category.dto.CategoryResponse;

import java.util.List;

// 카테고리 조회 기능을 정의하는 서비스 인터페이스
public interface CategoryService {

    // 전체 카테고리 조회
    List<CategoryResponse> getCategoryList();

    // 하나의 카테고리 반환 (id 기준)
    CategoryResponse getCategory(Long id);
}
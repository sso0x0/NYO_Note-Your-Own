package com.nyo.domain.category.controller;

import com.nyo.domain.category.dto.CategoryRequest;
import com.nyo.domain.category.dto.CategoryResponse;
import com.nyo.domain.category.service.CategoryService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Category", description = "카테고리 API (스캐폴딩 단계)")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "카테고리 API")
public class CategoryController {

    private final CategoryService categoryService;

    }

    // 전체 목록 조회 (200 ok)
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategoryList() {
        return ResponseEntity.ok(categoryService.getCategoryList());
    }

    // 하나의 카테고리 조회 (id 기준 1/2/3/4 => 프론트엔드/백엔드/CS/빅데이터)
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategory(id));
    }
}
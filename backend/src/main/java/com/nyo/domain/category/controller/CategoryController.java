package com.nyo.domain.category.controller;

import com.nyo.domain.category.dto.CategoryRequest;
import com.nyo.domain.category.dto.CategoryResponse;
import com.nyo.domain.category.service.CategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "카테고리 API")
public class CategoryController {

    private final CategoryService categoryService;

    // 새로운 카테고리 생성
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
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
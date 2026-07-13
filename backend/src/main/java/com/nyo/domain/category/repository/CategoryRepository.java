package com.nyo.domain.category.repository;

import com.nyo.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // 카테고리명 중복 체크용
    boolean existsByName(String name);
}
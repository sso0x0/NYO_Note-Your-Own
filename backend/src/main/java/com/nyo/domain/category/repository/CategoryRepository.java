package com.nyo.domain.category.repository;

import com.nyo.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // 카테고리명 중복 체크용
    boolean existsByName(String name);
}
    /**
     * 이 레포지토리가 어떤 엔티티를 다루는지 스스로 설명합니다.
     */
    default String introduce() {
        return "CategoryRepository: Category 엔티티에 대한 기본 CRUD를 제공합니다. (구현 예정)";
    }
}

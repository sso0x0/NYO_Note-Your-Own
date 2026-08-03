package com.nyo.domain.category.repository;

import com.nyo.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Category 엔티티에 대한 CRUD 및 정렬 조회를 담당하는 레포지토리
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // findAll()은 정렬 기준이 없어 DB가 반환하는 순서가 매번 같다는 보장이 없다.
    // DB에 등록된 순서(id 오름차순 = 프론트엔드, 백엔드, CS, 빅데이터)를 그대로 보장하려면 명시적으로 정렬해야 한다.
    List<Category> findAllByOrderByIdAsc();
}
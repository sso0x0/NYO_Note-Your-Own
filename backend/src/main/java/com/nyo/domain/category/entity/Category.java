package com.nyo.domain.category.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 카테고리 (프론트엔드/백엔드/CS/빅데이터)
@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    // 카테고리 PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // 카테고리명 (중복 불가)
    @Column(name = "name", length = 100, nullable = false, unique = true)
    private String name;

    @Builder
    public Category(String name) {
        this.name = name;
    }

    // 카테고리명 수정
    public void update(String name) {
        this.name = name;
    }
}
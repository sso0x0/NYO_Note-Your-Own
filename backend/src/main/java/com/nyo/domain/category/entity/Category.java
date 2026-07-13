package com.nyo.domain.category.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 카테고리 (프론트엔드/백엔드/CS/빅데이터)
/*
*** TODO: DB 내 삽입 필요 ***
INSERT INTO categories (name) VALUES ('프론트엔드');
INSERT INTO categories (name) VALUES ('백엔드');
INSERT INTO categories (name) VALUES ('CS');
INSERT INTO categories (name) VALUES ('빅데이터');
 */
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
}
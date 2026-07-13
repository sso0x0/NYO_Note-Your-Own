package com.nyo.domain.post.entity;

import com.nyo.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * TODO: 실제 컬럼/연관관계는 팀 DDL 확정 후 채워주세요.
 * domain/chat과 동일한 4종 폴더 구조(controller·entity·repository·service)를 맞추기 위한
 * 스캐폴딩용 placeholder 엔티티입니다.
 */
@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 이 엔티티가 어떤 데이터를 표현하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "Post 엔티티: 커뮤니티 게시판의 게시글 내용을 저장합니다. (구현 예정)";
    }
}

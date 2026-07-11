package com.nyo.domain.note.entity;

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
 * 현재 ChatService/AiTaggingService는 이 엔티티 대신 JdbcTemplate로 notes 테이블을
 * 직접 조회하고 있어, 이 엔티티가 실제로 채워지면 그쪽도 교체 대상입니다.
 */
@Entity
@Table(name = "notes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Note extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 이 엔티티가 어떤 데이터를 표현하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "Note 엔티티: 사용자가 강의를 들으며 작성하는 학습 노트(필기) 내용을 저장합니다. (구현 예정)";
    }
}

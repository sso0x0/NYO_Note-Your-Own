package com.nyo.global.entity;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 모든 도메인 엔티티(Course, Note, Post, Member 등)가 상속해서 사용하는 공통 필드.
 * 각자 엔티티에 createdAt/updatedAt을 따로 만들지 말고 이걸 extends 해서 쓰세요.
 *
 * 사용 예)
 *   @Entity
 *   public class Course extends BaseEntity { ... }
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

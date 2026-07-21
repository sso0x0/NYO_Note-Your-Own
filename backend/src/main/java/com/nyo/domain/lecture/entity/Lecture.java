package com.nyo.domain.lecture.entity;

import com.nyo.domain.category.entity.Category;
import com.nyo.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// 강의(녹화본) 엔티티 (관리자만 등록/수정/삭제 가능)
@Entity
@Table(name = "lectures")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Lecture {

    // 강의 PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // 소속 카테고리 FK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // 등록한 관리자 FK (등록 이후 변경 불가)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    // 강의명
    @Column(name = "title", length = 200, nullable = false)
    private String title;

    // 강의 설명
    @Lob
    @Column(name = "description")
    private String description;

    // 강의 링크
    @Column(name = "lecture_url", length = 1000)
    private String lectureUrl;

    // 강의 대표 썸네일 이미지 URL
    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    // 강사명
    @Column(name = "instructor", length = 100)
    private String instructor;

    // 수강 정원 (NULL이면 무제한)
    @Column(name = "capacity")
    private Integer capacity;

    // 현재 등록 인원
    @ColumnDefault("0")
    @Column(name = "current_enrolled", nullable = false)
    private Integer currentEnrolled;

    // 조회수
    @ColumnDefault("0")
    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    // 좋아요수
    @ColumnDefault("0")
    @Column(name = "like_count", nullable = false)
    private Long likeCount;

    // 인기 강의 여부 (배치/스케줄러 등으로 갱신)
    @ColumnDefault("0")
    @Column(name = "is_popular", nullable = false)
    private Boolean isPopular;

    // 관리자 삭제 여부
    @ColumnDefault("0")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    // 등록일 (자동 생성)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 수정일 (자동 갱신)
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Lecture(Category category, User createdBy, String title, String description,
                   String lectureUrl, String thumbnailUrl, String instructor, Integer capacity) {
        this.category = category;
        this.createdBy = createdBy;
        this.title = title;
        this.description = description;
        this.lectureUrl = lectureUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.instructor = instructor;
        this.capacity = capacity;
        this.currentEnrolled = 0;
        this.viewCount = 0L;
        this.likeCount = 0L;
        this.isPopular = false;
        this.isDeleted = false;
    }
    // 강의 정보 수정 (관리자만 호출 가능)
    public void update(Category category, String title, String description,
                       String lectureUrl, String thumbnailUrl, String instructor, Integer capacity) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.lectureUrl = lectureUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.instructor = instructor;
        this.capacity = capacity;
    }

    // 강의 삭제 처리
    public void delete() {
        this.isDeleted = true;
    }

    // 인기 강의 여부 갱신
    public void updatePopularStatus(boolean isPopular) {
        this.isPopular = isPopular;
    }
}
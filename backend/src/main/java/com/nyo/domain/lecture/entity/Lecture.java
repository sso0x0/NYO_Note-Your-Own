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

    // 강의 대표 썸네일 이미지 URL (사용자 입력이 아닌, lectureUrl에서 서버가 자동으로 뽑아 저장)
    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    // 복습용 자료 URL (선택, 강의 신청 시 참고자료/자료실 링크 등을 남길 수 있음)
    @Column(name = "review_url", length = 1000)
    private String reviewUrl;

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

    // 심사 상태. 관리자가 등록하면 즉시 APPROVED, 강사가 등록 신청하면 PENDING으로 시작한다.
    // PENDING/REJECTED 강의는 일반 조회/검색 목록에서 제외되고, 등록한 강사 본인과 관리자만 볼 수 있다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private LectureStatus status;

    // 반려 사유 (REJECTED 상태일 때만 값이 있음)
    @Lob
    @Column(name = "reject_reason")
    private String rejectReason;

    // 심사(승인/반려) 처리 시각
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    // 등록일 (자동 생성)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 수정일 (자동 갱신)
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 강의 생성자. 조회수/좋아요수/등록인원 등은 0, 삭제/인기 여부는 false로 초기화한다
    @Builder
    public Lecture(Category category, User createdBy, String title, String description,
                   String lectureUrl, String thumbnailUrl, String reviewUrl, String instructor, Integer capacity,
                   LectureStatus status) {
        this.category = category;
        this.createdBy = createdBy;
        this.title = title;
        this.description = description;
        this.lectureUrl = lectureUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.reviewUrl = reviewUrl;
        this.instructor = instructor;
        this.capacity = capacity;
        this.currentEnrolled = 0;
        this.viewCount = 0L;
        this.likeCount = 0L;
        this.isPopular = false;
        this.isDeleted = false;
        this.status = status;
    }
    // 강의 정보 수정 (관리자만 호출 가능)
    public void update(Category category, String title, String description,
                       String lectureUrl, String thumbnailUrl, String reviewUrl, String instructor, Integer capacity) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.lectureUrl = lectureUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.reviewUrl = reviewUrl;
        this.instructor = instructor;
        this.capacity = capacity;
    }

    // 강의 삭제 처리
    public void delete() {
        this.isDeleted = true;
    }

    // 관리자가 삭제한 강의를 복구 (DB에서 완전히 삭제되기 전까지 다시 되돌릴 수 있음)
    public void restore() {
        this.isDeleted = false;
    }

    // 강사가 등록 신청한 강의를 관리자가 승인 (일반 목록/검색에 노출)
    public void approve() {
        this.status = LectureStatus.APPROVED;
        this.reviewedAt = LocalDateTime.now();
    }

    // 강사가 등록 신청한 강의를 관리자가 반려
    public void reject(String reason) {
        this.status = LectureStatus.REJECTED;
        this.rejectReason = reason;
        this.reviewedAt = LocalDateTime.now();
    }

    // 인기 강의 여부 갱신
    public void updatePopularStatus(boolean isPopular) {
        this.isPopular = isPopular;
    }
}
package com.nyo.domain.lecture.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "lectures")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)

    // 강의 PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    }
    // 강의 정보 수정 (관리자만 호출 가능)
    public void update(Category category, String title, String description,
                       String lectureUrl, String instructor, Integer capacity) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.lectureUrl = lectureUrl;
        this.instructor = instructor;
        this.capacity = capacity;
    }

    // 강의 삭제 처리
    public void delete() {
        this.isDeleted = true;
    }

    // 조회수 1 증가 (중복 방지 통과 후 처리)
    public void increaseViewCount() {
        this.viewCount++;
    }

    // 좋아요수 1 증가
    public void increaseLikeCount() {
        this.likeCount++;
    }

    // 좋아요수 1 감소
    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    // 인기 강의 여부 갱신
    public void updatePopularStatus(boolean isPopular) {
        this.isPopular = isPopular;
    }
}
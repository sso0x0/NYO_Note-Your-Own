package com.nyo.domain.note.entity;

import com.nyo.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
// notes 테이블과 매핑되는 학습 노트 엔티티
@Table(name = "notes")
public class Note extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lecture_id", nullable = false)
    private Long lectureId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    @Column(name = "like_count", nullable = false)
    private Long likeCount;

    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted;

    // 조회수/좋아요수 0, 미삭제 상태로 새 노트를 생성한다.
    public static Note create(Long userId, Long lectureId, String title, String content, String thumbnailUrl) {
        return Note.builder()
                .userId(userId)
                .lectureId(lectureId)
                .title(title)
                .content(content)
                .thumbnailUrl(thumbnailUrl)
                .viewCount(0L)
                .likeCount(0L)
                .isDeleted(0)
                .build();
    }

    // 제목/본문/썸네일을 새 값으로 교체한다.
    public void update(String title, String content, String thumbnailUrl) {
        this.title = title;
        this.content = content;
        this.thumbnailUrl = thumbnailUrl;
    }

    // 소프트 삭제: row는 남기고 isDeleted만 플래그로 표시한다.
    public void delete() {
        this.isDeleted = 1;
    }

    // isDeleted 컬럼(Integer) 값이 1인지로 삭제 여부를 판단한다.
    public boolean isDeleted() {
        return Integer.valueOf(1).equals(isDeleted);
    }
}

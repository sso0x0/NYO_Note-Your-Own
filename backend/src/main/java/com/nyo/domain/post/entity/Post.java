package com.nyo.domain.post.entity;

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
// 커뮤니티 게시글 엔티티.
@Table(name = "posts")
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    // 관리자 공지 기능: 1이면 공지, 0이면 일반 게시글이다.
    @Column(name = "is_notice", nullable = false)
    private Integer isNotice;

    // 새 게시글을 생성한다 (조회수/좋아요수 0으로 초기화).
    public static Post create(Long userId, String title, String content, String thumbnailUrl, boolean notice) {
        return Post.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .thumbnailUrl(thumbnailUrl)
                .viewCount(0L)
                .likeCount(0L)
                .isDeleted(0)
                .isNotice(notice ? 1 : 0)
                .build();
    }

    // 게시글 제목/본문/썸네일/공지 여부를 수정한다.
    public void update(String title, String content, String thumbnailUrl, boolean notice) {
        this.title = title;
        this.content = content;
        this.thumbnailUrl = thumbnailUrl;
        this.isNotice = notice ? 1 : 0;
    }

    // 게시글을 소프트 삭제 처리한다.
    public void delete() {
        this.isDeleted = 1;
    }

    // 삭제된 게시글을 복구한다.
    public void restore() {
        this.isDeleted = 0;
    }

    // isDeleted 값이 1인지로 삭제 여부를 판단한다.
    public boolean isDeleted() {
        return Integer.valueOf(1).equals(isDeleted);
    }

    // isNotice 값이 1인지로 공지 여부를 판단한다.
    public boolean isNotice() {
        return Integer.valueOf(1).equals(isNotice);
    }
}

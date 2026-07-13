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

    public static Post create(Long userId, String title, String content, String thumbnailUrl) {
        return Post.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .thumbnailUrl(thumbnailUrl)
                .viewCount(0L)
                .likeCount(0L)
                .isDeleted(0)
                .build();
    }

    public void update(String title, String content, String thumbnailUrl) {
        this.title = title;
        this.content = content;
        this.thumbnailUrl = thumbnailUrl;
    }

    public void delete() {
        this.isDeleted = 1;
    }

    public boolean isDeleted() {
        return Integer.valueOf(1).equals(isDeleted);
    }
}

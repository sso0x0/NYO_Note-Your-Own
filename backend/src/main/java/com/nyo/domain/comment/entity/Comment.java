package com.nyo.domain.comment.entity;

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
@Table(name = "comments")
public class Comment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "parent_comment_id")
    private Long parentCommentId;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted;

    public static Comment create(Long postId, Long userId, Long parentCommentId, String content) {
        return Comment.builder()
                .postId(postId)
                .userId(userId)
                .parentCommentId(parentCommentId)
                .content(content)
                .isDeleted(0)
                .build();
    }

    public void update(String content) {
        this.content = content;
    }

    public void delete() {
        this.isDeleted = 1;
    }

    public boolean isDeleted() {
        return Integer.valueOf(1).equals(isDeleted);
    }
}

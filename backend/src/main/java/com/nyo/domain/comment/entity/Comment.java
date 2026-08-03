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
// 게시글/강의 댓글(및 대댓글) 엔티티.
@Table(name = "comments")
public class Comment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "lecture_id")
    private Long lectureId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "parent_comment_id")
    private Long parentCommentId;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted;

    // 게시글에 달리는 댓글(또는 대댓글)을 생성한다.
    public static Comment createForPost(Long postId, Long userId, Long parentCommentId, String content) {
        return Comment.builder()
                .postId(postId)
                .userId(userId)
                .parentCommentId(parentCommentId)
                .content(content)
                .isDeleted(0)
                .build();
    }

    // 강의에 달리는 댓글(또는 대댓글)을 생성한다.
    public static Comment createForLecture(Long lectureId, Long userId, Long parentCommentId, String content) {
        return Comment.builder()
                .lectureId(lectureId)
                .userId(userId)
                .parentCommentId(parentCommentId)
                .content(content)
                .isDeleted(0)
                .build();
    }

    // 댓글 내용을 수정한다.
    public void update(String content) {
        this.content = content;
    }

    // 댓글을 소프트 삭제 처리한다.
    public void delete() {
        this.isDeleted = 1;
    }

    // 삭제된 댓글을 복구한다.
    public void restore() {
        this.isDeleted = 0;
    }

    // isDeleted 값이 1인지로 삭제 여부를 판단한다.
    public boolean isDeleted() {
        return Integer.valueOf(1).equals(isDeleted);
    }
}

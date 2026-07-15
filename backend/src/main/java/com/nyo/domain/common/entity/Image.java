package com.nyo.domain.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "images")
public class Image {

    // 이미지 테이블의 기본키
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 노트에 연결된 이미지일 때 사용하는 노트 ID
    @Column(name = "note_id")
    private Long noteId;

    // 게시글에 연결된 이미지일 때 사용하는 게시글 ID
    @Column(name = "post_id")
    private Long postId;

    // GCS에 업로드된 이미지 접근 URL
    @Column(name = "image_url", nullable = false, length = 1000)
    private String imageUrl;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    // 이미지 정보가 DB에 저장된 시간
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 게시글 작성 시 thumbnailUrl을 images 테이블에 저장하기 위한 생성 메서드
    public static Image createForPost(Long postId, String imageUrl) {
        return Image.builder()
                .postId(postId)
                .imageUrl(imageUrl)
                .displayOrder(0)
                .build();
    }
}

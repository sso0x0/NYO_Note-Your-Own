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

    // 사용자가 업로드한 원본 파일명
    @Column(name = "original_name", length = 255)
    private String originalName;

    // 사용자가 업로드한 파일 크기(byte)
    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    // 이미지 정보가 DB에 저장된 시간
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 노트 이미지 URL과 파일 정보를 images 테이블에 저장하기 위한 생성 메서드
    public static Image createForNote(Long noteId, String imageUrl, String originalName, Long fileSize) {
        return createForNote(noteId, imageUrl, originalName, fileSize, 0);
    }

    // 본문 중간 이미지처럼 순서가 필요한 노트 이미지를 저장하기 위한 생성 메서드
    public static Image createForNote(Long noteId, String imageUrl, String originalName, Long fileSize, Integer displayOrder) {
        return Image.builder()
                .noteId(noteId)
                .imageUrl(imageUrl)
                .originalName(originalName)
                .fileSize(fileSize)
                .displayOrder(displayOrder == null ? 0 : displayOrder)
                .build();
    }

    // 게시글 이미지 URL과 파일 정보를 images 테이블에 저장하기 위한 생성 메서드
    public static Image createForPost(Long postId, String imageUrl, String originalName, Long fileSize) {
        return createForPost(postId, imageUrl, originalName, fileSize, 0);
    }

    // 본문 중간 이미지처럼 순서가 필요한 게시글 이미지를 저장하기 위한 생성 메서드
    public static Image createForPost(Long postId, String imageUrl, String originalName, Long fileSize, Integer displayOrder) {
        return Image.builder()
                .postId(postId)
                .imageUrl(imageUrl)
                .originalName(originalName)
                .fileSize(fileSize)
                .displayOrder(displayOrder == null ? 0 : displayOrder)
                .build();
    }
}

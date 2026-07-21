package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// images 테이블에 이미지 정보를 저장하고 조회하는 Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    // 노트 삭제 시 연결된 이미지들을 찾아 GCS와 DB에서 같이 정리한다.
    List<Image> findByNoteId(Long noteId);

    // 노트 수정 시 특정 URL의 기존 이미지만 찾아 정리한다.
    List<Image> findByNoteIdAndImageUrl(Long noteId, String imageUrl);

    // 게시글 삭제 시 연결된 이미지들을 찾아 GCS와 DB에서 같이 정리한다.
    List<Image> findByPostId(Long postId);

    // 게시글 수정 시 특정 URL의 기존 이미지만 찾아 정리한다.
    List<Image> findByPostIdAndImageUrl(Long postId, String imageUrl);
}

package com.nyo.domain.common.repository;

import com.nyo.domain.common.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;

// images 테이블에 이미지 정보를 저장하고 조회하는 Repository
public interface ImageRepository extends JpaRepository<Image, Long> {
}

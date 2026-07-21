package com.nyo.domain.tag.repository;

import com.nyo.domain.tag.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    // AiTaggingService가 태그 저장 전에 동일한 이름의 태그가 이미 있는지 확인할 때 사용 (중복 태그 생성 방지)
    Optional<Tag> findByName(String name);
}

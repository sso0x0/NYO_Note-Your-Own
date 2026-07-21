package com.nyo.domain.tag.repository;

import com.nyo.domain.tag.entity.NoteTag;
import com.nyo.domain.tag.entity.NoteTagId;
import org.springframework.data.jpa.repository.JpaRepository;

// AiTaggingService가 노트-태그 매핑 저장/existsById(중복 매핑 방지)에 사용
public interface NoteTagRepository extends JpaRepository<NoteTag, NoteTagId> {
}

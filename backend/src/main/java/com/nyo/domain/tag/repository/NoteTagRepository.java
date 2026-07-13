package com.nyo.domain.tag.repository;

import com.nyo.domain.tag.entity.NoteTag;
import com.nyo.domain.tag.entity.NoteTagId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteTagRepository extends JpaRepository<NoteTag, NoteTagId> {
}

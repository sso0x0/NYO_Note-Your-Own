package com.nyo.domain.note.repository;

import com.nyo.domain.note.entity.NoteHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 노트 수정 이력(NoteHistory) 조회를 담당하는 JPA 리포지토리
public interface NoteHistoryRepository extends JpaRepository<NoteHistory, Long> {

    // 특정 노트의 수정 이력을 최신순으로 조회한다.
    List<NoteHistory> findByNoteIdOrderByEditedAtDesc(Long noteId);
}

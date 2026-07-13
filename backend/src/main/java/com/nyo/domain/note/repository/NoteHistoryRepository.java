package com.nyo.domain.note.repository;

import com.nyo.domain.note.entity.NoteHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteHistoryRepository extends JpaRepository<NoteHistory, Long> {

    List<NoteHistory> findByNoteIdOrderByEditedAtDesc(Long noteId);
}

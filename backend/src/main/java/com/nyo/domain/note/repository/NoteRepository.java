package com.nyo.domain.note.repository;

import com.nyo.domain.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted);

    List<Note> findByLectureIdAndIsDeletedOrderByCreatedAtDesc(Long lectureId, Integer isDeleted);

    Optional<Note> findByIdAndIsDeleted(Long id, Integer isDeleted);
}

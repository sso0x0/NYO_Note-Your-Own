package com.nyo.domain.note.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "note_histories")
// note_histories 테이블과 연결되는 노트 수정 이력
public class NoteHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "note_id", nullable = false)
    private Long noteId;

    @Column(name = "editor_id", nullable = false)
    private Long editorId;

    @Column(name = "prev_title", nullable = false, length = 200)
    private String prevTitle;

    @Lob
    @Column(name = "prev_content", nullable = false)
    private String prevContent;

    @Column(name = "edited_at", nullable = false)
    private LocalDateTime editedAt;

    // 노트 수정 직전의 제목과 본문을 이력으로 저장
    public static NoteHistory from(Note note, Long editorId) {
        return NoteHistory.builder()
                .noteId(note.getId())
                .editorId(editorId)
                .prevTitle(note.getTitle())
                .prevContent(note.getContent())
                .editedAt(LocalDateTime.now())
                .build();
    }
}

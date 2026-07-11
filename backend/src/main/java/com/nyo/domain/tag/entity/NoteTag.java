package com.nyo.domain.tag.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 노트-태그 매핑. 팀 공식 DDL의 note_tags 테이블과 매핑 (복합 PK, updated_at 없음).
 * Note 엔티티가 아직 없어서 noteId를 Long으로 보관합니다.
 */
@Entity
@Table(name = "note_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class NoteTag {

    @EmbeddedId
    private NoteTagId id;

    @Column(name = "is_ai_generated", nullable = false)
    private Boolean isAiGenerated;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public NoteTag(Long noteId, Long tagId, Boolean isAiGenerated) {
        this.id = new NoteTagId(noteId, tagId);
        this.isAiGenerated = isAiGenerated != null ? isAiGenerated : false;
    }
}

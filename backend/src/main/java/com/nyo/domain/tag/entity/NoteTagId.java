package com.nyo.domain.tag.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * note_tags 복합 PK (note_id + tag_id)
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode
public class NoteTagId implements Serializable {

    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "tag_id")
    private Long tagId;
}

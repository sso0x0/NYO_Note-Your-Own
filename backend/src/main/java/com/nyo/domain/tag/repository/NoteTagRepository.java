package com.nyo.domain.tag.repository;

import com.nyo.domain.tag.entity.NoteTag;
import com.nyo.domain.tag.entity.NoteTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteTagRepository extends JpaRepository<NoteTag, NoteTagId> {

    // 노트 검색 색인(Elasticsearch)에 태그명을 함께 넣기 위한 조회. NoteTag는 Tag와 연관관계가 없어 theta join으로 연결한다.
    @Query("select t.name from NoteTag nt, Tag t where nt.id.noteId = :noteId and nt.id.tagId = t.id")
    List<String> findTagNamesByNoteId(@Param("noteId") Long noteId);

    // 전체 재색인 시 노트마다 태그를 따로 조회하는 N+1을 피하기 위한 배치 조회.
    @Query("select nt.id.noteId as noteId, t.name as tagName " +
            "from NoteTag nt, Tag t where nt.id.noteId in :noteIds and nt.id.tagId = t.id")
    List<NoteIdTagName> findTagNamesByNoteIdIn(@Param("noteIds") List<Long> noteIds);

    interface NoteIdTagName {
        Long getNoteId();
        String getTagName();
    }
}

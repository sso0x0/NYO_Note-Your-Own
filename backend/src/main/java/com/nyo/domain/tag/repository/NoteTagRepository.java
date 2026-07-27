package com.nyo.domain.tag.repository;

import com.nyo.domain.note.dto.NoteTagResponse;
import com.nyo.domain.tag.entity.NoteTag;
import com.nyo.domain.tag.entity.NoteTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

// AiTaggingService가 노트-태그 매핑 저장/existsById(중복 매핑 방지)에 사용
public interface NoteTagRepository extends JpaRepository<NoteTag, NoteTagId> {

    // 노트 검색 색인(Elasticsearch)에 태그명을 함께 넣기 위한 조회. NoteTag는 Tag와 연관관계가 없어 theta join으로 연결한다.
    @Query("select t.name from NoteTag nt, Tag t where nt.id.noteId = :noteId and nt.id.tagId = t.id")
    List<String> findTagNamesByNoteId(@Param("noteId") Long noteId);

    // 노트 상세 화면에서 태그 목록을 보여주기 위한 조회 (TagService.getNoteTags에서 사용)
    @Query("select new com.nyo.domain.note.dto.NoteTagResponse(nt.id.noteId, t.id, t.name, nt.isAiGenerated, nt.createdAt) "
            + "from NoteTag nt, Tag t where nt.id.noteId = :noteId and nt.id.tagId = t.id order by nt.createdAt asc")
    List<NoteTagResponse> findResponsesByNoteId(@Param("noteId") Long noteId);

    // 전체 재색인 시 노트마다 태그를 따로 조회하는 N+1을 피하기 위한 배치 조회.
    @Query("select nt.id.noteId as noteId, t.name as tagName " +
            "from NoteTag nt, Tag t where nt.id.noteId in :noteIds and nt.id.tagId = t.id")
    List<NoteIdTagName> findTagNamesByNoteIdIn(@Param("noteIds") List<Long> noteIds);

    interface NoteIdTagName {
        Long getNoteId();
        String getTagName();
    }
}

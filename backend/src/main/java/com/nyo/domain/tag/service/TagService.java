package com.nyo.domain.tag.service;

import com.nyo.domain.note.dto.NoteTagResponse;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.note.service.NoteService;
import com.nyo.domain.tag.entity.NoteTag;
import com.nyo.domain.tag.entity.NoteTagId;
import com.nyo.domain.tag.entity.Tag;
import com.nyo.domain.tag.repository.NoteTagRepository;
import com.nyo.domain.tag.repository.TagRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
// 해시태그 조회와 작성자의 수동 태그 추가/삭제(CRUD)를 담당하는 서비스
public class TagService {

    private final TagRepository tagRepository;
    private final NoteTagRepository noteTagRepository;
    private final NoteRepository noteRepository;
    private final NoteService noteService; // 태그 추가/삭제 후 검색 색인에 반영하기 위해 사용

    private static final int MAX_TAG_NAME_LENGTH = 50;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "TagService: 해시태그(Tag)와 노트-태그 매핑(NoteTag)을 관리합니다. "
                + "AI 자동 태깅은 AiTaggingService가 담당하고, 이 서비스는 태그 목록 조회와 "
                + "작성자의 수동 태그 추가/삭제(일반 CRUD)를 담당합니다.";
    }

    // 노트 상세 화면에 태그 목록을 보여주기 위한 조회 (등록순)
    public List<NoteTagResponse> getNoteTags(Long noteId) {
        return noteTagRepository.findResponsesByNoteId(noteId);
    }

    // 작성자가 직접 태그명을 입력해 노트에 추가. 이미 있는 이름이면 그 태그에, 없으면 새로 만들어 매핑한다
    // (AiTaggingService의 태그 find-or-create 방식과 동일).
    @Transactional
    public NoteTagResponse addTag(Long noteId, Long userId, String rawName) {
        getOwnedNote(noteId, userId);

        String name = rawName == null ? "" : rawName.trim();
        if (name.isEmpty() || name.length() > MAX_TAG_NAME_LENGTH) {
            throw new BusinessException(ErrorCode.TAG_NAME_INVALID);
        }

        Tag tag = tagRepository.findByName(name)
                .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build()));

        if (noteTagRepository.existsById(new NoteTagId(noteId, tag.getId()))) {
            throw new BusinessException(ErrorCode.TAG_ALREADY_ADDED);
        }

        NoteTag mapping = noteTagRepository.save(NoteTag.builder()
                .noteId(noteId)
                .tagId(tag.getId())
                .isAiGenerated(false)
                .build());

        // 새 태그가 검색(Elasticsearch)에도 즉시 반영되도록 색인을 다시 반영한다.
        noteService.reindexNote(noteId);

        return NoteTagResponse.builder()
                .noteId(noteId)
                .tagId(tag.getId())
                .tagName(tag.getName())
                .isAiGenerated(false)
                .createdAt(mapping.getCreatedAt())
                .build();
    }

    // 작성자 본인만 노트-태그 매핑을 삭제할 수 있다. AI가 붙인 태그도 잘못됐다면 지울 수 있어야 하므로
    // isAiGenerated 여부와 무관하게 허용한다 (AI 재생성은 기존 매핑을 건드리지 않고 새 태그만 추가하므로 서로 충돌하지 않는다).
    @Transactional
    public void removeTag(Long noteId, Long userId, Long tagId) {
        getOwnedNote(noteId, userId);

        NoteTagId id = new NoteTagId(noteId, tagId);
        if (!noteTagRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOTE_TAG_NOT_FOUND);
        }
        noteTagRepository.deleteById(id);

        noteService.reindexNote(noteId);
    }

    // 삭제되지 않은 노트를 조회하고, 작성자 본인이 맞는지 확인한다 (아니면 예외)
    private Note getOwnedNote(Long noteId, Long userId) {
        Note note = noteRepository.findByIdAndIsDeleted(noteId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        if (!note.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
        return note;
    }
}

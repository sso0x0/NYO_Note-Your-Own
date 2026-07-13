package com.nyo.domain.note.service;

import com.nyo.domain.note.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "NoteService: 학습 노트 작성·조회·수정·삭제 로직을 담당할 예정입니다. "
                + "(현재 ChatService/AiTaggingService는 JdbcTemplate로 notes 테이블을 직접 조회하고 있습니다.)";
    }
}

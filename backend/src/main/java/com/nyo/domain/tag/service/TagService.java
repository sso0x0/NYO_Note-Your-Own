package com.nyo.domain.tag.service;

import com.nyo.domain.tag.repository.NoteTagRepository;
import com.nyo.domain.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final NoteTagRepository noteTagRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "TagService: 해시태그(Tag)와 노트-태그 매핑(NoteTag)을 관리합니다. "
                + "현재 태그 생성 자체는 AiTaggingService가 담당하고 있어, "
                + "이 서비스는 추후 태그 목록 조회 등 일반 CRUD 창구로 확장될 예정입니다.";
    }
}

package com.nyo.domain.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nyo.domain.ai.client.OpenAiClient;
import com.nyo.domain.common.dto.response.AiTagResponse;
import com.nyo.domain.note.dto.NoteTagResponse ;
import com.nyo.domain.note.service.NoteService;
import com.nyo.domain.tag.entity.NoteTag;
import com.nyo.domain.tag.entity.NoteTagId;
import com.nyo.domain.tag.entity.Tag;
import com.nyo.domain.tag.repository.NoteTagRepository;
import com.nyo.domain.tag.repository.TagRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiTaggingService {

    private final JdbcTemplate jdbcTemplate;
    private final OpenAiClient openAiClient;
    private final TagRepository tagRepository;
    private final NoteTagRepository noteTagRepository;
    private final ObjectMapper objectMapper;
    private final NoteService noteService; // 태깅 직후 노트 검색 색인에 태그를 반영하기 위해 사용

    // 노트 본문이 너무 길면 토큰 낭비라 앞부분만 잘라서 보냄
    private static final int MAX_CONTENT_LENGTH = 4000;

    private static final String SYSTEM_PROMPT = """
            너는 개발 학습 노트를 분석해 해시태그를 붙이는 분류기다.
            노트 제목과 본문을 읽고 반드시 아래 JSON 형식으로만 응답해라. 다른 설명이나 마크다운 없이 JSON 객체 하나만 출력해라.
            {"tags": ["태그1", "태그2"], "category": "카테고리명"}

            - tags: 노트에 실제로 등장하는 핵심 기술/개념 키워드 3~5개.
              - 라이브러리·프레임워크·언어·자료구조·알고리즘 등 구체적인 이름을 우선한다 (예: "Spring Boot", "JPA", "useEffect", "이진 탐색").
              - "프로그래밍", "개발", "공부"처럼 너무 일반적인 단어는 쓰지 마라.
              - 같은 대상을 표기만 다르게(대소문자, 띄어쓰기, 한글 표기 등) 중복해서 넣지 말고, 널리 쓰이는 공식 표기 하나만 사용해라 (예: "리액트"가 아니라 "React").
              - 각 태그는 50자 이하의 짧은 단어/구로 작성한다.
            - category: 반드시 "프론트엔드", "백엔드", "CS", "빅데이터" 중 정확히 하나를 그 표기 그대로 출력한다. 다른 표현이나 조합은 쓰지 마라.
            """;

    /**
     * 노트 내용을 OpenAI로 분석해 태그를 생성하고 note_tags에 저장합니다.
     * 이미 매핑된 태그는 건너뛰고, 새로 추가된 매핑만 응답에 담습니다.
     */
    @Transactional
    public AiTagResponse generateTags(Long noteId) {
        NoteSnippet note = findNote(noteId);

        String content = note.content().length() > MAX_CONTENT_LENGTH
                ? note.content().substring(0, MAX_CONTENT_LENGTH)
                : note.content();
        String userPrompt = "제목: %s\n\n본문:\n%s".formatted(note.title(), content);

        String aiResult = openAiClient.chatJson(SYSTEM_PROMPT, userPrompt);

        List<String> tagNames = new ArrayList<>();
        String category;
        try {
            JsonNode root = objectMapper.readTree(aiResult);
            root.path("tags").forEach(node -> tagNames.add(node.asText()));
            category = root.path("category").asText(null);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        List<NoteTagResponse> savedTags = new ArrayList<>();
        for (String rawName : tagNames) {
            String name = rawName.trim();
            if (name.isEmpty() || name.length() > 50) {
                continue;
            }
            Tag tag = tagRepository.findByName(name)
                    .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build()));

            if (noteTagRepository.existsById(new NoteTagId(noteId, tag.getId()))) {
                continue;
            }
            NoteTag mapping = noteTagRepository.save(NoteTag.builder()
                    .noteId(noteId)
                    .tagId(tag.getId())
                    .isAiGenerated(true)
                    .build());

            savedTags.add(NoteTagResponse.builder()
                    .noteId(noteId)
                    .tagId(tag.getId())
                    .tagName(tag.getName())
                    .isAiGenerated(true)
                    .createdAt(mapping.getCreatedAt())
                    .build());
        }

        // 새로 저장된 태그가 있을 때만 검색 색인을 다시 반영한다.
        if (!savedTags.isEmpty()) {
            noteService.reindexNote(noteId);
        }

        return AiTagResponse.builder()
                .noteId(noteId)
                .suggestedCategory(category)
                .tags(savedTags)
                .build();
    }

    // Note 엔티티(염상환 파트)가 아직 없어서 JdbcTemplate로 읽기 전용 조회
    // TODO: Note 엔티티 머지 후 NoteRepository 조회로 교체
    private NoteSnippet findNote(Long noteId) {
        return jdbcTemplate.query(
                        "SELECT title, content FROM notes WHERE id = ? AND is_deleted = 0",
                        (rs, rowNum) -> new NoteSnippet(rs.getString("title"), rs.getString("content")),
                        noteId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
    }

    private record NoteSnippet(String title, String content) {
    }
}

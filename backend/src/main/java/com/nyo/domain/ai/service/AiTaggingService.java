package com.nyo.domain.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nyo.domain.ai.client.OpenAiClient;
import com.nyo.domain.common.dto.response.AiTagResponse;
import com.nyo.domain.common.dto.response.NoteTagResponse;
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

    // 노트 본문이 너무 길면 토큰 낭비라 앞부분만 잘라서 보냄
    private static final int MAX_CONTENT_LENGTH = 4000;

    private static final String SYSTEM_PROMPT = """
            너는 개발 학습 노트를 분석해 해시태그를 붙이는 분류기다.
            노트 제목과 본문을 읽고 반드시 아래 JSON 형식으로만 응답해라.
            {"tags": ["태그1", "태그2"], "category": "카테고리명"}
            - tags: 핵심 기술 키워드 3~5개. 각 태그는 50자 이하의 짧은 단어로 작성 (예: "Spring", "JPA", "useEffect")
            - category: "프론트엔드", "백엔드", "CS", "빅데이터" 중 노트 내용에 가장 적합한 것 하나
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

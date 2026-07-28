package com.nyo.domain.chat.service;

import com.nyo.domain.ai.client.OpenAiClient;
import com.nyo.domain.chat.entity.ChatHistory;
import com.nyo.domain.chat.entity.SenderRole;
import com.nyo.domain.chat.repository.ChatHistoryRepository;
import com.nyo.domain.chat.dto.ChatHistoryRequest ;
import com.nyo.domain.chat.dto.ChatHistoryResponse;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatHistoryRepository chatHistoryRepository;
    private final OpenAiClient openAiClient;
    private final JdbcTemplate jdbcTemplate;

    private static final int MAX_NOTES = 3;              // 프롬프트에 넣을 노트 수
    private static final int MAX_NOTE_LENGTH = 8000;     // 노트당 본문 발췌 길이
    private static final int MAX_KEYWORDS = 5;           // LIKE 검색에 쓸 키워드 수

    private static final String SYSTEM_PROMPT = """
            너는 NYO 학습 플랫폼의 복습 챗봇이다.
            아래에 사용자가 직접 작성한 학습 노트 발췌가 제공된다.
            - 노트 내용을 우선 근거로 답변해라.
            - 노트에 없는 내용을 물으면 일반 지식으로 답하되, 노트에 없는 내용임을 밝혀라.
            - 마크다운 형식으로 간결하게 답변해라.

            [사용자 노트 발췌]
            %s""";

    /**
     * 질문을 저장하고, 사용자 노트를 검색해 문맥으로 넣어(RAG) 답변을 생성한 뒤,
     * 답변도 저장해서 반환합니다.
     * AI 호출이 실패해도 질문은 저장된 상태로 남습니다 (재질문 시 문맥으로 활용됨).
     */
    public ChatHistoryResponse chat(Long userId, ChatHistoryRequest request) {
        // 직전 대화는 현재 질문 저장 전에 조회 (질문이 문맥에 중복으로 들어가지 않게)
        List<ChatHistory> recentHistory = findRecentHistory(userId, request.getLectureId());

        chatHistoryRepository.save(ChatHistory.builder()
                .userId(userId)
                .lectureId(request.getLectureId())
                .senderRole(SenderRole.USER)
                .message(request.getMessage())
                .build());

        String noteContext = buildNoteContext(userId, request.getLectureId(), request.getNoteId(), request.getMessage());

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT.formatted(noteContext)));
        for (ChatHistory history : recentHistory) {
            String role = history.getSenderRole() == SenderRole.USER ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", history.getMessage()));
        }
        messages.add(Map.of("role", "user", "content", request.getMessage()));

        String answer = openAiClient.chat(messages);

        ChatHistory saved = chatHistoryRepository.save(ChatHistory.builder()
                .userId(userId)
                .lectureId(request.getLectureId())
                .senderRole(SenderRole.ASSISTANT)
                .message(answer)
                .build());

        return toResponse(saved);
    }

    // 선택 삭제. ids에 남의 기록이 섞여 있어도 본인 것만 지워지고 나머지는 조용히 무시된다.
    @Transactional
    public void deleteBulk(Long userId, List<Long> ids) {
        chatHistoryRepository.deleteByIdInAndUserId(ids, userId);
    }

    @Transactional
    public void deleteAll(Long userId) {
        chatHistoryRepository.deleteAllByUserId(userId);
    }

    public PageResponse<ChatHistoryResponse> getHistories(Long userId, Long lectureId, Pageable pageable) {
        var page = lectureId != null
                ? chatHistoryRepository.findByUserIdAndLectureId(userId, lectureId, pageable)
                : chatHistoryRepository.findByUserId(userId, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    private List<ChatHistory> findRecentHistory(Long userId, Long lectureId) {
        List<ChatHistory> recent = lectureId != null
                ? chatHistoryRepository.findTop6ByUserIdAndLectureIdOrderByIdDesc(userId, lectureId)
                : chatHistoryRepository.findTop6ByUserIdAndLectureIdIsNullOrderByIdDesc(userId);
        Collections.reverse(recent); // 최신순 조회 결과를 시간순으로 뒤집음
        return recent;
    }

    /**
     * 질문 키워드로 사용자 본인 노트를 LIKE 검색하고, 매칭이 없으면 최근 노트로 폴백합니다.
     * noteId가 오면(노트 상세 화면에서 보고 있는 노트) 검색 결과와 무관하게 그 노트를 항상 맨 앞에 넣는다 —
     * "이 노트 설명해줘" 같은 일반적인 질문은 키워드 매칭이 되지 않아 엉뚱한 최근 노트만 잡히기 때문.
     * Note 엔티티(염상환 파트)가 아직 없어서 JdbcTemplate로 읽기 전용 조회.
     * TODO: Elasticsearch 연동(박소현 파트) 후 검색 고도화, Note 엔티티 머지 후 교체 검토
     */
    private String buildNoteContext(Long userId, Long lectureId, Long noteId, String question) {
        List<NoteSnippet> notes = new ArrayList<>();

        if (noteId != null) {
            findNoteById(userId, noteId).ifPresent(notes::add);
        }

        List<String> keywords = extractKeywords(question);
        List<NoteSnippet> searched = searchNotes(userId, lectureId, keywords);
        if (searched.isEmpty()) {
            searched = searchNotes(userId, lectureId, List.of()); // 키워드 매칭 실패 시 최근 노트
        }
        for (NoteSnippet candidate : searched) {
            if (notes.size() >= MAX_NOTES) break;
            if (notes.stream().noneMatch(n -> n.id().equals(candidate.id()))) {
                notes.add(candidate);
            }
        }

        if (notes.isEmpty()) {
            return "(작성된 노트가 없습니다)";
        }

        StringBuilder context = new StringBuilder();
        for (NoteSnippet note : notes) {
            String content = note.content().length() > MAX_NOTE_LENGTH
                    ? note.content().substring(0, MAX_NOTE_LENGTH)
                    : note.content();
            context.append("### ").append(note.title()).append("\n").append(content).append("\n\n");
        }
        return context.toString();
    }

    private Optional<NoteSnippet> findNoteById(Long userId, Long noteId) {
        List<NoteSnippet> result = jdbcTemplate.query(
                "SELECT id, title, content FROM notes WHERE id = ? AND user_id = ? AND is_deleted = 0",
                (rs, rowNum) -> new NoteSnippet(rs.getLong("id"), rs.getString("title"), rs.getString("content")),
                noteId, userId);
        return result.stream().findFirst();
    }

    private List<NoteSnippet> searchNotes(Long userId, Long lectureId, List<String> keywords) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, title, content FROM notes WHERE user_id = ? AND is_deleted = 0");
        List<Object> params = new ArrayList<>(List.of(userId));

        if (lectureId != null) {
            sql.append(" AND lecture_id = ?");
            params.add(lectureId);
        }
        if (!keywords.isEmpty()) {
            List<String> conditions = new ArrayList<>();
            for (String keyword : keywords) {
                conditions.add("(title LIKE ? OR content LIKE ?)");
                params.add("%" + keyword + "%");
                params.add("%" + keyword + "%");
            }
            sql.append(" AND (").append(String.join(" OR ", conditions)).append(")");
        }
        sql.append(" ORDER BY updated_at DESC FETCH FIRST ").append(MAX_NOTES).append(" ROWS ONLY");

        return jdbcTemplate.query(sql.toString(),
                (rs, rowNum) -> new NoteSnippet(rs.getLong("id"), rs.getString("title"), rs.getString("content")),
                params.toArray());
    }

    // 조사가 붙은 채로 끝나는 단어부터 (길이가 긴 조사 우선) 매칭한다.
    // 예: "리액트를" -> "를" 제거 -> "리액트"
    private static final List<String> TRAILING_PARTICLES = List.of(
            "이라는", "라는", "에게서", "에서는", "으로는", "로는", "이나마", "이라도",
            "에게", "에서", "으로", "까지", "부터", "처럼", "만큼", "이나", "라도", "마다", "보다", "이란", "란",
            "을", "를", "이", "가", "은", "는", "의", "에", "로", "와", "과", "도", "만", "나"
    );

    // 질문을 공백 기준으로 잘라 2글자 이상 단어를 키워드로 사용 (LIKE 와일드카드 문자는 제거).
    // 한국어 조사가 그대로 붙어 있으면 노트 본문과 문자열이 달라 LIKE 매칭이 실패하므로,
    // 뒤에 붙은 조사를 잘라내 어근만 남긴다 (어근은 원래 단어의 부분 문자열이라 매칭 범위만 넓어질 뿐 안전하다).
    private List<String> extractKeywords(String question) {
        return Arrays.stream(question.split("\\s+"))
                .map(word -> word.replaceAll("[%_?!.,]", "").trim())
                .map(this::stripTrailingParticle)
                .filter(word -> word.length() >= 2)
                .distinct()
                .limit(MAX_KEYWORDS)
                .toList();
    }

    private String stripTrailingParticle(String word) {
        for (String particle : TRAILING_PARTICLES) {
            if (word.length() > particle.length() + 1 && word.endsWith(particle)) {
                return word.substring(0, word.length() - particle.length());
            }
        }
        return word;
    }

    private ChatHistoryResponse toResponse(ChatHistory history) {
        return ChatHistoryResponse.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .lectureId(history.getLectureId())
                .senderRole(history.getSenderRole().name())
                .message(history.getMessage())
                .createdAt(history.getCreatedAt())
                .build();
    }

    private record NoteSnippet(Long id, String title, String content) {
    }
}

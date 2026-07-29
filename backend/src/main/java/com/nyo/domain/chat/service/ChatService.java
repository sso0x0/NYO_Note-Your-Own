package com.nyo.domain.chat.service;

import com.nyo.domain.ai.client.OpenAiClient;
import com.nyo.domain.chat.entity.ChatHistory;
import com.nyo.domain.chat.entity.SenderRole;
import com.nyo.domain.chat.repository.ChatHistoryRepository;
import com.nyo.domain.chat.dto.ChatHistoryRequest ;
import com.nyo.domain.chat.dto.ChatHistoryResponse;
import com.nyo.domain.note.document.NoteDocument;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.note.repository.NoteSearchRepository;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatHistoryRepository chatHistoryRepository;
    private final OpenAiClient openAiClient;
    private final NoteRepository noteRepository;
    private final NoteSearchRepository noteSearchRepository;

    private static final int MAX_NOTES = 3;              // 프롬프트에 넣을 노트 수
    private static final int MAX_NOTE_LENGTH = 8000;     // 노트당 본문 발췌 길이

    private static final String SYSTEM_PROMPT = """
            너는 NYO 학습 플랫폼의 복습 챗봇이다. 사용자가 자기가 쓴 강의 노트를 복습하도록 돕는 게 목적이다.
            아래 [사용자 노트 발췌]에는 사용자가 직접 작성한 노트가 [### 제목] 형식(마크다운 제목 문법)으로 구분되어 최대 3개까지 주어진다.
            이 "###" 기호는 너에게 노트 구간을 구분해주기 위한 표시일 뿐이니, 답변에서 노트를 언급할 때는 "###"를 빼고 제목 텍스트만 자연스럽게 말해라.
            노트 안에 코드블럭(```)이 있으면 그 코드 내용도 빠짐없이 정확히 읽고 답변에 반영해라.

            - 질문과 관련된 내용이 노트 안에 있으면 그 내용을 근거로 구체적으로 답변해라. 여러 노트 중 어떤 노트를 참고했는지 언급할 때는 제목을 【 】로 감싸서 표기해라 (예: "노트 【리액트 정리】에 따르면...").
            - "노트에 없는 내용"이라는 말은 노트를 다 살펴봐도 정말 관련 내용이 없을 때만, 그것도 딱 한 번만 짧게 언급해라. 노트에 관련 내용이 조금이라도 있으면 이 표현을 쓰지 말고 그 내용부터 근거로 답변해라.
            - 노트 발췌가 (작성된 노트가 없습니다)이면 노트가 아직 없다는 걸 알리고 일반 지식으로 답한 뒤, 관련 내용을 노트로 남겨보라고 자연스럽게 권해라.
            - 굵게(**), 글머리 기호(-) 같은 마크다운 문법을 쓰지 말고 평범한 문장으로 간결하게 답변해라. 답변 화면이 마크다운을 그림으로 바꿔주지 않아서 기호가 글자 그대로 보인다.
            - 답변에서 인용부호가 필요한 모든 경우(변수명·메서드명 강조, 노트 원문 인용 등)에 큰따옴표(")나 백틱(`)은 절대 쓰지 말고 반드시 작은따옴표(')만 써라. 예를 들어 "getUsers"나 `getUsers`가 아니라 'getUsers'라고 써라.
            - 다만 여러 줄짜리 코드를 보여줄 때는 예외로 코드블럭(```)은 그대로 사용해라.
            - 불필요하게 길게 늘어놓지 마라.

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
        // AI가 프롬프트 지시를 안 지키고 큰따옴표/백틱을 섞어 쓰는 경우가 있어, 화면에 보이기 전에
        // 코드로 확실하게 전부 작은따옴표로 바꿔버린다 (프롬프트만으로는 100% 보장이 안 됨).
        answer = answer.replace('"', '\'').replace('`', '\'');

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
     * 질문을 Elasticsearch(nori 형태소 분석)로 검색해 사용자 본인 노트 중 관련도 높은 노트를 찾고,
     * 매칭이 없으면 최근 노트로 폴백합니다.
     * noteId가 오면(노트 상세 화면에서 보고 있는 노트) 검색 결과와 무관하게 그 노트를 항상 맨 앞에 넣는다 —
     * "이 노트 설명해줘" 같은 일반적인 질문은 키워드 매칭이 되지 않아 엉뚱한 최근 노트만 잡히기 때문.
     */
    private String buildNoteContext(Long userId, Long lectureId, Long noteId, String question) {
        List<NoteSnippet> notes = new ArrayList<>();

        if (noteId != null) {
            findNoteById(noteId).ifPresent(notes::add);
        }

        List<NoteSnippet> searched = searchNotes(userId, lectureId, question);
        if (searched.isEmpty()) {
            searched = recentNotes(userId, lectureId); // 검색 매칭 실패 시 최근 노트
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

    // 노트는 어차피 전체 공개 게시물이라, 지금 화면에 띄워 놓고 보고 있는 노트(noteId)라면
    // 작성자가 본인이 아니어도 그 내용을 그대로 참고하게 한다. (아래 searchNotes/recentNotes의
    // 검색·최근 노트 폴백은 "내 노트 복습"용이라 계속 본인 노트로만 제한한다.)
    private Optional<NoteSnippet> findNoteById(Long noteId) {
        return noteRepository.findByIdAndIsDeleted(noteId, 0).map(NoteSnippet::from);
    }

    // 본인 노트만(및 지금 보고 있는 강의로) 범위를 좁혀 질문 문장으로 Elasticsearch 검색한다.
    // 조사가 섞인 문장을 그대로 넘겨도 title/content가 nori 분석기로 색인돼 있어 알아서
    // 형태소 단위로 매칭되므로, LIKE 검색 때처럼 직접 조사를 잘라낼 필요가 없다.
    private List<NoteSnippet> searchNotes(Long userId, Long lectureId, String question) {
        if (!StringUtils.hasText(question)) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, MAX_NOTES);
        Page<NoteDocument> result = lectureId != null
                ? noteSearchRepository.searchByKeywordForUserAndLecture(question, userId, lectureId, pageable)
                : noteSearchRepository.searchByKeywordForUser(question, userId, pageable);
        return result.getContent().stream().map(NoteSnippet::from).toList();
    }

    private List<NoteSnippet> recentNotes(Long userId, Long lectureId) {
        Pageable pageable = PageRequest.of(0, MAX_NOTES, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<Note> page = lectureId != null
                ? noteRepository.findByUserIdAndLectureIdAndIsDeleted(userId, lectureId, 0, pageable)
                : noteRepository.findByUserIdAndIsDeleted(userId, 0, pageable);
        return page.getContent().stream().map(NoteSnippet::from).toList();
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
        static NoteSnippet from(Note note) {
            return new NoteSnippet(note.getId(), note.getTitle(), note.getContent());
        }

        static NoteSnippet from(NoteDocument document) {
            return new NoteSnippet(document.getId(), document.getTitle(), document.getContent());
        }
    }
}

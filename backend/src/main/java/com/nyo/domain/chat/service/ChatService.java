package com.nyo.domain.chat.service;

import com.nyo.domain.ai.client.OpenAiClient;
import com.nyo.domain.category.entity.Category;
import com.nyo.domain.category.repository.CategoryRepository;
import com.nyo.domain.chat.entity.ChatHistory;
import com.nyo.domain.chat.entity.SenderRole;
import com.nyo.domain.chat.repository.ChatHistoryRepository;
import com.nyo.domain.chat.dto.ChatHistoryRequest ;
import com.nyo.domain.chat.dto.ChatHistoryResponse;
import com.nyo.domain.lecture.dto.LectureResponse;
import com.nyo.domain.lecture.entity.Lecture;
import com.nyo.domain.lecture.repository.LectureRepository;
import com.nyo.domain.note.document.NoteDocument;
import com.nyo.domain.note.entity.Note;
import com.nyo.domain.note.repository.NoteRepository;
import com.nyo.domain.note.repository.NoteSearchRepository;
import com.nyo.domain.tag.repository.NoteTagRepository;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatHistoryRepository chatHistoryRepository;
    private final OpenAiClient openAiClient;
    private final NoteRepository noteRepository;
    private final NoteSearchRepository noteSearchRepository;
    private final NoteTagRepository noteTagRepository;
    private final LectureRepository lectureRepository;
    private final CategoryRepository categoryRepository;

    private static final int MAX_NOTES = 3;              // 프롬프트에 넣을 노트 수
    private static final int MAX_NOTE_LENGTH = 8000;     // 노트당 본문 발췌 길이
    private static final int MAX_TOPIC_TAGS = 10;        // 강의 주제 요약에 쓸 태그 수
    private static final int MAX_RECOMMENDED_LECTURES = 5; // 강의 추천 시 보여줄 강의 수
    // 이 중 하나라도 메시지에 있으면 강의 추천 요청으로 본다.
    private static final List<String> RECOMMEND_TRIGGER_KEYWORDS =
            List.of("추천", "들을만한", "들을 만한", "강의 알려줘");

    private static final String SYSTEM_PROMPT = """
            너는 NYO 학습 플랫폼의 복습 챗봇이다. 사용자가 자기가 쓴 강의 노트를 복습하도록 돕는 게 목적이다.
            아래 [사용자 노트 발췌]에는 사용자가 직접 작성한 노트가 [### 제목] 형식(마크다운 제목 문법)으로 구분되어 최대 3개까지 주어진다.
            이 "###" 기호는 너에게 노트 구간을 구분해주기 위한 표시일 뿐이니, 답변에서 노트를 언급할 때는 "###"를 빼고 제목 텍스트만 자연스럽게 말해라.
            노트 내용 뒤에 (※ 노트 내용이 길어 이 뒷부분은 발췌에서 생략됨)이라고 적혀 있으면, 그 노트는 너무 길어서 일부만 잘려 온 것이다. 그걸 노트의 전부인 것처럼 단정하지 말고, 생략된 뒷부분에 대해 물으면 지금 발췌로는 알 수 없다고 밝혀라.
            노트 제목 뒤에 (태그: ...)가 붙어있으면 그건 AI가 그 노트 내용을 분석해 자동으로 추천/등록한 핵심 키워드 태그다. 사용자가 태그가 왜 붙었는지, 무엇을 근거로 뽑혔는지 물으면 노트 본문에서 그 태그와 관련된 구체적인 내용을 찾아 근거로 설명해라.
            노트 안에 코드블럭(```)이 있으면 그 코드 내용도 빠짐없이 정확히 읽고 답변에 반영해라.

            - 너는 프로그래밍/컴퓨터공학 개념 설명, 사용자 노트 복습, AI 추천 태그 관련 질문에만 답한다. "노트 안에 관련 내용이 있는가"가 먼저다 — 노트에 있는 내용이면 과목을 가리지 않고 그 노트를 근거로 답해라. 노트에 없고 프로그래밍/컴퓨터공학·태그와도 무관한 질문(일상 대화, 시사, 감정 상담, 다른 과목 일반 지식 등)에는 "저는 노트 복습이나 프로그래밍 관련 질문에 답하는 챗봇이에요. 그 질문에는 답하기 어려워요."라고만 짧게 답하고 끝내라.
            - 질문과 관련된 내용이 노트 안에 있으면 그 내용을 근거로 구체적으로 답변해라. 여러 노트 중 어떤 노트를 참고했는지 언급할 때는 제목을 【 】로 감싸서 표기해라 (예: "노트 【리액트 정리】에 따르면...").
            - 여러 노트에 서로 다르거나 모순되는 내용이 있으면, 어느 노트에 뭐라고 적혀 있는지 각각 제목을 밝혀 차이를 설명해라. 임의로 하나만 맞다고 단정하지 마라.
            - 태그에는 두 종류가 있다: [사용자 노트 발췌]의 노트 제목 옆 (태그: ...)는 그 노트 하나에 등록된 개별 태그고, [강의 정보]의 "주요 주제"는 이 강의에 달린 모든 사용자 노트를 모아 빈도순으로 뽑은 강의 전체 집계다. 질문이 어느 쪽을 묻는지 구분해서 맞는 출처로 답해라.
            - 노트 내용에 잘못된 개념 설명이나 버그가 있는 코드가 보이면, 그걸 그대로 따라 답하지 말고 어디가 왜 잘못됐는지 짚어주고 올바른 방향을 알려줘라. 복습을 돕는 챗봇이니 오류를 그냥 넘어가기보다 정정해주는 쪽이 학습에 도움이 된다.
            - "노트에 없는 내용"이라는 말은 노트를 다 살펴봐도 정말 관련 내용이 없을 때만, 그것도 딱 한 번만 짧게 언급해라. 노트에 관련 내용이 조금이라도 있으면 이 표현을 쓰지 말고 그 내용부터 근거로 답변해라.
            - 노트 발췌가 (작성된 노트가 없습니다)이면, 질문이 프로그래밍/컴퓨터공학 관련일 때만 노트가 아직 없다는 걸 알리고 일반 지식으로 답한 뒤 관련 내용을 노트로 남겨보라고 권해라. 프로그래밍과 무관한 질문이면 위 범위 제한 규칙대로 답하기 어렵다고 짧게 답해라.
            - 굵게(**), 글머리 기호(-) 같은 마크다운 문법을 쓰지 말고 평범한 문장으로 간결하게 답변해라. 답변 화면이 마크다운을 그림으로 바꿔주지 않아서 기호가 글자 그대로 보인다.
            - 다만 한 문단에 모든 내용을 몰아넣지 말고, 서로 다른 항목(예: 추천 강의 하나하나, 서로 다른 노트 근거, 원인과 해결법 등)마다 실제 줄바꿈으로 문단을 나눠라. 화면이 줄바꿈 문자는 그대로 반영하니, 문단이 나뉘어 있어야 길게 이어진 글보다 읽기 편하다.
            - 답변에서 인용부호가 필요한 모든 경우(변수명·메서드명 강조, 노트 원문 인용 등)에 큰따옴표(")나 백틱(`)은 절대 쓰지 말고 반드시 작은따옴표(')만 써라. 예를 들어 "getUsers"나 `getUsers`가 아니라 'getUsers'라고 써라.
            - 다만 여러 줄짜리 코드를 보여줄 때는 예외로 코드블럭(```)은 그대로 사용해라.
            - 불필요하게 길게 늘어놓지 마라.
            - 답변은 항상 존댓말(-습니다/-해요체)로 해라. 반말을 쓰지 마라.
            - [강의 정보]에는 지금 사용자가 보고 있는 강의의 제목·강사·설명과, 그 강의에 달린 노트들의 태그를 모아 뽑은 주요 주제 목록이 담긴다. "이 강의 뭐에 관한 거야", "어떤 주제들을 다뤄" 같은 강의 전체를 묻는 질문에는 이 정보를 근거로 답해라. 영상 원본 내용까지는 알 수 없으니, 모르는 세부 내용을 지어내지 말고 아는 범위(제목·설명·주제 태그)에서만 답해라.
            - [추천 가능한 강의 목록]이 아래에 있으면 사용자가 강의 추천을 요청한 것이다. 그 목록에 있는 강의 중에서만 골라 제목·강사·좋아요/조회수를 근거로 추천해라. 목록에 없는 강의를 지어내서 추천하지 마라. 이 섹션 자체가 없으면 추천 요청이 아니었다는 뜻이니 신경 쓰지 마라.

            [강의 정보]
            %s

            [사용자 노트 발췌]
            %s
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

        String lectureContext = buildLectureContext(request.getLectureId());
        String noteContext = buildNoteContext(userId, request.getLectureId(), request.getNoteId(), request.getMessage());
        List<Lecture> recommendedLectures = findRecommendedLectures(request.getMessage());
        String recommendationContext = buildLectureRecommendationContext(recommendedLectures);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                SYSTEM_PROMPT.formatted(lectureContext, noteContext, recommendationContext)));
        for (ChatHistory history : recentHistory) {
            String role = history.getSenderRole() == SenderRole.USER ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", history.getMessage()));
        }
        messages.add(Map.of("role", "user", "content", request.getMessage()));

        String answer = openAiClient.chat(messages);
        // AI가 프롬프트 지시를 안 지키고 큰따옴표/백틱을 섞어 쓰는 경우가 있어, 화면에 보이기 전에
        // 코드로 확실하게 전부 작은따옴표로 바꿔버린다 (프롬프트만으로는 100% 보장이 안 됨).
        // 단, 코드블럭(```...```)은 펜스 자체가 백틱이라 통째로 치환하면 코드블럭 렌더링이 깨지므로
        // 코드블럭 바깥 텍스트에만 적용한다.
        answer = sanitizeQuotesOutsideCodeBlocks(answer);

        ChatHistory saved = chatHistoryRepository.save(ChatHistory.builder()
                .userId(userId)
                .lectureId(request.getLectureId())
                .senderRole(SenderRole.ASSISTANT)
                .message(answer)
                .build());

        return toResponse(saved, recommendedLectures);
    }

    // 코드블럭(```...```) 안쪽은 그대로 두고 바깥 텍스트의 큰따옴표/백틱만 작은따옴표로 바꾼다.
    private static final Pattern CODE_BLOCK = Pattern.compile("```.*?```", Pattern.DOTALL);

    private String sanitizeQuotesOutsideCodeBlocks(String answer) {
        Matcher matcher = CODE_BLOCK.matcher(answer);
        StringBuilder result = new StringBuilder();
        int lastEnd = 0;
        while (matcher.find()) {
            result.append(sanitizeQuotes(answer.substring(lastEnd, matcher.start())));
            result.append(matcher.group());
            lastEnd = matcher.end();
        }
        result.append(sanitizeQuotes(answer.substring(lastEnd)));
        return result.toString();
    }

    private String sanitizeQuotes(String text) {
        return text.replace('"', '\'').replace('`', '\'');
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

    // 강의 제목/강사/설명과, 그 강의에 달린 노트들의 태그로 뽑은 주요 주제를 컨텍스트로 만든다.
    // lectureId가 없으면(강의와 연결 안 된 대화) 챗봇이 "강의 정보 없음"으로 알고 넘어가게 한다.
    private String buildLectureContext(Long lectureId) {
        if (lectureId == null) {
            return "(강의와 연결되지 않은 대화입니다)";
        }

        Optional<Lecture> lectureOpt = lectureRepository.findByIdAndIsDeletedFalse(lectureId);
        if (lectureOpt.isEmpty()) {
            return "(강의 정보를 찾을 수 없습니다)";
        }
        Lecture lecture = lectureOpt.get();

        StringBuilder context = new StringBuilder();
        context.append("제목: ").append(lecture.getTitle()).append("\n");
        if (StringUtils.hasText(lecture.getInstructor())) {
            context.append("강사: ").append(lecture.getInstructor()).append("\n");
        }
        if (StringUtils.hasText(lecture.getDescription())) {
            context.append("설명: ").append(lecture.getDescription()).append("\n");
        }

        String topics = topTopicTags(lectureId);
        if (topics != null) {
            context.append("학생들이 노트에 남긴 태그로 본 주요 주제: ").append(topics).append("\n");
        }
        return context.toString();
    }

    // 이 강의에 달린 모든 학습자의 노트(어차피 전체 공개 게시물)에서 태그를 모아 빈도순 상위 N개를 뽑는다.
    // 영상 스크립트가 없어 "이 강의 전체적으로 뭘 다루는지" 물었을 때 학생들이 정리한 태그가
    // 사실상 유일한 주제 신호라, 질문자 본인 노트로 범위를 좁히지 않고 전체 노트를 본다.
    private String topTopicTags(Long lectureId) {
        List<Note> notes = noteRepository.findByLectureIdAndIsDeletedOrderByCreatedAtDesc(lectureId, 0);
        if (notes.isEmpty()) {
            return null;
        }
        List<Long> noteIds = notes.stream().map(Note::getId).toList();
        List<NoteTagRepository.NoteIdTagName> tagRows = noteTagRepository.findTagNamesByNoteIdIn(noteIds);
        if (tagRows.isEmpty()) {
            return null;
        }
        Map<String, Long> frequency = tagRows.stream()
                .collect(Collectors.groupingBy(NoteTagRepository.NoteIdTagName::getTagName, Collectors.counting()));
        return frequency.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(MAX_TOPIC_TAGS)
                .map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));
    }

    // 질문에 추천 관련 키워드가 있을 때만 인기 강의(카테고리 이름이 같이 언급되면 그 카테고리 안에서)를 뽑는다.
    // 해당 없으면 빈 리스트를 반환해 프롬프트에도, 응답의 recommendedLectures에도 아무 것도 안 붙는다.
    private List<Lecture> findRecommendedLectures(String question) {
        if (!StringUtils.hasText(question) || RECOMMEND_TRIGGER_KEYWORDS.stream().noneMatch(question::contains)) {
            return List.of();
        }

        Category matchedCategory = categoryRepository.findAllByOrderByIdAsc().stream()
                .filter(category -> question.contains(category.getName()))
                .findFirst()
                .orElse(null);

        Pageable pageable = PageRequest.of(0, MAX_RECOMMENDED_LECTURES,
                Sort.by(Sort.Direction.DESC, "likeCount").and(Sort.by(Sort.Direction.DESC, "viewCount")));

        return matchedCategory != null
                ? lectureRepository.findByCategoryIdAndIsDeletedFalse(matchedCategory.getId(), pageable).getContent()
                : lectureRepository.findByIsDeletedFalseOrderByLikeCountDescViewCountDesc(pageable);
    }

    // findRecommendedLectures 결과를 프롬프트에 얹을 텍스트로 바꾼다. 빈 리스트면 빈 문자열(섹션 없음).
    private String buildLectureRecommendationContext(List<Lecture> lectures) {
        if (lectures.isEmpty()) {
            return "";
        }

        StringBuilder context = new StringBuilder("\n[추천 가능한 강의 목록]\n");
        for (Lecture lecture : lectures) {
            context.append("- ").append(lecture.getTitle());
            if (StringUtils.hasText(lecture.getInstructor())) {
                context.append(" (강사: ").append(lecture.getInstructor()).append(")");
            }
            context.append(" [").append(lecture.getCategory().getName()).append("]")
                    .append(" 좋아요 ").append(lecture.getLikeCount())
                    .append(", 조회수 ").append(lecture.getViewCount())
                    .append("\n");
        }
        return context.toString();
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
            boolean truncated = note.content().length() > MAX_NOTE_LENGTH;
            String content = truncated ? note.content().substring(0, MAX_NOTE_LENGTH) : note.content();
            List<String> tagNames = noteTagRepository.findTagNamesByNoteId(note.id());
            context.append("### ").append(note.title());
            if (!tagNames.isEmpty()) {
                context.append(" (태그: ").append(String.join(", ", tagNames)).append(")");
            }
            context.append("\n").append(content);
            if (truncated) {
                context.append("\n(※ 노트 내용이 길어 이 뒷부분은 발췌에서 생략됨)");
            }
            context.append("\n\n");
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
        return toResponse(history, List.of());
    }

    // recommendedLectures는 방금 생성한 실시간 응답에만 채워준다 (ChatHistory에 저장되는 값이 아니라서
    // 지난 대화 기록을 다시 불러올 때는 항상 빈 리스트로 나간다).
    private ChatHistoryResponse toResponse(ChatHistory history, List<Lecture> recommendedLectures) {
        return ChatHistoryResponse.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .lectureId(history.getLectureId())
                .senderRole(history.getSenderRole().name())
                .message(history.getMessage())
                .createdAt(history.getCreatedAt())
                .recommendedLectures(recommendedLectures.stream().map(LectureResponse::from).toList())
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

package com.nyo.domain.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nyo.domain.chat.service.ChatService;
import com.nyo.domain.chat.dto.ChatHistoryRequest;
import com.nyo.domain.chat.dto.ChatHistoryResponse;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.response.PageResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Tag(name = "Chat", description = "RAG 학습 챗봇 API")
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    // 스트리밍 응답 처리는 요청을 받은 서블릿 스레드를 곧장 반환해야 해서 별도 스레드에서 돌린다.
    private final Executor chatStreamExecutor = Executors.newCachedThreadPool();

    // 챗봇에 질문하고 동기 방식으로 완성된 답변을 받는다.
    @Operation(summary = "챗봇에게 질문 (사용자 노트 기반 RAG 답변)",
            description = "질문과 답변이 모두 대화 내역으로 저장되고, 답변 메시지가 반환됩니다.")
    @PostMapping
    public ApiResponse<ChatHistoryResponse> chat(
            @Valid @RequestBody ChatHistoryRequest request) {
        return ApiResponse.ok(chatService.chat(SecurityUtil.getCurrentUserId(), request));
    }

    // 챗봇에 질문하고 SSE로 답변을 토큰 단위 스트리밍한다.
    @Operation(summary = "챗봇에게 질문 (스트리밍, SSE)",
            description = "답변을 토큰 단위로 실시간 전송합니다(체감 응답 속도 개선). " +
                    "'chunk' 이벤트가 여러 번 온 뒤, 서버에 저장된 최종 답변(강의 추천 등 포함)이 담긴 'done' 이벤트로 마무리됩니다.")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@Valid @RequestBody ChatHistoryRequest request) {
        // SecurityContext는 스레드 로컬이라 백그라운드 스레드로 넘어가기 전, 요청 스레드에서 먼저 꺼내둔다.
        Long userId = SecurityUtil.getCurrentUserId();
        SseEmitter emitter = new SseEmitter(120_000L);

        chatStreamExecutor.execute(() -> {
            try {
                // data()에 String을 그냥 넘기면 StringHttpMessageConverter가 원문 그대로 써버려서,
                // 델타 안에 개행이 섞이면 SSE 프레임("data: ...\n\n")이 깨지고 프론트의 JSON.parse도 깨진다.
                // ObjectMapper로 직접 JSON 문자열로 인코딩해(개행은 \n으로 이스케이프됨) 그 결과를 보낸다 —
                // 이러면 어떤 컨버터가 실제로 쓰든 최종 바이트는 항상 유효한 한 줄짜리 JSON이 된다.
                ChatHistoryResponse response = chatService.chatStream(userId, request, chunk -> {
                    try {
                        emitter.send(SseEmitter.event().name("chunk").data(objectMapper.writeValueAsString(chunk)));
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                });
                emitter.send(SseEmitter.event().name("done").data(objectMapper.writeValueAsString(response)));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    // 챗봇 대화 내역을 최신순으로 조회한다 (lectureId로 필터 가능).
    @Operation(summary = "챗봇 대화 내역 조회 (최신순, lectureId로 필터 가능)")
    @GetMapping
    public ApiResponse<PageResponse<ChatHistoryResponse>> getHistories(
            @RequestParam(required = false) Long lectureId,
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(chatService.getHistories(SecurityUtil.getCurrentUserId(), lectureId, pageable));
    }

    // 리터럴 경로("/all")가 같은 깊이의 "/{id}" 형태보다 더 구체적이라 Spring이 우선 매칭한다
    @Operation(summary = "대화 기록 전체 삭제", description = "본인의 모든 대화 기록을 삭제합니다.")
    @DeleteMapping("/all")
    public ApiResponse<Void> deleteAll() {
        chatService.deleteAll(SecurityUtil.getCurrentUserId());
        return ApiResponse.ok(null);
    }

    // 선택한 대화 기록만 삭제한다.
    @Operation(summary = "대화 기록 선택 삭제", description = "본인 소유가 아닌 id는 조용히 무시됩니다.")
    @DeleteMapping
    public ApiResponse<Void> deleteBulk(@RequestParam List<Long> ids) {
        chatService.deleteBulk(SecurityUtil.getCurrentUserId(), ids);
        return ApiResponse.ok(null);
    }
}

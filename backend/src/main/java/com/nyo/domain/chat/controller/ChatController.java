package com.nyo.domain.chat.controller;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * userId를 요청 파라미터로 받던 예전 방식(JWT 인증 전 임시 코드)에서
 * PomodoroController 등 다른 컨트롤러와 동일하게 SecurityUtil.getCurrentUserId()로
 * 인증 토큰에서 추출하도록 되돌린 상태. 프론트는 로그인 토큰만 있으면 호출 가능하다.
 */
@Tag(name = "Chat", description = "RAG 학습 챗봇 API")
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @Operation(summary = "챗봇에게 질문 (사용자 노트 기반 RAG 답변)",
            description = "질문과 답변이 모두 대화 내역으로 저장되고, 답변 메시지가 반환됩니다.")
    @PostMapping
    public ApiResponse<ChatHistoryResponse> chat(
            @Valid @RequestBody ChatHistoryRequest request) {
        return ApiResponse.ok(chatService.chat(SecurityUtil.getCurrentUserId(), request));
    }

    @Operation(summary = "챗봇 대화 내역 조회 (최신순, lectureId로 필터 가능)")
    @GetMapping
    public ApiResponse<PageResponse<ChatHistoryResponse>> getHistories(
            @RequestParam(required = false) Long lectureId,
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(chatService.getHistories(SecurityUtil.getCurrentUserId(), lectureId, pageable));
    }
}

package com.nyo.domain.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * OpenAI Chat Completions API 호출 클라이언트.
 * AI 자동 태깅과 RAG 챗봇에서 공용으로 사용합니다.
 * .env에 OPENAI_API_KEY가 있어야 실제 호출이 성공합니다 (없으면 401 → AI_REQUEST_FAILED).
 */
@Slf4j
@Component
public class OpenAiClient {

    private final RestClient restClient;
    private final String model;

    public OpenAiClient(@Value("${openai.api-key:}") String apiKey,
                        @Value("${openai.model:gpt-4o-mini}") String model) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
    }

    /**
     * JSON 형식 응답을 강제(response_format: json_object)하여 질의합니다.
     * systemPrompt에 반드시 "JSON"이라는 단어가 포함되어야 합니다 (OpenAI 정책).
     */
    public String chatJson(String systemPrompt, String userPrompt) {
        return chat(List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)), true);
    }

    /**
     * 멀티턴 대화용. messages는 system 프롬프트를 포함한 전체 메시지 목록.
     * 각 메시지는 {"role": "system|user|assistant", "content": "..."} 형태.
     */
    public String chat(List<Map<String, String>> messages) {
        return chat(messages, false);
    }

    private String chat(List<Map<String, String>> messages, boolean jsonMode) {
        Map<String, Object> body = Map.of(
                "model", model,
                "response_format", Map.of("type", jsonMode ? "json_object" : "text"),
                "messages", messages);

        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String content = response.path("choices").path(0).path("message").path("content").asText();
            if (content.isEmpty()) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }
            return content;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }
}

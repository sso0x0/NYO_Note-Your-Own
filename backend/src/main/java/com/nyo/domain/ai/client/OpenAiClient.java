package com.nyo.domain.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

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
    private final String apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient streamingHttpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public OpenAiClient(@Value("${openai.api-key:}") String apiKey,
                        @Value("${openai.model:gpt-4o}") String model) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.apiKey = apiKey;
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

    /**
     * 멀티턴 대화용 스트리밍 호출. OpenAI가 토큰(델타) 단위로 내려주는 응답을 받는 즉시
     * onDelta로 넘겨(체감 응답 속도 개선) 답변이 완성되면 전체 텍스트를 반환한다.
     * chat()과 달리 RestClient 대신 java.net.http.HttpClient를 써서 응답 바디를 줄 단위 스트림(SSE)으로 읽는다.
     */
    public String chatStream(List<Map<String, String>> messages, Consumer<String> onDelta) {
        Map<String, Object> body = Map.of(
                "model", model,
                "stream", true,
                "messages", messages);

        HttpRequest request;
        try {
            request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        StringBuilder full = new StringBuilder();
        try {
            HttpResponse<java.util.stream.Stream<String>> response =
                    streamingHttpClient.send(request, HttpResponse.BodyHandlers.ofLines());
            if (response.statusCode() != 200) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }
            // OpenAI 스트리밍 응답은 "data: {json}" 줄이 연속으로 오다가 "data: [DONE]"으로 끝난다.
            response.body().forEach(line -> {
                if (!line.startsWith("data: ")) return;
                String data = line.substring(6).trim();
                if (data.equals("[DONE]")) return;
                try {
                    JsonNode node = objectMapper.readTree(data);
                    String delta = node.path("choices").path(0).path("delta").path("content").asText("");
                    if (!delta.isEmpty()) {
                        full.append(delta);
                        onDelta.accept(delta);
                    }
                } catch (Exception ignored) {
                    // 형식이 어긋난 줄(주석성 keep-alive 등)은 건너뛴다.
                }
            });
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenAI 스트리밍 호출 실패", e);
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        if (full.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
        return full.toString();
    }
}

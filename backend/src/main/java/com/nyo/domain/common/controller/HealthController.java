package com.nyo.domain.common.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class HealthController {

    // 프론트-백엔드 연결이 잘 되는지 확인하는 용도의 테스트 API
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "OK",
                "message", "백엔드 연결 성공!",
                "time", LocalDateTime.now()
        );
    }
}
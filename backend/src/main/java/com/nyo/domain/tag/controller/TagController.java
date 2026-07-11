package com.nyo.domain.tag.controller;

import com.nyo.domain.tag.service.TagService;
import com.nyo.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Tag", description = "해시태그 API (스캐폴딩 단계)")
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @Operation(summary = "이 도메인이 어떤 기능을 담당하는지 자기소개")
    @GetMapping("/intro")
    public ApiResponse<String> introduce() {
        return ApiResponse.ok(tagService.introduce());
    }
}

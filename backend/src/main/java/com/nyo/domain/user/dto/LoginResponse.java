package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter @Builder @NoArgsConstructor(access = AccessLevel.PROTECTED) @AllArgsConstructor
@Schema(description = "로그인 응답 DTO")
public class LoginResponse {

    @Schema(description = "JWT Access Token")
    private String accessToken;

    @Schema(description = "회원 PK", example = "1")
    private Long userId;

    @Schema(example = "길동이")
    private String nickname;

    @Schema(example = "USER")
    private String role;
}
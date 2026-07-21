package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter @Builder @NoArgsConstructor(access = AccessLevel.PROTECTED) @AllArgsConstructor
// 아이디/비밀번호 로그인 성공 응답. 구글 로그인은 이 DTO 대신 OAuth2SuccessHandler가 프론트로 리다이렉트하며 토큰을 전달
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
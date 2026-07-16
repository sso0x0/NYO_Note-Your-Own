package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
// POST /api/users/login 요청 바디 (아이디/비밀번호 로그인 전용, 구글 로그인은 이 DTO를 거치지 않음)
@Schema(description = "로그인 요청 DTO")
public class LoginRequest {

    @NotBlank(message = "로그인 아이디는 필수입니다.")
    private String loginId;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
}
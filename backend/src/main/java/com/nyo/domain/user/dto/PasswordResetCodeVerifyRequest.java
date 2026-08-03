package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// POST /api/users/password/verify-code 요청 바디. 최종 재설정 전에 인증코드가 맞는지 미리 확인시켜주는 용도.
@Schema(description = "비밀번호 재설정 인증코드 확인 요청 DTO")
public class PasswordResetCodeVerifyRequest {

    @NotBlank(message = "아이디는 필수입니다.")
    private String loginId;

    @NotBlank(message = "휴대폰 번호는 필수입니다.")
    @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다.")
    private String phone;

    // sendPasswordResetCode로 발송된 6자리 인증코드
    @NotBlank(message = "인증코드는 필수입니다.")
    private String code;
}
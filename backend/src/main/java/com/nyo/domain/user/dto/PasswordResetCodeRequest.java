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
// POST /api/users/password/send-code 요청 바디. 아이디+휴대폰 번호가 일치하는 회원에게 SMS 인증코드를 발송한다.
@Schema(description = "비밀번호 재설정 인증코드 발송 요청 DTO")
public class PasswordResetCodeRequest {

    @NotBlank(message = "아이디는 필수입니다.")
    @Schema(example = "nyo_user01")
    private String loginId;

    @NotBlank(message = "휴대폰 번호는 필수입니다.")
    @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다.")
    @Schema(example = "010-1234-5678")
    private String phone;
}
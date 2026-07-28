package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "비밀번호 재설정 인증코드 발송 요청 DTO")
public class PasswordResetCodeRequest {

    @NotBlank(message = "아이디는 필수입니다.")
    @Schema(example = "nyo_user01")
    private String loginId;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Schema(example = "user@example.com")
    private String email;
}

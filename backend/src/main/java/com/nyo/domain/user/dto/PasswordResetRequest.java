package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "비밀번호 재설정 요청 DTO. 이메일로 받은 인증코드와 새 비밀번호를 함께 제출한다.")
public class PasswordResetRequest {

    @NotBlank(message = "아이디는 필수입니다.")
    @Schema(example = "nyo_user01")
    private String loginId;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Schema(example = "user@example.com")
    private String email;

    @NotBlank(message = "인증코드는 필수입니다.")
    @Schema(description = "이메일로 발송된 6자리 인증코드", example = "123456")
    private String code;

    // 💡 UserRequest.password와 동일 규칙(BCrypt 72바이트 한계)
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Size(min = 8, max = 72, message = "새 비밀번호는 8자 이상 72자 이하로 입력해주세요.")
    @Schema(example = "N3wP@ssw0rd")
    private String newPassword;
}

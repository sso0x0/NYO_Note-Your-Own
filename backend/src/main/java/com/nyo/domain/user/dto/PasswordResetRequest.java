package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// POST /api/users/password/reset 요청 바디. 인증코드를 다시 검증한 뒤 새 비밀번호로 교체한다.
@Schema(description = "비밀번호 재설정 요청 DTO. 문자로 받은 인증코드와 새 비밀번호를 함께 제출한다.")
public class PasswordResetRequest {

    @NotBlank(message = "아이디는 필수입니다.")
    @Schema(example = "nyo_user01")
    private String loginId;

    @NotBlank(message = "휴대폰 번호는 필수입니다.")
    @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다.")
    @Schema(example = "010-1234-5678")
    private String phone;

    @NotBlank(message = "인증코드는 필수입니다.")
    @Schema(description = "문자로 발송된 6자리 인증코드", example = "123456")
    private String code;

    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Size(min = 8, max = 72, message = "새 비밀번호는 8자 이상 72자 이하로 입력해주세요.")
    @Schema(example = "N3wP@ssw0rd")
    private String newPassword;
}
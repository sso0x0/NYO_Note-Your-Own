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
// POST /api/users/me/phone/send-code 요청 바디. 마이페이지에서 전화번호를 바꾸려는 새 번호로 인증코드를 발송한다.
@Schema(description = "마이페이지 - 전화번호 변경 인증코드 발송 요청 DTO")
public class PhoneVerificationSendRequest {

    @NotBlank(message = "휴대폰 번호는 필수입니다.")
    @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다.")
    @Schema(description = "인증코드를 받을 새 휴대폰 번호", example = "010-1234-5678")
    private String phone;
}

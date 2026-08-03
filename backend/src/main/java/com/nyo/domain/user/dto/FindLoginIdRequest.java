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
// POST /api/users/find-id 요청 바디. 이름+이메일이 일치하는지 확인해서 아이디를 찾아준다.
@Schema(description = "아이디 찾기 요청 DTO")
public class FindLoginIdRequest {

    @NotBlank(message = "이름은 필수입니다.")
    @Schema(description = "가입 시 입력한 이름", example = "홍길동")
    private String name;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Schema(description = "가입 시 입력한 이메일", example = "user@example.com")
    private String email;
}

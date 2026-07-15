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
@Schema(description = "관리자 - 회원 권한 변경 요청 DTO")
public class UserRoleUpdateRequest {

    @NotBlank(message = "권한은 필수입니다.")
    @Pattern(regexp = "USER|ADMIN", message = "권한은 USER 또는 ADMIN이어야 합니다.")
    @Schema(example = "ADMIN")
    private String role;
}
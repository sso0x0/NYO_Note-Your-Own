package com.nyo.domain.user.dto;

import com.nyo.global.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
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

    // 💡 FIXED: String + @Pattern → Role enum
    @NotNull(message = "권한은 필수입니다.")
    @Schema(example = "ADMIN")
    private Role role;
}
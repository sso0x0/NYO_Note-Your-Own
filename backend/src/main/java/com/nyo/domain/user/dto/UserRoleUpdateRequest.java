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
// PATCH /api/admin/users/{userId}/role 요청 바디. 자기 자신에게는 사용 불가(UserService.adminChangeRole에서 차단)
@Schema(description = "관리자 - 회원 권한 변경 요청 DTO")
public class UserRoleUpdateRequest {

    // 💡 FIXED: String + @Pattern → Role enum
    @NotNull(message = "권한은 필수입니다.")
    @Schema(example = "ADMIN")
    private Role role;
}
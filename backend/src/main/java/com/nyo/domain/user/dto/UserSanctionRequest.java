package com.nyo.domain.user.dto;

import com.nyo.global.enums.SanctionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관리자 제재 등록 요청 DTO (adminId는 인증 정보에서 추출)")
public class UserSanctionRequest {

    @NotNull(message = "제재 대상 회원 ID는 필수입니다.")
    @Schema(description = "제재 대상 회원 FK", example = "10")
    private Long userId;

    // 💡 FIXED: String + @Pattern → enum (Jackson이 "SUSPENSION" 문자열을 자동으로 enum에 매핑해줘서
    // 잘못된 값이 오면 @Pattern 검증 전에 아예 400으로 먼저 걸러짐)
    @NotNull(message = "제재 유형은 필수입니다.")
    @Schema(description = "경고/정지/강제 탈퇴", example = "SUSPENSION")
    private SanctionType type;

    @NotBlank(message = "제재 사유는 필수입니다.")
    @Size(max = 500)
    @Schema(description = "제재 처리 사유", example = "커뮤니티 이용 규칙 위반")
    private String reason;

    @Schema(description = "정지 해제 예정일 (WARNING의 경우 null 가능)")
    private LocalDateTime endAt;
}
package com.nyo.domain.user.dto;

import com.nyo.global.enums.SanctionType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "회원 제재 이력 응답 DTO")
public class UserSanctionResponse {

    @Schema(description = "제재 이력 PK", example = "1")
    private Long id;

    @Schema(description = "제재 대상 회원 FK", example = "10")
    private Long userId;

    @Schema(description = "제재를 처리한 관리자 FK", example = "1")
    private Long adminId;

    // 💡 FIXED: String → SanctionType (UserSanction 엔티티가 이미 enum으로 바뀌어서 여기도 맞춰야 함)
    @Schema(description = "경고/정지/강제 탈퇴", example = "SUSPENSION")
    private SanctionType type;

    @Schema(description = "제재 처리 사유", example = "커뮤니티 이용 규칙 위반")
    private String reason;

    @Schema(description = "제재 적용 시작일")
    private LocalDateTime startAt;

    @Schema(description = "정지 해제 예정일")
    private LocalDateTime endAt;

    @Schema(description = "레코드 생성일")
    private LocalDateTime createdAt;
}
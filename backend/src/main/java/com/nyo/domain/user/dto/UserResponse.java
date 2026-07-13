package com.nyo.domain.user.dto;

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
@Schema(description = "회원 정보 응답 DTO")
public class UserResponse {

    @Schema(description = "회원 고유 PK", example = "1")
    private Long id;

    @Schema(description = "로그인 아이디", example = "nyo_user01")
    private String loginId;

    @Schema(description = "사용자 본명", example = "홍길동")
    private String name;

    @Schema(description = "닉네임", example = "길동이")
    private String nickname;

    @Schema(description = "이메일", example = "user@example.com")
    private String email;

    @Schema(description = "전화번호", example = "010-1234-5678")
    private String phone;

    @Schema(description = "사용자/관리자 구분", example = "USER")
    private String role;

    @Schema(description = "정상/정지/탈퇴 구분", example = "ACTIVE")
    private String status;

    @Schema(description = "소셜 로그인 제공자", example = "NONE")
    private String oauthProvider;

    @Schema(description = "탈퇴 일시")
    private LocalDateTime withdrawnAt;

    @Schema(description = "회원 가입일")
    private LocalDateTime createdAt;

    @Schema(description = "프로필 수정일")
    private LocalDateTime updatedAt;
}

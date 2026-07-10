package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
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
@Schema(description = "회원가입 / 회원정보 수정 요청 DTO")
public class UserRequest {

    @NotBlank(message = "로그인 아이디는 필수입니다.")
    @Size(min = 4, max = 50, message = "로그인 아이디는 4자 이상 50자 이하로 입력해주세요.")
    @Schema(description = "로그인 아이디", example = "nyo_user01")
    private String loginId;

    @Size(min = 8, max = 255, message = "비밀번호는 8자 이상으로 입력해주세요.")
    @Schema(description = "비밀번호 (소셜 로그인 회원은 null 가능)", example = "P@ssw0rd123")
    private String password;

    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 50)
    @Schema(description = "사용자 본명", example = "홍길동")
    private String name;

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(max = 50)
    @Schema(description = "닉네임", example = "길동이")
    private String nickname;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Schema(description = "이메일", example = "user@example.com")
    private String email;

    @Pattern(regexp = "^01[016789]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
    @Schema(description = "전화번호", example = "010-1234-5678")
    private String phone;

    @Pattern(regexp = "NONE|GOOGLE|KAKAO|INSTAGRAM", message = "지원하지 않는 소셜 로그인 제공자입니다.")
    @Schema(description = "소셜 로그인 제공자", example = "NONE", defaultValue = "NONE")
    private String oauthProvider;

    @Schema(description = "소셜 로그인 API 고유 ID값")
    private String oauthId;
}

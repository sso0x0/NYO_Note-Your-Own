package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// PUT /api/users/me 요청 바디 (본인 정보 수정, JWT로 본인 확인 - userId는 바디가 아닌 토큰에서 추출)
// currentPassword는 이제 무엇을 고치든(닉네임/이메일/전화번호/비밀번호) 항상 채워서 보내야 한다.
// (소셜 로그인 회원은 password가 없어 UserService.updateMyProfile에서 이 검사 자체를 건너뜀)
// newPassword는 비밀번호까지 같이 바꿀 때만 채우는 선택 항목이고,
// phoneVerificationCode는 phone 값이 실제로 바뀌었을 때만 필요하다.
@Schema(description = "마이페이지 - 개인정보(+ 선택적 비밀번호) 수정 요청 DTO")
public class UserProfileUpdateRequest {

    @NotBlank(message = "이름은 필수입니다.")
    @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하로 입력해주세요.")
    @Schema(example = "홍길동")
    private String name;

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하로 입력해주세요.")
    @Schema(example = "길동이")
    private String nickname;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Size(max = 100)
    @Schema(example = "user@example.com")
    private String email;

    @Pattern(regexp = "^01[016789]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
    @Schema(example = "010-1234-5678")
    private String phone;

    // phone이 기존 값과 다를 때만 검사됨 (PhoneVerificationCodeStore.verify)
    @Schema(description = "전화번호 변경 시 필요한 SMS 인증코드 (전화번호를 바꾸지 않으면 비워둠)")
    private String phoneVerificationCode;

    @Schema(description = "현재 비밀번호 (일반 계정은 정보 수정 시 항상 필수)")
    private String currentPassword;

    // newPassword는 선택 항목이라 @Size를 붙이지 않는다. "" 같은 빈 문자열도 유효성 검사에서 막히지 않고
    // 그대로 통과시켜서, UserService에서 "비밀번호를 안 바꾸려는 요청"으로 정상 처리할 수 있게 한다.
    // 실제로 값이 있을 때의 길이 검사는 UserService.changePassword에서 한다.
    @Schema(description = "새 비밀번호 (바꾸지 않으면 비워둠)")
    private String newPassword;

    // 아이디는 여기서 안 받음 (아이디 변경 불가)
}
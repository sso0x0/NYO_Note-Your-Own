package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// PUT /api/users/me 요청 바디 (본인 정보 수정, JWT로 본인 확인 - userId는 바디가 아닌 토큰에서 추출)
// currentPassword/newPassword는 비밀번호를 같이 바꿀 때만 채워서 보내면 되는 선택 항목이다.
// (소셜 로그인 회원은 password가 없어 UserService.updateMyProfile에서 변경 자체를 차단함)
@Schema(description = "마이페이지 - 개인정보(+ 선택적 비밀번호) 수정 요청 DTO")
public class UserProfileUpdateRequest {

    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 50)
    @Schema(example = "홍길동")
    private String name;

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(max = 50)
    @Schema(example = "길동이")
    private String nickname;

    @Pattern(regexp = "^01[016789]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
    @Schema(example = "010-1234-5678")
    private String phone;

    @Schema(description = "현재 비밀번호 (비밀번호를 바꿀 때만 입력, 그 외에는 비워둠)")
    private String currentPassword;

    // newPassword는 선택 항목이라 @Size를 붙이지 않는다. "" 같은 빈 문자열도 유효성 검사에서 막히지 않고
    // 그대로 통과시켜서, UserService에서 "비밀번호를 안 바꾸려는 요청"으로 정상 처리할 수 있게 한다.
    // 실제로 값이 있을 때의 길이 검사는 UserService.changePassword에서 한다.
    @Schema(description = "새 비밀번호 (바꾸지 않으면 비워둠)")
    private String newPassword;

    // 💡 아이디/이메일은 여기서 안 받음 (아이디 변경 불가)
}
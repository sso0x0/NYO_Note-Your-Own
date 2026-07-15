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
@Schema(description = "마이페이지 - 개인정보 수정 요청 DTO")
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

    // 💡 아이디/이메일/비밀번호는 여기서 안 받음 (아이디 변경 불가, 비밀번호는 별도 API로 분리하는 게 정석)
}
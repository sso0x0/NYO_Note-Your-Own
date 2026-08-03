package com.nyo.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// findLoginId 결과 응답. 로그인 아이디를 그대로 노출하지 않고 마스킹해서 반환한다.
@Schema(description = "아이디 찾기 응답 DTO. 보안상 아이디 전체가 아닌 마스킹된 값만 내려준다.")
public class FindLoginIdResponse {

    @Schema(description = "일부를 마스킹한 로그인 아이디", example = "nyo*******")
    private String maskedLoginId;
}

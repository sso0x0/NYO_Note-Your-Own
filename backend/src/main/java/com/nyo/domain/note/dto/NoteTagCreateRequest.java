package com.nyo.domain.note.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
// 작성자가 노트에 태그명을 직접 입력해 추가할 때 사용하는 요청 DTO
@Schema(description = "노트에 태그를 수동으로 추가할 때 사용하는 요청 DTO (작성자가 직접 태그명을 입력)")
public class NoteTagCreateRequest {

    @NotBlank(message = "태그 이름은 필수입니다.")
    @Schema(description = "추가할 태그명. 이미 있는 이름이면 기존 태그에 매핑하고, 없으면 새로 만든다.", example = "TypeScript")
    private String name;
}

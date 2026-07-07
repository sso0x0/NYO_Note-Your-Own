package com.nyo.global.enums;

/**
 * 회원 권한. Member 엔티티(오찬빈)뿐 아니라
 * 강의 등록 권한 체크(박소현), 게시물 삭제 권한 체크(염상환)에서도 같이 참조합니다.
 * 나중에 @PreAuthorize("hasRole('ADMIN')") 형태로 쓰게 되면 Spring Security 규칙상
 * "ROLE_" 접두사가 자동으로 붙는 걸 감안해서 이름은 접두사 없이 둡니다.
 */
public enum Role {
    USER,
    ADMIN
}

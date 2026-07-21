package com.nyo.global.enums;

/**
 * 관리자가 회원에게 내리는 제재 종류.
 * UserService.applySanctionEffect()에서 이 값에 따라 User.status를 실제로 바꾼다.
 */
public enum SanctionType {
    WARNING,    // 경고. 회원 상태는 그대로 두고 이력만 남김 (로그인 등 이용에 제약 없음)
    SUSPENSION, // 정지. User.status를 SUSPENDED로 변경, endAt까지 로그인 불가 (endAt이 null이면 무기한 정지)
    WITHDRAWAL  // 강제 탈퇴. User.status를 WITHDRAWN으로 변경 (회원 스스로 탈퇴하는 것과 동일한 효과)
}
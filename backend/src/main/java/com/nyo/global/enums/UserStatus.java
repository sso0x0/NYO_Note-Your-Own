package com.nyo.global.enums;

/**
 * 회원 계정 상태.
 * User.status 컬럼에 저장되며, 로그인 가능 여부를 결정하는 기준이 된다.
 * (UserService.login() / validateActiveOrReactivate()에서 이 값을 검사함)
 */
public enum UserStatus {
    ACTIVE,     // 정상. 로그인 및 모든 API 이용 가능
    SUSPENDED,  // 관리자가 정지시킨 상태. 정지 기간(UserSanction.endAt)이 지나면 로그인 시점에 자동으로 ACTIVE로 복구됨
    WITHDRAWN   // 회원 탈퇴(소프트 딜리트). row는 남지만 로그인 불가, 작성 글은 "탈퇴한 사용자"로 표시됨
}
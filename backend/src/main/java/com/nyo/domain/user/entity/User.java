package com.nyo.domain.user.entity;

import com.nyo.global.enums.Role;
import com.nyo.global.enums.UserStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 회원 엔티티.
 * 일반 회원가입(loginId/password)과 구글 OAuth 가입(oauthProvider/oauthId) 둘 다 이 테이블에 저장된다.
 * OAuth 가입 회원은 password가 null이라 일반 로그인은 불가하고 구글 로그인으로만 인증 가능하다.
 * status(UserStatus)로 정지/탈퇴 여부를 관리하며 row 자체는 삭제하지 않는다(소프트 딜리트).
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String loginId;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    // 💡 FIXED: String → enum. @Enumerated(STRING)이라 DB 컬럼(VARCHAR)엔 "USER"/"ADMIN" 그대로 저장되어
    // 기존 데이터 마이그레이션 없이 호환됩니다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    private String oauthProvider;
    private String oauthId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime withdrawnAt;

    @Builder
    public User(String loginId, String password, String name, String nickname, String email, String phone, Role role, UserStatus status) {
        this.loginId = loginId;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.phone = phone;
        this.role = role != null ? role : Role.USER;
        this.status = status != null ? status : UserStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 구글 로그인 최초 가입 시 사용하는 생성자. password를 null로 두어 일반 로그인(아이디/비번)은 불가능하게 만든다.
    public static User createOauthUser(String loginId, String name, String nickname, String email,
                                       String oauthProvider, String oauthId) {
        User user = User.builder()
                .loginId(loginId)
                .password(null)
                .name(name)
                .nickname(nickname)
                .email(email)
                .build();
        user.oauthProvider = oauthProvider;
        user.oauthId = oauthId;
        return user;
    }

    // 로컬 가입 계정에 구글 로그인을 연동할 때 사용. 이메일이 검증된 경우에만 호출된다(CustomOAuth2UserService 참고).
    public void linkOauth(String oauthProvider, String oauthId) {
        this.oauthProvider = oauthProvider;
        this.oauthId = oauthId;
        this.updatedAt = LocalDateTime.now();
    }

    // 마이페이지에서 이름/닉네임/전화번호 수정 (아이디·이메일·비밀번호는 여기서 변경 불가)
    public void updateProfile(String name, String nickname, String phone) {
        this.name = name;
        this.nickname = nickname;
        this.phone = phone;
        this.updatedAt = LocalDateTime.now();
    }

    // 회원 탈퇴(소프트 딜리트) - status만 WITHDRAWN으로 바꾸고 row는 유지. 회원가입/관리자 강제탈퇴 양쪽에서 공용으로 사용
    public void withdraw() {
        this.status = UserStatus.WITHDRAWN;
        this.withdrawnAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 마이페이지 비밀번호 변경 (UserService.updatePassword) - 인코딩은 호출하는 쪽에서 끝내고 결과만 저장
    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
        this.updatedAt = LocalDateTime.now();
    }

    // 관리자가 USER ↔ ADMIN 권한을 변경할 때 사용 (UserService.adminChangeRole)
    // 💡 FIXED: 파라미터 타입 String → Role
    public void changeRole(Role role) {
        this.role = role;
        this.updatedAt = LocalDateTime.now();
    }

    // 정지/정지해제 등 상태 전환에 사용 (UserService.applySanctionEffect, reactivateIfSuspensionExpired)
    // 💡 FIXED: 파라미터 타입 String → UserStatus
    public void changeStatus(UserStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}
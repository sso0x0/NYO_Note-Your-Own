package com.nyo.domain.user.entity; // 💡 주의: 현재 폴더명이 entiy로 되어있어 그대로 맞췄습니다!

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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

    // 💡 FIXED: 소셜 로그인 회원은 비밀번호가 없을 수 있어서 nullable = false → true로 변경
    @Column(nullable = true)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    private String role;      // USER, ADMIN
    private String status;    // ACTIVE, WITHDRAWN

    private String oauthProvider;
    private String oauthId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 💡 추가: UserResponse엔 이미 있던 필드인데 엔티티에 컬럼이 없어서 못 채우고 있었음
    private LocalDateTime withdrawnAt;

    @Builder
    public User(String loginId, String password, String name, String nickname, String email, String phone, String role, String status) {
        this.loginId = loginId;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.phone = phone;
        this.role = role != null ? role : "USER";
        this.status = status != null ? status : "ACTIVE";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 💡 추가: 구글 OAuth2 최초 로그인 시 자동 회원가입용 (일반 회원가입과 생성 경로 분리)
    // 일반 @Builder는 oauthProvider/oauthId를 안 받는 구조라 별도 정적 팩토리로 뺐습니다.
    public static User createOauthUser(String loginId, String name, String nickname, String email,
                                       String oauthProvider, String oauthId) {
        User user = User.builder()
                .loginId(loginId)
                .password(null) // 소셜 로그인은 비밀번호 없음
                .name(name)
                .nickname(nickname)
                .email(email)
                .build();
        user.oauthProvider = oauthProvider;
        user.oauthId = oauthId;
        return user;
    }

    // 💡 1. 회원 정보 수정 메서드
    public void updateProfile(String name, String nickname, String phone) {
        this.name = name;
        this.nickname = nickname;
        this.phone = phone;
        this.updatedAt = LocalDateTime.now();
    }

    // 💡 FIXED: withdraw()가 두 군데 중복 정의돼있던 걸 하나로 합침 (탈퇴 시각까지 기록)
    public void withdraw() {
        this.status = "WITHDRAWN";
        this.withdrawnAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 💡 3. [관리자용] 회원 권한 변경 메서드
    public void changeRole(String role) {
        this.role = role;
        this.updatedAt = LocalDateTime.now();
    }

    // 💡 4. [관리자용] 회원 상태 변경 (ACTIVE, SUSPENDED(정지), WITHDRAWN(강제탈퇴))
    public void changeStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}
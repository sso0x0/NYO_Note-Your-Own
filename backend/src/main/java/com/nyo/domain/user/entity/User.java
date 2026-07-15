package com.nyo.domain.user.entity;

import com.nyo.global.enums.Role;
import com.nyo.global.enums.UserStatus;
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

    public void updateProfile(String name, String nickname, String phone) {
        this.name = name;
        this.nickname = nickname;
        this.phone = phone;
        this.updatedAt = LocalDateTime.now();
    }

    public void withdraw() {
        this.status = UserStatus.WITHDRAWN;
        this.withdrawnAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 💡 FIXED: 파라미터 타입 String → Role
    public void changeRole(Role role) {
        this.role = role;
        this.updatedAt = LocalDateTime.now();
    }

    // 💡 FIXED: 파라미터 타입 String → UserStatus
    public void changeStatus(UserStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}
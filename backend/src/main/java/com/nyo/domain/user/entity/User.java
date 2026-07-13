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

    @Column(nullable = false)
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

    // 💡 1. 회원 정보 수정 메서드 (누락되었던 부분 추가)
    public void updateProfile(String name, String nickname, String phone) {
        this.name = name;
        this.nickname = nickname;
        this.phone = phone;
        this.updatedAt = LocalDateTime.now(); // 수정일자 업데이트
    }

    // 💡 2. 회원 탈퇴(소프트 딜리트) 처리 메서드 (괄호 안쪽으로 정상 배치)
    public void withdraw() {
        this.status = "WITHDRAWN"; // 상태를 '탈퇴'로 변경
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
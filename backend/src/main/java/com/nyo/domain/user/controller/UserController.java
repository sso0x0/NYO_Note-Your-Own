package com.nyo.domain.user.controller;

import com.nyo.domain.user.dto.LoginRequest;
import com.nyo.domain.user.dto.LoginResponse;
import com.nyo.domain.user.dto.UserProfileUpdateRequest;
import com.nyo.domain.user.dto.UserRequest;
import com.nyo.domain.user.dto.UserResponse;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "회원 인증 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "이 도메인이 어떤 기능을 담당하는지 자기소개")
    @GetMapping("/intro")
    public ApiResponse<String> introduce() {
        return ApiResponse.ok(userService.introduce());
    }

    // 💡 회원가입: 아이디/이메일/닉네임 중복이면 Service에서 예외 발생
    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ApiResponse<UserResponse> signup(@Valid @RequestBody UserRequest request) {
        return ApiResponse.ok(userService.signup(request));
    }

    // 💡 로그인: 성공 시 JWT accessToken 반환
    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(userService.login(request));
    }

    // 💡 회원가입 폼에서 아이디 입력 후 포커스 아웃 시 실시간 체크용
    @Operation(summary = "로그인 아이디 중복 체크")
    @GetMapping("/check-login-id")
    public ApiResponse<Boolean> checkLoginId(@RequestParam String loginId) {
        return ApiResponse.ok(userService.checkLoginIdDuplicate(loginId));
    }

    @Operation(summary = "이메일 중복 체크")
    @GetMapping("/check-email")
    public ApiResponse<Boolean> checkEmail(@RequestParam String email) {
        return ApiResponse.ok(userService.checkEmailDuplicate(email));
    }

    @Operation(summary = "닉네임 중복 체크")
    @GetMapping("/check-nickname")
    public ApiResponse<Boolean> checkNickname(@RequestParam String nickname) {
        return ApiResponse.ok(userService.checkNicknameDuplicate(nickname));
    }

    // 💡 추가: 마이페이지 - 내 정보 조회 (JWT 없으면 SecurityConfig에서 401 처리됨)
    @Operation(summary = "마이페이지 - 내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyInfo() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(userService.getMyInfo(userId));
    }

    // 💡 추가: 마이페이지 - 개인정보 수정 (이름/닉네임/전화번호)
    @Operation(summary = "마이페이지 - 개인정보 수정")
    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMyProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(userService.updateMyProfile(userId, request));
    }

    // 💡 추가: 회원 탈퇴 (소프트 딜리트, 노트는 유지)
    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw() {
        Long userId = SecurityUtil.getCurrentUserId();
        userService.withdraw(userId);
        return ApiResponse.ok(null);
    }
}
package com.nyo.domain.user.controller;

import com.nyo.domain.user.dto.FindLoginIdRequest;
import com.nyo.domain.user.dto.FindLoginIdResponse;
import com.nyo.domain.user.dto.LoginRequest;
import com.nyo.domain.user.dto.LoginResponse;
import com.nyo.domain.user.dto.PasswordResetCodeRequest;
import com.nyo.domain.user.dto.PasswordResetRequest;
import com.nyo.domain.user.dto.UserProfileUpdateRequest;
import com.nyo.domain.user.dto.UserRequest;
import com.nyo.domain.user.dto.UserResponse;
import com.nyo.domain.user.dto.UserSanctionResponse;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.nyo.domain.user.dto.PasswordResetCodeVerifyRequest;

/**
 * 일반 회원용 API. 전부 본인 관련 기능만 다루며(마이페이지 등), 다른 회원 정보 조회/수정은 불가능하다.
 * signup/login/check-* 는 SecurityConfig에서 permitAll로 열려있고, 나머지(/me)는 JWT 인증 필요.
 * 관리자 전용 회원 관리 기능은 AdminUserController 참고.
 */
@Tag(name = "User", description = "회원 인증 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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

    // 💡 아이디 찾기: 이름+이메일 일치 확인 후 마스킹된 아이디 반환
    @Operation(summary = "아이디 찾기")
    @PostMapping("/find-id")
    public ApiResponse<FindLoginIdResponse> findLoginId(@Valid @RequestBody FindLoginIdRequest request) {
        return ApiResponse.ok(userService.findLoginId(request));
    }

    // 💡 비밀번호 찾기 1단계: 아이디+이메일 확인 후 이메일로 6자리 인증코드 발송
    @Operation(summary = "비밀번호 재설정 인증코드 발송")
    @PostMapping("/password/send-code")
    public ApiResponse<Void> sendPasswordResetCode(@Valid @RequestBody PasswordResetCodeRequest request) {
        userService.sendPasswordResetCode(request);
        return ApiResponse.ok();
    }
    // 💡 비밀번호 찾기 1.5단계: 최종 제출 전에 인증코드가 맞는지 미리 확인
    @Operation(summary = "비밀번호 재설정 인증코드 확인")
    @PostMapping("/password/verify-code")
    public ApiResponse<Void> verifyPasswordResetCode(@Valid @RequestBody PasswordResetCodeVerifyRequest request) {
        userService.verifyPasswordResetCode(request);
        return ApiResponse.ok();
    }


    // 💡 비밀번호 찾기 2단계: 인증코드 검증 후 새 비밀번호로 교체
    @Operation(summary = "비밀번호 재설정")
    @PostMapping("/password/reset")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        userService.resetPassword(request);
        return ApiResponse.ok();
    }

    // 💡 추가: 마이페이지 - 내 정보 조회 (JWT 없으면 SecurityConfig에서 401 처리됨)
    @Operation(summary = "마이페이지 - 내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyInfo() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(userService.getMyInfo(userId));
    }

    // 로그인 후 최초 한 번만 미확인 경고 사유를 반환하며, 반환과 동시에 확인 처리합니다.
    @Operation(summary = "미확인 경고 조회 및 확인")
    @PostMapping("/me/warnings/latest/acknowledge")
    public ApiResponse<UserSanctionResponse> acknowledgeLatestWarning() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(userService.acknowledgeLatestWarning(userId));
    }

    // 💡 추가: 마이페이지 - 개인정보 수정 (이름/닉네임/전화번호, 선택적으로 비밀번호까지 같이 변경 가능)
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

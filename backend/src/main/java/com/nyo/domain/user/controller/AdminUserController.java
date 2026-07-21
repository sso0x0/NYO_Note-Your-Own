package com.nyo.domain.user.controller;

import com.nyo.domain.user.dto.*;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.response.ApiResponse;
import com.nyo.global.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 관리자 전용 회원 관리 API. SecurityConfig에서 "/api/admin/**" → hasRole("ADMIN")으로 보호되므로
 * 여기 메서드들은 인증/권한 체크를 따로 하지 않는다 (필터 단에서 이미 걸러짐).
 * 권한 변경/제재 등록은 관리자가 자기 자신을 대상으로는 할 수 없도록 UserService에서 막고 있다.
 */
@Tag(name = "Admin - User", description = "관리자 회원 관리 API")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    // 💡 회원 목록 조회 (페이징) - 기본 20개씩
    @Operation(summary = "회원 목록 조회")
    @GetMapping
    public ApiResponse<Page<UserResponse>> getUserList(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(userService.adminGetUserList(pageable));
    }

    // 💡 회원 상세 조회 (탈퇴 회원도 조회 가능해야 해서 마이페이지용 조회와 분리)
    @Operation(summary = "회원 상세 조회")
    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable Long userId) {
        return ApiResponse.ok(userService.adminGetUser(userId));
    }

    // 💡 권한 변경 (USER ↔ ADMIN) - 자기 자신 강등 방지를 위해 adminId도 함께 전달
    @Operation(summary = "회원 권한 변경")
    @PatchMapping("/{userId}/role")
    public ApiResponse<UserResponse> changeRole(@PathVariable Long userId,
                                                @Valid @RequestBody UserRoleUpdateRequest request) {
        Long adminId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(userService.adminChangeRole(adminId, userId, request.getRole()));
    }

    // 💡 제재 등록 (경고/정지/강제탈퇴) - adminId는 요청 바디가 아니라 로그인 토큰에서 추출
    @Operation(summary = "회원 제재 등록")
    @PostMapping("/sanctions")
    public ApiResponse<UserSanctionResponse> sanctionUser(@Valid @RequestBody UserSanctionRequest request) {
        Long adminId = SecurityUtil.getCurrentUserId();
        return ApiResponse.ok(userService.adminSanctionUser(adminId, request));
    }

    // 💡 특정 회원의 제재 이력 조회
    @Operation(summary = "회원 제재 이력 조회")
    @GetMapping("/{userId}/sanctions")
    public ApiResponse<List<UserSanctionResponse>> getSanctionHistory(@PathVariable Long userId) {
        return ApiResponse.ok(userService.adminGetSanctionHistory(userId));
    }
}
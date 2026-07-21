package com.nyo.domain.user.service;

import com.nyo.domain.user.dto.*;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.entity.UserSanction;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.domain.user.repository.UserSanctionRepository;
import com.nyo.global.enums.Role;
import com.nyo.global.enums.SanctionType;
import com.nyo.global.enums.UserStatus;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.jwt.JwtTokenProvider;
import com.nyo.global.security.LoginAttemptGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 회원 도메인 핵심 서비스. 크게 세 영역으로 나뉜다.
 * 1) 일반 회원 기능: 회원가입/로그인/중복체크/마이페이지 조회·수정/탈퇴
 * 2) 관리자 기능: 회원 목록·상세 조회, 권한 변경, 제재 등록/이력 조회 (adminXxx 메서드들)
 * 3) 인증 공용 로직: 정지 자동 해제 + 활성 상태 검증(validateActiveOrReactivate) — 일반 로그인과
 *    구글 로그인(CustomOAuth2UserService) 양쪽에서 동일하게 호출되어 정지/탈퇴 회원이
 *    어느 로그인 방식으로도 우회할 수 없게 한다.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSanctionRepository userSanctionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptGuard loginAttemptGuard;

    // 회원가입
    @Transactional
    public UserResponse signup(UserRequest request) {
        validateDuplicate(request.getLoginId(), request.getEmail(), request.getNickname());

        User user = User.builder()
                .loginId(request.getLoginId())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .nickname(request.getNickname())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();

        // validateDuplicate 통과 이후에도 동시 요청이 겹치면 DB unique 제약에서 걸릴 수 있어 방어적으로 처리
        try {
            return toResponse(userRepository.save(user));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.MEMBER_SIGNUP_CONFLICT);
        }
    }

    // 로그인 (id, pw). 정지 자동 해제 시 상태 변경을 DB에 반영
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 무차별 대입 방어: 최근 실패가 많이 쌓인 아이디면 조회 전에 바로 차단
        loginAttemptGuard.checkAllowed(request.getLoginId());

        // id를 가져옴. 계정 존재 여부가 드러나지 않도록 비밀번호 불일치와 동일한 에러코드(MEMBER_LOGIN_FAILED) 사용
        User user = userRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> loginFailed(request.getLoginId()));

        // 정지 기간이 이미 끝났으면 로그인 시점에 자동으로 ACTIVE로 되돌림
        reactivateIfSuspensionExpired(user);

        // 비밀번호 불일치일 경우. 상태 체크보다 먼저 수행해서, 비밀번호가 틀리면 계정 상태(정지/탈퇴)와
        // 무관하게 항상 동일한 MEMBER_LOGIN_FAILED를 반환한다. 그렇지 않으면 아이디만으로 "이 계정이
        // 존재하고 정지/탈퇴 상태인지"를 알아낼 수 있는 계정 열거(enumeration) 문제가 생긴다.
        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw loginFailed(request.getLoginId());
        }

        // 여기까지 왔다는 건 비밀번호가 맞다는 뜻이므로, 탈퇴/정지 사유를 알려줘도 계정 열거로 이어지지 않는다.
        // (비밀번호 추측과 무관한 상태 체크라 시도 횟수에는 포함하지 않는다)
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.MEMBER_INACTIVE);
        }

        // 로그인 성공 시 이전 실패 기록 삭제
        loginAttemptGuard.onSuccess(request.getLoginId());
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .build();
    }

    // 로그인 실패 처리 공통화: 실패 횟수를 올리고 통일된 에러를 반환
    private BusinessException loginFailed(String loginId) {
        loginAttemptGuard.onFailure(loginId);
        return new BusinessException(ErrorCode.MEMBER_LOGIN_FAILED); // id 또는 비번 불일치 메시지
    }

    // 회원가입 폼 실시간 검증용 중복 체크 3종 (id, email, nickname)
    @Transactional(readOnly = true)
    public boolean checkLoginIdDuplicate(String loginId) {
        return userRepository.existsByLoginId(loginId);
    }
    @Transactional(readOnly = true)
    public boolean checkEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }
    @Transactional(readOnly = true)
    public boolean checkNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }


    // 마이페이지 조회. 탈퇴 회원은 findActiveUserOrThrow에서 걸러짐
    @Transactional(readOnly = true)
    public UserResponse getMyInfo(Long userId) {
        User user = findActiveUserOrThrow(userId);
        return toResponse(user);
    }

    // 마이페이지 수정. 닉네임이 실제로 바뀔 때만 중복 검사(자기 자신 제외)해서 불필요한 쿼리 방지.
    // newPassword가 채워져 있으면 비밀번호도 같이 변경한다(선택 항목).
    @Transactional
    public UserResponse updateMyProfile(Long userId, UserProfileUpdateRequest request) {
        User user = findActiveUserOrThrow(userId);

        if (!user.getNickname().equals(request.getNickname())
                && userRepository.existsByNicknameAndIdNot(request.getNickname(), userId)) {
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
        }

        user.updateProfile(request.getName(), request.getNickname(), request.getPhone());

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            changePassword(user, request.getCurrentPassword(), request.getNewPassword());
        }

        // 사전 중복 체크 이후에도 동시 요청이 겹치면 DB unique 제약(nickname)에서 걸릴 수 있어 방어적으로 처리
        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
        }

        return toResponse(user);
    }

    // updateMyProfile에서 newPassword가 같이 온 경우에만 호출됨. 소셜 로그인 회원(password null)은 변경 자체를 차단
    private void changePassword(User user, String currentPassword, String newPassword) {
        if (user.getPassword() == null) {
            throw new BusinessException(ErrorCode.MEMBER_OAUTH_PASSWORD_CHANGE_NOT_ALLOWED);
        }

        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.MEMBER_CURRENT_PASSWORD_MISMATCH);
        }

        if (newPassword.length() < 8 || newPassword.length() > 72) {
            throw new BusinessException(ErrorCode.MEMBER_INVALID_NEW_PASSWORD);
        }

        user.changePassword(passwordEncoder.encode(newPassword));
    }

    // 소프트 딜리트: row는 지우지 않고 status만 WITHDRAWN으로 변경 (작성했던 노트 등은 그대로 남음)
    @Transactional
    public void withdraw(Long userId) {
        User user = findActiveUserOrThrow(userId);
        user.withdraw();
        // TODO: 노트 작성자 표시를 "탈퇴한 사용자"로 보여주는 처리는 Note 도메인에서 협의 필요
    }

    /** 💡 Note 등 다른 도메인에서 작성자 표시명을 물어볼 때 사용 */
    @Transactional(readOnly = true)
    public String getDisplayNickname(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 사용자" : user.getNickname())
                .orElse("알 수 없는 사용자");
    }

    // 위 메서드의 다건 버전 (게시글 목록처럼 여러 작성자 이름을 한 번에 조회할 때)
    @Transactional(readOnly = true)
    public java.util.Map<Long, String> getDisplayNicknames(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        User::getId,
                        user -> user.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 사용자" : user.getNickname()
                ));
    }

    // ================== 여기까지 관리자 기능 ==================
    // ================== 관리자 기능 ==================

    // 회원 목록 페이징 조회 (탈퇴 회원 포함, 필터 없이 전체)
    @Transactional(readOnly = true)
    public Page<UserResponse> adminGetUserList(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    // 마이페이지용 조회(findActiveUserOrThrow)와 달리 탈퇴 회원도 조회 가능해야 해서 별도 메서드로 분리
    @Transactional(readOnly = true)
    public UserResponse adminGetUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return toResponse(user);
    }

    // USER ↔ ADMIN 권한 변경. 관리자가 자기 자신의 권한을 바꾸면 마지막 ADMIN이 스스로를 강등시킬 수 있어 차단
    @Transactional
    public UserResponse adminChangeRole(Long adminId, Long userId, Role role) {
        if (adminId.equals(userId)) {
            throw new BusinessException(ErrorCode.MEMBER_CANNOT_CHANGE_OWN_ROLE);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        user.changeRole(role);
        return toResponse(user);
    }

    // 제재 등록: 제재 종류에 따라 회원 상태를 바꾸고(applySanctionEffect), 이력을 별도 테이블에 남김
    @Transactional
    public UserSanctionResponse adminSanctionUser(Long adminId, UserSanctionRequest request) {
        if (adminId.equals(request.getUserId())) {
            throw new BusinessException(ErrorCode.MEMBER_CANNOT_SANCTION_SELF);
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 탈퇴 회원은 소프트 삭제된 상태이므로 제재로 상태를 건드리면 안 됨
        // (SUSPENSION을 걸면 이후 정지 기간 만료 시 reactivateIfSuspensionExpired가 ACTIVE로 되돌려 탈퇴 계정이 부활함)
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_WITHDRAWN);
        }

        applySanctionEffect(user, request.getType());

        UserSanction sanction = UserSanction.builder()
                .userId(request.getUserId())
                .adminId(adminId)
                .type(request.getType())
                .reason(request.getReason())
                .endAt(request.getEndAt())
                .build();

        return toSanctionResponse(userSanctionRepository.save(sanction));
    }

    // 제재 유형별로 회원 상태에 실제로 반영할 효과 (경고는 상태 변화 없이 이력만 남음)
    private void applySanctionEffect(User user, SanctionType type) {
        switch (type) {
            case SUSPENSION -> user.changeStatus(UserStatus.SUSPENDED);
            case WITHDRAWAL -> user.withdraw();
            case WARNING -> { /* 상태 변화 없음, 이력만 남김 */ }
        }
    }

    // 특정 회원에게 내려진 제재 이력 전체 (최신순)
    @Transactional(readOnly = true)
    public List<UserSanctionResponse> adminGetSanctionHistory(Long userId) {
        return userSanctionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toSanctionResponse)
                .toList();
    }

    // ================== 여기까지 관리자 기능 ==================

    // 구글 로그인 시에도 일반 로그인(login())과 동일한 정책 적용: 정지 만료면 자동 해제, 아니면 상태 확인 후 차단
    // (OAuth2 로그인은 password 체크가 없어 이 검증이 유일한 관문이라 CustomOAuth2UserService에서 호출)
    @Transactional
    public void validateActiveOrReactivate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        reactivateIfSuspensionExpired(user);

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.MEMBER_INACTIVE);
        }
    }

    // 가장 최근 정지 이력의 endAt이 지났으면 별도 배치 없이 로그인 시점에 ACTIVE로 되돌림
    private void reactivateIfSuspensionExpired(User user) {
        if (user.getStatus() != UserStatus.SUSPENDED) return;

        // 정지 여부 판단
        userSanctionRepository.findTopByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), SanctionType.SUSPENSION)
                .filter(sanction -> sanction.getEndAt() != null && !sanction.getEndAt().isAfter(LocalDateTime.now()))
                // 정지 기간 만료, 정지 해제 기간이 없을 경우 정상 상태로 변경
                .ifPresent(sanction -> user.changeStatus(UserStatus.ACTIVE));
    }

    // 본인 관련 API(마이페이지 등)에서 공통으로 쓰는 조회: 탈퇴 회원이면 예외로 막음
    private User findActiveUserOrThrow(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 탈퇴 회원일 경우 로그인 실패
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_WITHDRAWN);
        }
        return user;
    }

    // 회원가입 시 아이디/이메일/닉네임 중복을 한 번에 검사
    private void validateDuplicate(String loginId, String email, String nickname) {
        if (userRepository.existsByLoginId(loginId)) throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_LOGIN_ID);
        if (userRepository.existsByEmail(email)) throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_EMAIL);
        if (userRepository.existsByNickname(nickname)) throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .loginId(user.getLoginId())
                .name(user.getName())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .oauthProvider(user.getOauthProvider())
                .withdrawnAt(user.getWithdrawnAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private UserSanctionResponse toSanctionResponse(UserSanction sanction) {
        return UserSanctionResponse.builder()
                .id(sanction.getId())
                .userId(sanction.getUserId())
                .adminId(sanction.getAdminId())
                .type(sanction.getType())
                .reason(sanction.getReason())
                .startAt(sanction.getStartAt())
                .endAt(sanction.getEndAt())
                .createdAt(sanction.getCreatedAt())
                .build();
    }
}
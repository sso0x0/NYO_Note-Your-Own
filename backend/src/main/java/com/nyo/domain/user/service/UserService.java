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
import com.nyo.global.sms.SmsService;
import com.nyo.global.security.LoginAttemptGuard;
import com.nyo.global.security.PasswordResetCodeStore;
import com.nyo.global.security.PhoneVerificationCodeStore;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSanctionRepository userSanctionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptGuard loginAttemptGuard;
    private final PasswordResetCodeStore passwordResetCodeStore;
    private final PhoneVerificationCodeStore phoneVerificationCodeStore;
    private final SmsService smsService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final java.util.regex.Pattern PASSWORD_PATTERN =
            java.util.regex.Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).+$");
    private static final long WITHDRAWAL_GRACE_PERIOD_DAYS = 30;

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

        try {
            return toResponse(userRepository.save(user));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.MEMBER_SIGNUP_CONFLICT);
        }
    }

    // 로그인 (id, pw).
    @Transactional
    public LoginResponse login(LoginRequest request) {
        loginAttemptGuard.checkAllowed(request.getLoginId());

        User user = userRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> loginFailed(request.getLoginId()));

        // 정지 기간이 이미 끝났으면 로그인 시점에 자동으로 ACTIVE로 되돌림
        reactivateIfSuspensionExpired(user);

        // 💡 [수정] 탈퇴 유예기간 자동 복구 로직 주석 처리 (탈퇴 회원은 즉시 로그인 차단)
        // reactivateIfWithinGracePeriod(user);

        // 탈퇴한 계정은 "이미 탈퇴한 회원입니다." 에러를 던져 프론트엔드에서 다시가입 안내를 띄우게 함
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_WITHDRAWN);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.MEMBER_INACTIVE);
        }

        loginAttemptGuard.onSuccess(request.getLoginId());
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .build();
    }

    private BusinessException loginFailed(String loginId) {
        loginAttemptGuard.onFailure(loginId);
        return new BusinessException(ErrorCode.MEMBER_LOGIN_FAILED);
    }

    @Transactional(readOnly = true)
    public FindLoginIdResponse findLoginId(FindLoginIdRequest request) {
        User user = userRepository.findByNameAndEmail(request.getName(), request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_FIND_ID_NOT_FOUND));

        return FindLoginIdResponse.builder()
                .maskedLoginId(user.getLoginId())
                .build();
    }

    @Transactional(readOnly = true)
    public void sendPasswordResetCode(PasswordResetCodeRequest request) {
        User user = userRepository.findByLoginId(request.getLoginId())
                .filter(u -> u.getPhone() != null && u.getPhone().equals(request.getPhone()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TARGET_NOT_FOUND));

        if (user.getPassword() == null) {
            throw new BusinessException(ErrorCode.MEMBER_OAUTH_PASSWORD_CHANGE_NOT_ALLOWED);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        passwordResetCodeStore.save(request.getLoginId(), code);
        smsService.sendPasswordResetCode(user.getPhone(), code);
    }

    @Transactional(readOnly = true)
    public void verifyPasswordResetCode(PasswordResetCodeVerifyRequest request) {
        userRepository.findByLoginId(request.getLoginId())
                .filter(u -> u.getPhone() != null && u.getPhone().equals(request.getPhone()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TARGET_NOT_FOUND));

        passwordResetCodeStore.verifyOnly(request.getLoginId(), request.getCode());
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        User user = userRepository.findByLoginId(request.getLoginId())
                .filter(u -> u.getPhone() != null && u.getPhone().equals(request.getPhone()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TARGET_NOT_FOUND));

        passwordResetCodeStore.verify(request.getLoginId(), request.getCode());

        user.changePassword(passwordEncoder.encode(request.getNewPassword()));
    }

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

    @Transactional(readOnly = true)
    public UserResponse getMyInfo(Long userId) {
        User user = findActiveUserOrThrow(userId);
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateMyProfile(Long userId, UserProfileUpdateRequest request) {
        User user = findActiveUserOrThrow(userId);

        boolean nicknameChanged = !user.getNickname().equals(request.getNickname());
        boolean emailChanged = !user.getEmail().equals(request.getEmail());
        boolean phoneChanged = !java.util.Objects.equals(user.getPhone(), request.getPhone());
        boolean passwordChangeRequested = request.getNewPassword() != null && !request.getNewPassword().isBlank();
        boolean anyChanged = nicknameChanged || emailChanged || phoneChanged || passwordChangeRequested;

        if (user.getPassword() != null) {
            if (anyChanged
                    && (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))) {
                throw new BusinessException(ErrorCode.MEMBER_CURRENT_PASSWORD_MISMATCH);
            }
        } else if (passwordChangeRequested) {
            throw new BusinessException(ErrorCode.MEMBER_OAUTH_PASSWORD_CHANGE_NOT_ALLOWED);
        }

        if (nicknameChanged && userRepository.existsByNicknameAndIdNot(request.getNickname(), userId)) {
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
        }

        if (emailChanged && userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_EMAIL);
        }

        if (phoneChanged) {
            if (request.getPhoneVerificationCode() == null || request.getPhoneVerificationCode().isBlank()) {
                throw new BusinessException(ErrorCode.PHONE_VERIFICATION_REQUIRED);
            }
            phoneVerificationCodeStore.verify(userId, request.getPhone(), request.getPhoneVerificationCode());
        }

        user.updateProfile(request.getName(), request.getNickname(), request.getEmail(), request.getPhone());

        if (passwordChangeRequested) {
            changePassword(user, request.getNewPassword());
        }

        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
                throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_EMAIL);
            }
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
        }

        return toResponse(user);
    }

    @Transactional
    public void sendPhoneVerificationCode(Long userId, String phone) {
        findActiveUserOrThrow(userId);
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        phoneVerificationCodeStore.save(userId, phone, code);
        smsService.sendPhoneVerificationCode(phone, code);
    }

    @Transactional(readOnly = true)
    public void verifyPhoneVerificationCode(Long userId, String phone, String code) {
        phoneVerificationCodeStore.verifyOnly(userId, phone, code);
    }

    private void changePassword(User user, String newPassword) {
        if (newPassword.length() < 8 || newPassword.length() > 72 || !PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new BusinessException(ErrorCode.MEMBER_INVALID_NEW_PASSWORD);
        }

        user.changePassword(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void withdraw(Long userId) {
        User user = findActiveUserOrThrow(userId);
        user.withdraw();
    }

    @Transactional(readOnly = true)
    public String getDisplayNickname(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 사용자" : user.getNickname())
                .orElse("알 수 없는 사용자");
    }

    @Transactional(readOnly = true)
    public java.util.Map<Long, String> getDisplayNicknames(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        User::getId,
                        user -> user.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 사용자" : user.getNickname()
                ));
    }

    @Transactional(readOnly = true)
    public java.util.Map<Long, UserResponse> adminGetUsersByIds(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, this::toResponse));
    }

    @Transactional(readOnly = true)
    public List<Long> findUserIdsByNickname(String keyword) {
        return userRepository.findByNicknameContainingIgnoreCase(keyword).stream()
                .map(User::getId)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> adminGetUserList(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse adminGetUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return toResponse(user);
    }

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

    @Transactional
    public UserSanctionResponse adminSanctionUser(Long adminId, UserSanctionRequest request) {
        if (adminId.equals(request.getUserId())) {
            throw new BusinessException(ErrorCode.MEMBER_CANNOT_SANCTION_SELF);
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

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

    private void applySanctionEffect(User user, SanctionType type) {
        switch (type) {
            case SUSPENSION -> user.changeStatus(UserStatus.SUSPENDED);
            case WITHDRAWAL -> user.withdraw();
            case WARNING -> { }
        }
    }

    @Transactional(readOnly = true)
    public List<UserSanctionResponse> adminGetSanctionHistory(Long userId) {
        return userSanctionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toSanctionResponse)
                .toList();
    }

    @Transactional
    public UserSanctionResponse acknowledgeLatestWarning(Long userId) {
        List<UserSanction> warnings = userSanctionRepository
                .findByUserIdAndTypeAndEndAtIsNullOrderByCreatedAtDesc(
                        userId,
                        SanctionType.WARNING
                );
        if (warnings.isEmpty()) return null;

        warnings.forEach(UserSanction::acknowledge);
        return toSanctionResponse(warnings.get(0));
    }

    @Transactional
    public UserResponse adminReleaseSuspension(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (user.getStatus() != UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.MEMBER_SUSPENSION_NOT_ACTIVE);
        }

        UserSanction suspension = userSanctionRepository
                .findTopByUserIdAndTypeOrderByCreatedAtDesc(userId, SanctionType.SUSPENSION)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_SUSPENSION_NOT_ACTIVE));

        suspension.release(LocalDateTime.now());
        user.changeStatus(UserStatus.ACTIVE);
        return toResponse(user);
    }

    // 구글 로그인 등에서도 상태 검증
    @Transactional
    public void validateActiveOrReactivate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        reactivateIfSuspensionExpired(user);

        // 💡 [수정] 구글 로그인 시에도 탈퇴 유예기간 복구 로직 주석 처리
        // reactivateIfWithinGracePeriod(user);

        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_WITHDRAWN);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.MEMBER_INACTIVE);
        }
    }

    private void reactivateIfSuspensionExpired(User user) {
        if (user.getStatus() != UserStatus.SUSPENDED) return;

        userSanctionRepository.findTopByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), SanctionType.SUSPENSION)
                .filter(sanction -> sanction.getEndAt() != null && !sanction.getEndAt().isAfter(LocalDateTime.now()))
                .ifPresent(sanction -> user.changeStatus(UserStatus.ACTIVE));
    }

    private void reactivateIfWithinGracePeriod(User user) {
        if (user.getStatus() != UserStatus.WITHDRAWN) return;
        if (user.getWithdrawnAt() == null) return;

        LocalDateTime graceDeadline = user.getWithdrawnAt().plusDays(WITHDRAWAL_GRACE_PERIOD_DAYS);
        if (LocalDateTime.now().isBefore(graceDeadline)) {
            user.restoreFromWithdrawal();
        }
    }

    private User findActiveUserOrThrow(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_WITHDRAWN);
        }
        return user;
    }

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
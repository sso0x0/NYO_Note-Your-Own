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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSanctionRepository userSanctionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public String introduce() {
        return "UserService: 회원가입·로그인(JWT 인증)·프로필 관리 로직을 담당할 예정입니다.";
    }

    @Transactional
    public UserResponse signup(UserRequest request) {
        validateDuplicate(request.getLoginId(), request.getEmail(), request.getNickname());

        String encodedPassword = request.getPassword() != null
                ? passwordEncoder.encode(request.getPassword())
                : null;

        User user = User.builder()
                .loginId(request.getLoginId())
                .password(encodedPassword)
                .name(request.getName())
                .nickname(request.getNickname())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();

        return toResponse(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.MEMBER_INACTIVE);
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.MEMBER_INVALID_PASSWORD);
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .build();
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

        if (!user.getNickname().equals(request.getNickname())
                && userRepository.existsByNicknameAndIdNot(request.getNickname(), userId)) {
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
        }

        user.updateProfile(request.getName(), request.getNickname(), request.getPhone());
        return toResponse(user);
    }

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
    public UserResponse adminChangeRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        user.changeRole(role);
        return toResponse(user);
    }

    @Transactional
    public UserSanctionResponse adminSanctionUser(Long adminId, UserSanctionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

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
            case WARNING -> { /* 상태 변화 없음, 이력만 남김 */ }
        }
    }

    @Transactional(readOnly = true)
    public List<UserSanctionResponse> adminGetSanctionHistory(Long userId) {
        return userSanctionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toSanctionResponse)
                .toList();
    }

    // ================== 여기까지 관리자 기능 ==================

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
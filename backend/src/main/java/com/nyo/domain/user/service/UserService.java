package com.nyo.domain.user.service;

import com.nyo.domain.user.dto.*;
import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.entity.UserSanction;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.domain.user.repository.UserSanctionRepository;
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
    private final UserSanctionRepository userSanctionRepository; // 💡 추가
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
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new IllegalStateException("로그인할 수 없는 계정 상태입니다. (status=" + user.getStatus() + ")");
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .nickname(user.getNickname())
                .role(user.getRole())
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
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
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

    // ================== 💡 여기부터 관리자 기능 ==================

    /** 💡 회원 목록 조회 (탈퇴 회원 포함 - 관리자는 전체를 봐야 함) */
    @Transactional(readOnly = true)
    public Page<UserResponse> adminGetUserList(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    /** 💡 회원 상세 조회 (마이페이지용 findActiveUserOrThrow와 달리 탈퇴 회원도 조회 가능) */
    @Transactional(readOnly = true)
    public UserResponse adminGetUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        return toResponse(user);
    }

    /** 💡 권한 변경 (USER ↔ ADMIN) */
    @Transactional
    public UserResponse adminChangeRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        user.changeRole(role);
        return toResponse(user);
    }

    /** 💡 제재 등록: 유형에 따라 회원 상태도 같이 변경 + 이력 저장 */
    @Transactional
    public UserSanctionResponse adminSanctionUser(Long adminId, UserSanctionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

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

    // 💡 제재 유형별로 회원 상태에 미치는 실제 효과를 분리 (WARNING은 이력만 남고 상태 변화 없음)
    private void applySanctionEffect(User user, String type) {
        switch (type) {
            case "SUSPENSION" -> user.changeStatus("SUSPENDED");
            case "WITHDRAWAL" -> user.withdraw(); // 강제 탈퇴 - withdrawnAt까지 같이 기록됨
            case "WARNING" -> { /* 상태 변화 없음, 이력만 남김 */ }
            default -> throw new IllegalArgumentException("지원하지 않는 제재 유형입니다: " + type);
        }
    }

    /** 💡 특정 회원의 제재 이력 전체 조회 */
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
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        if ("WITHDRAWN".equals(user.getStatus())) {
            throw new IllegalStateException("이미 탈퇴한 회원입니다.");
        }
        return user;
    }

    private void validateDuplicate(String loginId, String email, String nickname) {
        if (userRepository.existsByLoginId(loginId)) throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        if (userRepository.existsByEmail(email)) throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        if (userRepository.existsByNickname(nickname)) throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
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

    // 💡 추가: UserSanction 엔티티 → UserSanctionResponse DTO 매핑
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
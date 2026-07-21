package com.nyo.global.oauth2;

import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * 구글 로그인 시 사용자 정보를 조회/가입 처리하는 서비스.
 * Spring Security의 oauth2Login() 설정에 연결되어, 구글 인증이 끝난 직후 자동으로 호출된다.
 *
 * 처리 순서:
 *  1. 부모 클래스(DefaultOAuth2UserService)가 구글 UserInfo 엔드포인트를 호출해 프로필을 가져온다.
 *  2. provider + oauthId로 기존 가입 회원을 찾고, 없으면 새로 가입시킨다.
 *  3. 회원의 현재 상태(정지/탈퇴 여부)를 UserService에 위임해 검증한다.
 *     여기서 막지 않으면 정지·탈퇴된 회원이 구글 로그인만으로 제재를 그대로 우회할 수 있다.
 *  4. 문제 없으면 CustomOAuth2User로 감싸 반환한다 → 이후 OAuth2SuccessHandler가 JWT를 발급한다.
 *     3에서 걸리면 OAuth2AuthenticationException을 던지고 OAuth2FailureHandler가 이를 처리한다.
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // registrationId는 application.yaml의 "google"에서 오므로, 우리 쪽 저장 규칙(대문자)에 맞춰 변환한다.
        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String oauthId = oAuth2User.getAttribute("sub");     // 구글이 부여하는 계정 고유 식별자
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // 이 구글 계정으로 이미 가입돼 있으면 그 회원을 그대로 쓰고, 처음 로그인하는 계정이면 자동 가입시킨다.
        User user = userRepository.findByOauthProviderAndOauthId(provider, oauthId)
                .orElseGet(() -> registerNewOauthUser(provider, oauthId, email, name));

        // 일반 로그인(UserService.login)과 동일한 기준으로 정지/탈퇴 여부를 검사한다.
        // BusinessException은 Spring Security의 인증 실패 처리 흐름과 맞지 않으므로
        // OAuth2AuthenticationException으로 감싸서 던져 OAuth2FailureHandler가 받아 처리하도록 한다.
        try {
            userService.validateActiveOrReactivate(user.getId());
        } catch (BusinessException e) {
            throw new OAuth2AuthenticationException(new OAuth2Error(e.getErrorCode().name()), e.getErrorCode().getMessage());
        }

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    // 처음 보는 구글 계정이면 회원 레코드를 새로 만든다. password는 null로 두어 아이디/비밀번호 로그인은 막아둔다.
    private User registerNewOauthUser(String provider, String oauthId, String email, String name) {
        // loginId/nickname은 필수 컬럼이라 구글에서 받은 정보를 조합해 임의로 채워 넣는다.
        String generatedLoginId = provider.toLowerCase() + "_" + oauthId;
        String generatedNickname = generateUniqueNickname(name, oauthId);

        User newUser = User.createOauthUser(generatedLoginId, name, generatedNickname, email, provider, oauthId);

        // 같은 계정으로 동시에 로그인 콜백이 두 번 들어오면(더블클릭, 중복 탭 등) 둘 다 미가입 상태로 보고
        // 동일한 loginId/nickname으로 insert를 시도할 수 있어, unique 제약 위반을 여기서 방어적으로 처리한다.
        // (signup()의 DataIntegrityViolationException 처리와 동일한 이유)
        try {
            return userRepository.save(newUser);
        } catch (DataIntegrityViolationException e) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error(ErrorCode.MEMBER_SIGNUP_CONFLICT.name()),
                    ErrorCode.MEMBER_SIGNUP_CONFLICT.getMessage());
        }
    }

    // "이름_oauthId앞6자리" 형태의 닉네임 후보가 이미 존재하면, 유일한 값이 나올 때까지 뒤에 순번을 붙여 재시도한다.
    private String generateUniqueNickname(String name, String oauthId) {
        String base = name + "_" + oauthId.substring(0, 6);
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByNickname(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }
}

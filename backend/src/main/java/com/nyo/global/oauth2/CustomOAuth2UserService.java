package com.nyo.global.oauth2;

import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 💡 구글에 실제로 사용자 정보를 요청하는 부분 (부모 클래스가 처리)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 💡 registrationId는 yml의 "google"에서 옴 → 우리 DB엔 대문자로 저장(GOOGLE)
        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String oauthId = oAuth2User.getAttribute("sub");     // 구글이 주는 고유 식별자
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // 💡 이미 가입한 적 있는 구글 계정이면 그대로 조회, 처음이면 자동 회원가입
        User user = userRepository.findByOauthProviderAndOauthId(provider, oauthId)
                .orElseGet(() -> registerNewOauthUser(provider, oauthId, email, name));

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    private User registerNewOauthUser(String provider, String oauthId, String email, String name) {
        // 💡 loginId/nickname은 필수값이라 구글 정보 기반으로 임시 생성
        // TODO: 닉네임 중복 가능성 있음 - 온보딩 화면에서 닉네임 재설정 받는 걸 추천
        String generatedLoginId = provider.toLowerCase() + "_" + oauthId;
        String generatedNickname = name + "_" + oauthId.substring(0, 6);

        User newUser = User.createOauthUser(generatedLoginId, name, generatedNickname, email, provider, oauthId);
        return userRepository.save(newUser);
    }
}
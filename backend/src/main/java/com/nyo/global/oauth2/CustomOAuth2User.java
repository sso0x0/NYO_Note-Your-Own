package com.nyo.global.oauth2;

import com.nyo.domain.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Spring Security가 요구하는 OAuth2User 인터페이스를 우리 User 엔티티로 감싼 어댑터.
 * CustomOAuth2UserService가 구글 로그인 처리를 끝낸 뒤 이 객체를 만들어 Authentication의
 * principal로 등록해두면, OAuth2SuccessHandler/OAuth2FailureHandler가 그 값을 꺼내 쓸 수 있다.
 */
@Getter
public class CustomOAuth2User implements OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;

    public CustomOAuth2User(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    // 구글이 내려준 프로필 원본 attribute(email, name, sub 등). Spring Security 내부에서 참조한다.
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    // JWT 발급 규칙과 동일하게 "ROLE_" 접두사를 붙여 권한을 구성한다.
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
    }

    // OAuth2User가 요구하는 식별자. 여기서는 우리 DB의 회원 PK를 그대로 사용한다.
    @Override
    public String getName() {
        return String.valueOf(user.getId());
    }
}

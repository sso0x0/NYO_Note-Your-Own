package com.nyo.global.jwt;

import com.nyo.global.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 발급과 검증을 전담하는 컴포넌트.
 * secret/유효기간은 application.yaml(jwt.secret, jwt.access-token-validity-ms)에서 주입받는다.
 * 토큰에는 subject로 userId를, "role" 클레임으로 발급 당시의 권한을 담아 서명한다.
 * 다만 role 클레임은 프론트에서 화면 분기용으로 참고하는 값일 뿐이고, 서버가 실제 인가를 판단할 때는
 * JwtAuthenticationFilter가 매 요청마다 DB에서 새로 조회한 최신 role을 사용한다.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenValidityMs;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity-ms:3600000}") long accessTokenValidityMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidityMs = accessTokenValidityMs;
    }

    // 로그인(일반/구글 공통) 성공 시 호출되어 access token을 발급한다.
    public String createAccessToken(Long userId, Role role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenValidityMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    // subject에 저장해둔 userId를 꺼낸다. JwtAuthenticationFilter가 인증 대상 회원을 특정할 때 사용.
    public Long getUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    // 서명이 위조됐거나 만료됐거나 형식이 잘못된 경우를 전부 뭉뚱그려 false로 처리한다.
    // 필터 입장에서는 "유효한 토큰인가"만 중요하고 구체적인 실패 원인은 필요 없기 때문이다.
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 서명 검증과 payload 추출을 한 번에 수행한다. 검증에 실패하면 예외가 그대로 던져진다.
    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }
}

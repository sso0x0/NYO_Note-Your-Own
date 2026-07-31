package com.nyo.global.jwt;

import com.nyo.domain.user.entity.User;
import com.nyo.domain.user.repository.UserRepository;
import com.nyo.global.enums.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Spring Security 필터 체인에 끼워 넣는 JWT 인증 필터.
 * 요청 하나당 정확히 한 번 실행되고(OncePerRequestFilter), 여기서 인증을 세팅하지 못해도 그냥 다음 필터로
 * 넘어간다 — 인증이 꼭 필요한 요청인지 아닌지는 SecurityConfig의 authorizeHttpRequests가 최종적으로 판단한다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    /**
     * OncePerRequestFilter는 기본적으로 비동기 디스패치(async dispatch)에서는 다시 실행되지 않는다.
     * 그런데 /api/chats/stream처럼 SseEmitter를 쓰는 컨트롤러는 emitter.complete()가 호출되면
     * 서블릿 컨테이너가 응답을 마무리하려고 이 필터 체인을 async 디스패치로 다시 태우는데,
     * 이 필터가 그때 건너뛰어지면 SecurityContext가 비어 있는 채로 AuthorizationFilter를 만나
     * "Access Denied"가 나고 응답이 깨끗하게 안 끝난다(클라이언트 fetch가 멈춘 것처럼 보임).
     * false를 반환해 async 디스패치에서도 이 필터가 다시 실행되어 인증을 다시 세팅하게 한다.
     */
    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserId(token);

            // 인가에 쓸 role은 토큰 안에 넣어둔 값이 아니라 여기서 DB를 다시 조회해서 가져온다.
            // 토큰 클레임을 그대로 믿으면, 로그인 이후 관리자가 정지시키거나 권한을 바꿔도
            // 이미 발급된 토큰이 만료될 때까지는 그 변경이 반영되지 않기 때문이다.
            // 상태가 ACTIVE가 아니면(정지/탈퇴) 아예 인증 정보를 세팅하지 않아 이후 요청이 거부되게 한다.
            userRepository.findById(userId)
                    .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                    .ifPresent(this::setAuthentication);
        }
        chain.doFilter(request, response);
    }

    // SecurityContext에 인증 정보를 심는다. 이후 hasRole("ADMIN") 같은 권한 체크가 이 값을 기준으로 동작한다.
    private void setAuthentication(User user) {
        var authentication = new UsernamePasswordAuthenticationToken(
                user.getId(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    // Authorization 헤더에서 "Bearer " 접두사를 떼고 순수 토큰 문자열만 추출한다. 헤더가 없거나 형식이 다르면 null.
    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }
}

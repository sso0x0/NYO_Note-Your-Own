package com.nyo.domain.user.repository;

import com.nyo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/** 회원(User) 엔티티 조회/중복확인용 리포지토리. 회원가입/로그인/마이페이지/관리자 기능 전반에서 사용. */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 회원가입, 실시간 중복체크(check-*) API에서 사용
    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    // 💡 로그인할 때 아이디로 유저를 조회하기 위해 추가!
    Optional<User> findByLoginId(String loginId);

    // 💡 추가: OAuth2 로그인 시 "이 구글 계정으로 이미 가입했는지" 확인용
    Optional<User> findByOauthProviderAndOauthId(String oauthProvider, String oauthId);
    // 💡 추가: 마이페이지 정보수정 시, 닉네임을 안 바꾸고 그대로 재저장해도
// 자기 자신과 중복 체크에 걸리면 안 되므로 "본인 ID 제외" 버전이 필요함
    boolean existsByNicknameAndIdNot(String nickname, Long id);

}
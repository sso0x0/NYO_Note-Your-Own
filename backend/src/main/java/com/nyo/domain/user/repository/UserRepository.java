package com.nyo.domain.user.repository;

import com.nyo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    // 💡 로그인할 때 아이디로 유저를 조회하기 위해 추가!
    Optional<User> findByLoginId(String loginId);
}
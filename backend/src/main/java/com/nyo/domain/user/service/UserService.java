package com.nyo.domain.user.service;

import com.nyo.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "UserService: 회원가입·로그인(JWT 인증)·프로필 관리 로직을 담당할 예정입니다.";
    }
}

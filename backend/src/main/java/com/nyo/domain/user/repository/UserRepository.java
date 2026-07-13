package com.nyo.domain.user.repository;

import com.nyo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이 레포지토리가 어떤 엔티티를 다루는지 스스로 설명합니다.
     */
    default String introduce() {
        return "UserRepository: User 엔티티에 대한 기본 CRUD를 제공합니다. (구현 예정)";
    }
}

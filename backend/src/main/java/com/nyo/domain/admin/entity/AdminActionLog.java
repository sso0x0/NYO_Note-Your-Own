package com.nyo.domain.admin.entity;

import com.nyo.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * TODO: AdminStatsService는 다른 도메인 테이블(users/lectures/notes/posts)을
 * JdbcTemplate로 집계만 하므로 원래 자체 엔티티가 필요 없습니다.
 * domain/chat과 동일한 4종 폴더 구조를 맞추기 위한 placeholder이며,
 * 추후 관리자 조작(감사) 이력을 저장하는 용도로 확장할 수 있습니다.
 */
@Entity
@Table(name = "admin_action_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminActionLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 이 엔티티가 어떤 데이터를 표현하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "AdminActionLog 엔티티: 현재는 미사용 placeholder이며, "
                + "AdminStatsService는 집계 전용이라 실제로는 쓰이지 않습니다. "
                + "추후 관리자 조작(감사) 이력을 저장하는 용도로 확장할 수 있습니다.";
    }
}

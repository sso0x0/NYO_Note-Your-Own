package com.nyo.domain.ai.entity;

import com.nyo.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// AI 호출 이력(프롬프트/응답/비용 등)을 저장하기 위한 엔티티.
@Entity
@Table(name = "ai_request_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiRequestLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

}

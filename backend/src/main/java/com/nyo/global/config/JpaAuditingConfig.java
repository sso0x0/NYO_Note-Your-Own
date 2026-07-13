package com.nyo.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * BaseEntity의 @CreatedDate/@LastModifiedDate가 동작하려면 이 설정이 필요합니다.
 * (없으면 createdAt/updatedAt이 항상 null로 저장됩니다)
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}

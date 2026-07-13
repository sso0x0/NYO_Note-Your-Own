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

/**
 * TODO: AiTaggingService는 결과를 tag/note_tags 테이블에만 저장하고
 * 별도의 호출 로그는 남기지 않습니다.
 * domain/chat과 동일한 4종 폴더 구조를 맞추기 위한 placeholder이며,
 * 추후 OpenAI 호출 이력(프롬프트/응답/비용 추적)을 저장하는 용도로 확장할 수 있습니다.
 */
@Entity
@Table(name = "ai_request_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiRequestLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 이 엔티티가 어떤 데이터를 표현하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "AiRequestLog 엔티티: 현재는 미사용 placeholder이며, "
                + "AiTaggingService/ChatService는 이 엔티티 없이 바로 OpenAI를 호출합니다. "
                + "추후 AI 호출 이력을 저장하는 용도로 확장할 수 있습니다.";
    }
}

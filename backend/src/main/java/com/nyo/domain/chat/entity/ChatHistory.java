package com.nyo.domain.chat.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * LLM+RAG 학습 챗봇 대화 내역. 팀 공식 DDL의 chat_histories 테이블과 매핑 (updated_at 없음).
 * User/Lecture 엔티티가 아직 없어서 FK를 Long 컬럼으로 보관합니다.
 */
@Entity
@Table(name = "chat_histories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "lecture_id")
    private Long lectureId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 15)
    private SenderRole senderRole;

    @Lob
    @Column(name = "message", nullable = false)
    private String message;

    // 강의 추천 답변일 때만 채워지는, 추천된 강의 id들을 콤마로 이어붙인 문자열 (예: "12,7,3").
    // 답변마다 여러 개일 수 있어 FK 하나로는 못 담아서 이 컬럼 하나에 뭉쳐 저장하고, 조회 시 다시 나눠서 강의를 찾는다.
    @Column(name = "recommended_lecture_ids", length = 200)
    private String recommendedLectureIds;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatHistory(Long userId, Long lectureId, SenderRole senderRole, String message, String recommendedLectureIds) {
        this.userId = userId;
        this.lectureId = lectureId;
        this.senderRole = senderRole;
        this.message = message;
        this.recommendedLectureIds = recommendedLectureIds;
    }
}

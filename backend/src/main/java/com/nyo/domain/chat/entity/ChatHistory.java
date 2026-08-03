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

    // 이 질문이 어떤 대화를 "이어서" 한 것인지 가리킨다. null이면 그 자체가 새 대화의 시작(루트)이고,
    // 값이 있으면 그 id를 가진 질문에서 이어진 것이다 — 항상 체인의 맨 처음(루트) id를 직접 가리키도록
    // 저장해서(중간 질문을 거치는 체인을 안 만듦), 목록 화면은 "root_question_id가 null인 것만" 걸러서
    // 최상위 항목으로 보여주고, 나머지는 그 대화를 이어서 열었을 때만 같이 보여줄 수 있다.
    // AI 태깅/RAG 챗봇 화면(ChatPage)뿐 아니라 강의 시청/노트 상세 화면의 학습용 챗봇에서 이어서 물어봐도
    // 똑같이 채워지므로, 어느 화면에서 이어졌든 전체 대화 목록(getHistories)에 새 항목으로 안 뜬다.
    @Column(name = "root_question_id")
    private Long rootQuestionId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 빌더를 통해 대화 내역 엔티티를 생성하기 위한 생성자.
    @Builder
    public ChatHistory(Long userId, Long lectureId, SenderRole senderRole, String message, String recommendedLectureIds, Long rootQuestionId) {
        this.userId = userId;
        this.lectureId = lectureId;
        this.senderRole = senderRole;
        this.message = message;
        this.recommendedLectureIds = recommendedLectureIds;
        this.rootQuestionId = rootQuestionId;
    }
}

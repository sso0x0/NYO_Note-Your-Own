package com.nyo.domain.pomodoro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 뽀모도로 학습 타이머 기록. 팀 공식 DDL의 pomodoro_records 테이블과 매핑.
 * 해당 테이블에는 updated_at 컬럼이 없어서 BaseEntity를 상속하지 않고
 * created_at만 직접 선언합니다.
 * User/Lecture/Note 엔티티가 아직 없어서 연관관계 매핑 대신 FK를 Long 컬럼으로 보관합니다.
 */
@Entity
@Table(name = "pomodoro_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class PomodoroRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "lecture_id")
    private Long lectureId;

    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "focus_minutes", nullable = false)
    private Integer focusMinutes;

    // 휴식 타이머 기능은 제거됐지만 DB 컬럼(break_minutes, NOT NULL)은 팀 공용 스키마라 그대로 두고
    // 항상 0을 채워 넣는다. API 요청/응답에는 더 이상 노출하지 않는다.
    @Column(name = "break_minutes", nullable = false)
    private Integer breakMinutes;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    // 통계 집계용 날짜 (startedAt의 날짜 부분)
    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // focusMinutes 미지정 시 기본 25분, breakMinutes는 항상 0, recordDate는 startedAt 날짜로 자동 계산해 생성한다
    @Builder
    public PomodoroRecord(Long userId, Long lectureId, Long noteId,
                          Integer focusMinutes,
                          LocalDateTime startedAt, LocalDateTime endedAt) {
        this.userId = userId;
        this.lectureId = lectureId;
        this.noteId = noteId;
        this.focusMinutes = focusMinutes != null ? focusMinutes : 25;
        this.breakMinutes = 0;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.recordDate = startedAt.toLocalDate();
    }

    // 타이머 기록을 수정한다 (focusMinutes는 null이면 기존 값 유지, recordDate는 새 startedAt 기준으로 재계산)
    public void update(Long lectureId, Long noteId,
                       Integer focusMinutes,
                       LocalDateTime startedAt, LocalDateTime endedAt) {
        this.lectureId = lectureId;
        this.noteId = noteId;
        if (focusMinutes != null) {
            this.focusMinutes = focusMinutes;
        }
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.recordDate = startedAt.toLocalDate();
    }
}

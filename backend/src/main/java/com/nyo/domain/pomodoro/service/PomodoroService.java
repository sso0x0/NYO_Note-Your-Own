package com.nyo.domain.pomodoro.service;

import com.nyo.domain.pomodoro.dto.PomodoroRecordRequest;
import com.nyo.domain.pomodoro.dto.PomodoroRecordResponse;
import com.nyo.domain.pomodoro.dto.PomodoroStudyTimeResponse;
import com.nyo.domain.pomodoro.entity.PomodoroRecord;
import com.nyo.domain.pomodoro.repository.PomodoroRecordRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// 뽀모도로 타이머 기록의 등록/수정/삭제 및 통계 조회를 처리하는 서비스
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PomodoroService {

    private final PomodoroRecordRepository pomodoroRecordRepository;

    // 타이머 기록을 새로 등록한다
    @Transactional
    public PomodoroRecordResponse create(Long userId, PomodoroRecordRequest request) {
        validateTimeRange(request.getStartedAt(), request.getEndedAt());

        PomodoroRecord record = PomodoroRecord.builder()
                .userId(userId)
                .lectureId(request.getLectureId())
                .noteId(request.getNoteId())
                .focusMinutes(request.getFocusMinutes())
                .startedAt(request.getStartedAt())
                .endedAt(request.getEndedAt())
                .build();

        return toResponse(pomodoroRecordRepository.save(record));
    }

    // 본인 소유 확인 후 타이머 기록을 수정한다
    @Transactional
    public PomodoroRecordResponse update(Long userId, Long id, PomodoroRecordRequest request) {
        PomodoroRecord record = pomodoroRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POMODORO_NOT_FOUND));

        if (!record.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.POMODORO_ACCESS_DENIED);
        }

        validateTimeRange(request.getStartedAt(), request.getEndedAt());

        record.update(request.getLectureId(), request.getNoteId(),
                request.getFocusMinutes(),
                request.getStartedAt(), request.getEndedAt());

        return toResponse(record);
    }

    // update()와 동일한 소유권 검증 패턴: 존재 여부 먼저 확인 후 본인 기록인지 확인
    @Transactional
    public void delete(Long userId, Long id) {
        PomodoroRecord record = pomodoroRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POMODORO_NOT_FOUND));

        if (!record.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.POMODORO_ACCESS_DENIED);
        }

        pomodoroRecordRepository.delete(record);
    }

    // 선택 삭제. ids에 남의 기록이 섞여 있어도 본인 것만 지워지고 나머지는 조용히 무시된다.
    @Transactional
    public void deleteBulk(Long userId, List<Long> ids) {
        pomodoroRecordRepository.deleteByIdInAndUserId(ids, userId);
    }

    // 회원의 모든 타이머 기록을 삭제한다
    @Transactional
    public void deleteAll(Long userId) {
        pomodoroRecordRepository.deleteAllByUserId(userId);
    }

    // getRecord/delete 공통: 존재 여부 먼저 확인 후 본인 기록인지 확인
    public PomodoroRecordResponse getRecord(Long userId, Long id) {
        PomodoroRecord record = pomodoroRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POMODORO_NOT_FOUND));

        if (!record.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.POMODORO_ACCESS_DENIED);
        }

        return toResponse(record);
    }

    // 회원의 타이머 기록 목록을 페이징 조회한다
    public PageResponse<PomodoroRecordResponse> getRecords(Long userId, Pageable pageable) {
        return PageResponse.of(
                pomodoroRecordRepository.findByUserId(userId, pageable).map(this::toResponse));
    }

    // recordDate(타이머 시작일)를 startDate~endDate로 필터링. 날짜 역순이면 바로 에러 처리.
    public PageResponse<PomodoroRecordResponse> getRecordsByPeriod(
            Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        if (endDate.isBefore(startDate)) {
            throw new BusinessException(ErrorCode.POMODORO_INVALID_DATE_RANGE);
        }
        return PageResponse.of(
                pomodoroRecordRepository.findByUserIdAndRecordDateBetween(userId, startDate, endDate, pageable)
                        .map(this::toResponse));
    }

    // 진행 중인(endedAt == null) 타이머는 아직 끝나지 않았으니 집계에서 제외 (레포지토리 쿼리에서 필터링)
    public PomodoroStudyTimeResponse getTodayStudyTime(Long userId) {
        Integer minutes = pomodoroRecordRepository.sumFocusMinutesByUserIdAndRecordDate(userId, LocalDate.now());
        return PomodoroStudyTimeResponse.builder().totalFocusMinutes(minutes).build();
    }

    // 회원의 전체 누적 집중 시간(분)을 조회한다
    public PomodoroStudyTimeResponse getTotalStudyTime(Long userId) {
        Integer minutes = pomodoroRecordRepository.sumFocusMinutesByUserId(userId);
        return PomodoroStudyTimeResponse.builder().totalFocusMinutes(minutes).build();
    }

    // endedAt은 선택값(타이머 진행 중이면 아직 없음)이라 null이면 검증하지 않음
    private void validateTimeRange(LocalDateTime startedAt, LocalDateTime endedAt) {
        if (endedAt != null && endedAt.isBefore(startedAt)) {
            throw new BusinessException(ErrorCode.POMODORO_INVALID_TIME_RANGE);
        }
    }

    // 엔티티를 응답 DTO로 변환한다
    private PomodoroRecordResponse toResponse(PomodoroRecord record) {
        return PomodoroRecordResponse.builder()
                .id(record.getId())
                .userId(record.getUserId())
                .lectureId(record.getLectureId())
                .noteId(record.getNoteId())
                .focusMinutes(record.getFocusMinutes())
                .startedAt(record.getStartedAt())
                .endedAt(record.getEndedAt())
                .recordDate(record.getRecordDate())
                .createdAt(record.getCreatedAt())
                .build();
    }
}

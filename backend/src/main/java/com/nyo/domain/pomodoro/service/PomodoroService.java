package com.nyo.domain.pomodoro.service;

import com.nyo.domain.pomodoro.dto.PomodoroRecordRequest;
import com.nyo.domain.pomodoro.dto.PomodoroRecordResponse;
import com.nyo.domain.pomodoro.entity.PomodoroRecord;
import com.nyo.domain.pomodoro.repository.PomodoroRecordRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PomodoroService {

    private final PomodoroRecordRepository pomodoroRecordRepository;

    @Transactional
    public PomodoroRecordResponse create(Long userId, PomodoroRecordRequest request) {
        PomodoroRecord record = PomodoroRecord.builder()
                .userId(userId)
                .lectureId(request.getLectureId())
                .noteId(request.getNoteId())
                .focusMinutes(request.getFocusMinutes())
                .breakMinutes(request.getBreakMinutes())
                .startedAt(request.getStartedAt())
                .endedAt(request.getEndedAt())
                .build();

        return toResponse(pomodoroRecordRepository.save(record));
    }

    @Transactional
    public PomodoroRecordResponse update(Long id, PomodoroRecordRequest request) {
        PomodoroRecord record = pomodoroRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POMODORO_NOT_FOUND));

        record.update(request.getLectureId(), request.getNoteId(),
                request.getFocusMinutes(), request.getBreakMinutes(),
                request.getStartedAt(), request.getEndedAt());

        return toResponse(record);
    }

    public PageResponse<PomodoroRecordResponse> getRecords(Long userId, Pageable pageable) {
        return PageResponse.of(
                pomodoroRecordRepository.findByUserId(userId, pageable).map(this::toResponse));
    }

    private PomodoroRecordResponse toResponse(PomodoroRecord record) {
        return PomodoroRecordResponse.builder()
                .id(record.getId())
                .userId(record.getUserId())
                .lectureId(record.getLectureId())
                .noteId(record.getNoteId())
                .focusMinutes(record.getFocusMinutes())
                .breakMinutes(record.getBreakMinutes())
                .startedAt(record.getStartedAt())
                .endedAt(record.getEndedAt())
                .recordDate(record.getRecordDate())
                .createdAt(record.getCreatedAt())
                .build();
    }
}

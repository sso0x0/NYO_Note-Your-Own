package com.nyo.domain.pomodoro.service;

import com.nyo.domain.pomodoro.dto.PomodoroRecordResponse;
import com.nyo.domain.pomodoro.dto.PomodoroStudyTimeResponse;
import com.nyo.domain.pomodoro.entity.PomodoroRecord;
import com.nyo.domain.pomodoro.repository.PomodoroRecordRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PomodoroServiceTest {

    @Mock
    private PomodoroRecordRepository pomodoroRecordRepository;

    private PomodoroService pomodoroService;

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    PomodoroServiceTest() {
        // @InjectMocks 대신 명시적으로 생성 (필드 초기화 순서 이슈 방지)
    }

    private PomodoroService service() {
        if (pomodoroService == null) {
            pomodoroService = new PomodoroService(pomodoroRecordRepository);
        }
        return pomodoroService;
    }

    private PomodoroRecord newRecord(Long id, Long userId, LocalDateTime startedAt, LocalDateTime endedAt) throws Exception {
        PomodoroRecord record = PomodoroRecord.builder()
                .userId(userId)
                .focusMinutes(25)
                .breakMinutes(5)
                .startedAt(startedAt)
                .endedAt(endedAt)
                .build();
        // id는 @GeneratedValue라 리플렉션으로 세팅 (레포지토리가 mock이라 save 시 자동 채번되지 않음)
        Field idField = PomodoroRecord.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(record, id);
        return record;
    }

    // 1. 단건 조회
    @Test
    void getRecord_본인기록이면_정상반환() throws Exception {
        PomodoroRecord record = newRecord(10L, USER_ID, LocalDateTime.now(), null);
        when(pomodoroRecordRepository.findById(10L)).thenReturn(java.util.Optional.of(record));

        PomodoroRecordResponse response = service().getRecord(USER_ID, 10L);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getUserId()).isEqualTo(USER_ID);
    }

    @Test
    void getRecord_존재하지않으면_POMODORO_NOT_FOUND() {
        when(pomodoroRecordRepository.findById(999L)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> service().getRecord(USER_ID, 999L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.POMODORO_NOT_FOUND);
    }

    @Test
    void getRecord_다른사용자기록이면_POMODORO_ACCESS_DENIED() throws Exception {
        PomodoroRecord record = newRecord(10L, OTHER_USER_ID, LocalDateTime.now(), null);
        when(pomodoroRecordRepository.findById(10L)).thenReturn(java.util.Optional.of(record));

        assertThatThrownBy(() -> service().getRecord(USER_ID, 10L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.POMODORO_ACCESS_DENIED);
    }

    // 2. 기간별 조회
    @Test
    void getRecordsByPeriod_정상범위면_레포지토리에그대로위임() throws Exception {
        LocalDate start = LocalDate.of(2026, 7, 1);
        LocalDate end = LocalDate.of(2026, 7, 21);
        Pageable pageable = PageRequest.of(0, 10);
        PomodoroRecord record = newRecord(1L, USER_ID, LocalDateTime.of(2026, 7, 10, 9, 0), LocalDateTime.of(2026, 7, 10, 9, 25));
        Page<PomodoroRecord> page = new PageImpl<>(List.of(record), pageable, 1);

        when(pomodoroRecordRepository.findByUserIdAndRecordDateBetween(USER_ID, start, end, pageable))
                .thenReturn(page);

        var result = service().getRecordsByPeriod(USER_ID, start, end, pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
        verify(pomodoroRecordRepository).findByUserIdAndRecordDateBetween(USER_ID, start, end, pageable);
    }

    @Test
    void getRecordsByPeriod_종료일이시작일보다빠르면_POMODORO_INVALID_DATE_RANGE() {
        LocalDate start = LocalDate.of(2026, 7, 21);
        LocalDate end = LocalDate.of(2026, 7, 1);
        Pageable pageable = PageRequest.of(0, 10);

        assertThatThrownBy(() -> service().getRecordsByPeriod(USER_ID, start, end, pageable))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.POMODORO_INVALID_DATE_RANGE);
    }

    // 3. 오늘 공부시간
    @Test
    void getTodayStudyTime_오늘종료된세션의focusMinutes합계를반환() {
        when(pomodoroRecordRepository.sumFocusMinutesByUserIdAndRecordDate(eq(USER_ID), any(LocalDate.class)))
                .thenReturn(50);

        PomodoroStudyTimeResponse response = service().getTodayStudyTime(USER_ID);

        assertThat(response.getTotalFocusMinutes()).isEqualTo(50);
        verify(pomodoroRecordRepository).sumFocusMinutesByUserIdAndRecordDate(eq(USER_ID), eq(LocalDate.now()));
    }

    @Test
    void getTodayStudyTime_기록이없으면_0반환() {
        when(pomodoroRecordRepository.sumFocusMinutesByUserIdAndRecordDate(eq(USER_ID), any(LocalDate.class)))
                .thenReturn(0);

        PomodoroStudyTimeResponse response = service().getTodayStudyTime(USER_ID);

        assertThat(response.getTotalFocusMinutes()).isEqualTo(0);
    }

    // 4. 누적 공부시간
    @Test
    void getTotalStudyTime_전체종료된세션의focusMinutes합계를반환() {
        when(pomodoroRecordRepository.sumFocusMinutesByUserId(USER_ID)).thenReturn(325);

        PomodoroStudyTimeResponse response = service().getTotalStudyTime(USER_ID);

        assertThat(response.getTotalFocusMinutes()).isEqualTo(325);
    }
}

package com.nyo.domain.pomodoro.controller;

import com.nyo.domain.pomodoro.dto.PomodoroRecordResponse;
import com.nyo.domain.pomodoro.dto.PomodoroStudyTimeResponse;
import com.nyo.domain.pomodoro.service.PomodoroService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.exception.GlobalExceptionHandler;
import com.nyo.global.response.PageResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DB/JWT 없이 컨트롤러 라우팅·응답 형태만 검증하는 standalone MockMvc 테스트.
 * SecurityUtil.getCurrentUserId()가 principal을 Long으로 캐스팅해서 쓰기 때문에
 * SecurityContext에 TestingAuthenticationToken(userId, ...)을 직접 심어서 인증을 흉내낸다.
 */
class PomodoroControllerTest {

    private static final Long USER_ID = 1L;

    private MockMvc mockMvc;
    private PomodoroService pomodoroService;

    @BeforeEach
    void setUp() {
        pomodoroService = Mockito.mock(PomodoroService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new PomodoroController(pomodoroService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(USER_ID, null));
    }

    private PomodoroService pomodoroService() {
        return pomodoroService;
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void 단건조회_본인기록이면_200과데이터반환() throws Exception {
        PomodoroRecordResponse response = PomodoroRecordResponse.builder()
                .id(10L)
                .userId(USER_ID)
                .focusMinutes(25)
                .breakMinutes(5)
                .startedAt(LocalDateTime.now())
                .recordDate(LocalDate.now())
                .build();
        when(pomodoroService().getRecord(USER_ID, 10L)).thenReturn(response);

        mockMvc.perform(get("/api/pomodoros/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.userId").value(1));
    }

    @Test
    void 단건조회_존재하지않으면_404() throws Exception {
        when(pomodoroService().getRecord(eq(USER_ID), eq(999L)))
                .thenThrow(new BusinessException(ErrorCode.POMODORO_NOT_FOUND));

        mockMvc.perform(get("/api/pomodoros/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ErrorCode.POMODORO_NOT_FOUND.getMessage()));
    }

    @Test
    void 단건조회_다른사용자기록이면_403() throws Exception {
        when(pomodoroService().getRecord(eq(USER_ID), eq(5L)))
                .thenThrow(new BusinessException(ErrorCode.POMODORO_ACCESS_DENIED));

        mockMvc.perform(get("/api/pomodoros/5"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(ErrorCode.POMODORO_ACCESS_DENIED.getMessage()));
    }

    @Test
    void 기간별조회는_id경로와충돌하지않고_period로라우팅된다() throws Exception {
        var pageable = PageRequest.of(0, 20);
        PomodoroRecordResponse item = PomodoroRecordResponse.builder()
                .id(1L).userId(USER_ID).focusMinutes(25).breakMinutes(5)
                .startedAt(LocalDateTime.of(2026, 7, 10, 9, 0))
                .recordDate(LocalDate.of(2026, 7, 10))
                .build();
        PageResponse<PomodoroRecordResponse> pageResponse =
                PageResponse.of(new PageImpl<>(List.of(item), pageable, 1));

        when(pomodoroService().getRecordsByPeriod(eq(USER_ID), eq(LocalDate.of(2026, 7, 1)),
                eq(LocalDate.of(2026, 7, 21)), any()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/pomodoros/period")
                        .param("startDate", "2026-07-01")
                        .param("endDate", "2026-07-21"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void 기간별조회_종료일이시작일보다빠르면_400() throws Exception {
        when(pomodoroService().getRecordsByPeriod(eq(USER_ID), any(), any(), any()))
                .thenThrow(new BusinessException(ErrorCode.POMODORO_INVALID_DATE_RANGE));

        mockMvc.perform(get("/api/pomodoros/period")
                        .param("startDate", "2026-07-21")
                        .param("endDate", "2026-07-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(ErrorCode.POMODORO_INVALID_DATE_RANGE.getMessage()));
    }

    @Test
    void 오늘공부시간조회는_stats_today로라우팅되고_id경로와충돌하지않는다() throws Exception {
        when(pomodoroService().getTodayStudyTime(USER_ID))
                .thenReturn(PomodoroStudyTimeResponse.builder().totalFocusMinutes(50).build());

        mockMvc.perform(get("/api/pomodoros/stats/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalFocusMinutes").value(50));
    }

    @Test
    void 누적공부시간조회는_stats_total로라우팅된다() throws Exception {
        when(pomodoroService().getTotalStudyTime(USER_ID))
                .thenReturn(PomodoroStudyTimeResponse.builder().totalFocusMinutes(325).build());

        mockMvc.perform(get("/api/pomodoros/stats/total"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalFocusMinutes").value(325));
    }
}

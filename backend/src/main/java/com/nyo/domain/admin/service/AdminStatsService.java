package com.nyo.domain.admin.service;

import com.nyo.domain.common.dto.response.AdminSummaryResponse;
import com.nyo.domain.common.dto.response.DailyCountResponse;
import com.nyo.domain.common.dto.response.LecturePopularityResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 대시보드 통계. 다른 팀원 도메인 테이블(users/lectures/notes/posts)을
 * 집계만 하므로 엔티티 없이 JdbcTemplate 읽기 전용 조회로 처리합니다.
 */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final JdbcTemplate jdbcTemplate;

    private static final int MAX_DAYS = 365;
    private static final int MAX_LIMIT = 50;

    public AdminSummaryResponse getSummary() {
        return jdbcTemplate.queryForObject("""
                        SELECT
                            (SELECT COUNT(*) FROM users) AS total_users,
                            (SELECT COUNT(*) FROM lectures WHERE is_deleted = 0) AS total_lectures,
                            (SELECT COUNT(*) FROM notes WHERE is_deleted = 0) AS total_notes,
                            (SELECT COUNT(*) FROM posts WHERE is_deleted = 0) AS total_posts
                        FROM dual
                        """,
                (rs, rowNum) -> AdminSummaryResponse.builder()
                        .totalUsers(rs.getLong("total_users"))
                        .totalLectures(rs.getLong("total_lectures"))
                        .totalNotes(rs.getLong("total_notes"))
                        .totalPosts(rs.getLong("total_posts"))
                        .build());
    }

    public List<LecturePopularityResponse> getLecturePopularity(int limit) {
        int size = Math.min(Math.max(limit, 1), MAX_LIMIT);
        return jdbcTemplate.query("""
                        SELECT l.id, l.title, l.like_count, l.view_count, l.current_enrolled,
                               (SELECT COUNT(*) FROM notes n WHERE n.lecture_id = l.id AND n.is_deleted = 0) AS note_count
                        FROM lectures l
                        WHERE l.is_deleted = 0
                        ORDER BY l.like_count DESC, l.view_count DESC
                        FETCH FIRST ? ROWS ONLY
                        """,
                (rs, rowNum) -> LecturePopularityResponse.builder()
                        .lectureId(rs.getLong("id"))
                        .title(rs.getString("title"))
                        .likeCount(rs.getLong("like_count"))
                        .viewCount(rs.getLong("view_count"))
                        .currentEnrolled(rs.getLong("current_enrolled"))
                        .noteCount(rs.getLong("note_count"))
                        .build(),
                size);
    }

    // 노트 작성 현황 (일자별, 작성 시점 기준이라 이후 삭제된 노트도 포함)
    public List<DailyCountResponse> getDailyNoteCounts(int days) {
        return getDailyCounts("notes", days);
    }

    // 회원 가입 추이 (일자별)
    public List<DailyCountResponse> getDailySignupCounts(int days) {
        return getDailyCounts("users", days);
    }

    /**
     * created_at 기준 일자별 건수 집계. 그래프 x축이 끊기지 않도록 건수 없는 날은 0으로 채웁니다.
     * table은 내부 고정 값("notes", "users")만 들어오므로 SQL 조립에 안전합니다.
     */
    private List<DailyCountResponse> getDailyCounts(String table, int days) {
        int range = Math.min(Math.max(days, 1), MAX_DAYS);
        LocalDate start = LocalDate.now().minusDays(range - 1L);

        Map<LocalDate, Long> counts = new HashMap<>();
        jdbcTemplate.query(
                "SELECT TRUNC(created_at) AS stat_date, COUNT(*) AS cnt FROM " + table
                        + " WHERE created_at >= ? GROUP BY TRUNC(created_at)",
                rs -> {
                    counts.put(rs.getDate("stat_date").toLocalDate(), rs.getLong("cnt"));
                },
                Date.valueOf(start));

        List<DailyCountResponse> result = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(LocalDate.now()); date = date.plusDays(1)) {
            result.add(DailyCountResponse.builder()
                    .date(date)
                    .count(counts.getOrDefault(date, 0L))
                    .build());
        }
        return result;
    }
}

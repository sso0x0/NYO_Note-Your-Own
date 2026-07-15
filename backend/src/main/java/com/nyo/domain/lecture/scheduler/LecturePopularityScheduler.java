package com.nyo.domain.lecture.scheduler;

import com.nyo.domain.lecture.service.LectureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 인기 강의(isPopular) 정기 갱신 배치
@Slf4j
@Component
@RequiredArgsConstructor
public class LecturePopularityScheduler {

    private final LectureService lectureService;

    // 매시 정각 실행 (좋아요수/조회수는 실시간 캐시 갱신이므로 배치 주기는 필요에 따라 조정 가능)
    @Scheduled(cron = "0 0 * * * *")
    public void refreshPopularLectures() {
        log.info("[Lecture] 인기 강의 갱신 배치 시작");
        lectureService.refreshPopularLectures();
        log.info("[Lecture] 인기 강의 갱신 배치 완료");
    }
}

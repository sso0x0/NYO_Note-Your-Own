package com.nyo.domain.chat.repository;

import com.nyo.domain.chat.entity.ChatHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {

    Page<ChatHistory> findByUserId(Long userId, Pageable pageable);

    Page<ChatHistory> findByUserIdAndLectureId(Long userId, Long lectureId, Pageable pageable);

    // 멀티턴 대화 문맥용 최근 대화 (id 역순 = 최신순. created_at은 초 단위라 동순위 발생 가능)
    List<ChatHistory> findTop6ByUserIdAndLectureIdOrderByIdDesc(Long userId, Long lectureId);

    List<ChatHistory> findTop6ByUserIdAndLectureIdIsNullOrderByIdDesc(Long userId);

    // 선택 삭제: 요청 id 목록 중 본인 소유가 아닌 id는 조건에 안 걸려 조용히 무시된다
    void deleteByIdInAndUserId(List<Long> ids, Long userId);

    void deleteAllByUserId(Long userId);
}

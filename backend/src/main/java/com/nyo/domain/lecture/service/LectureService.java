package com.nyo.domain.lecture.service;

import com.nyo.domain.lecture.repository.LectureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LectureService {

    private final LectureRepository lectureRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "LectureService: 강의 등록·조회·수정·삭제 및 수강 관련 로직을 담당할 예정입니다.";
    }
}

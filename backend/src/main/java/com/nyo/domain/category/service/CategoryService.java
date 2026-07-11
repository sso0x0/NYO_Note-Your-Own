package com.nyo.domain.category.service;

import com.nyo.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "CategoryService: 노트/강의를 주제별로 분류하는 카테고리 등록·조회·수정·삭제를 담당할 예정입니다.";
    }
}

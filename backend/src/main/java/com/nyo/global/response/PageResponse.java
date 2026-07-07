package com.nyo.global.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 목록 API(강의 목록, 노트 목록, 게시글 목록 등)는 Page<Entity>를 그대로 리턴하지 말고
 * 이 DTO로 감싸서 반환하기로 통일. 프론트에서 페이지네이션 UI 만들 때 필요한 정보를 담고 있습니다.
 *
 * 사용 예)
 *   Page<Course> page = courseRepository.findAll(pageable);
 *   return ApiResponse.ok(PageResponse.of(page.map(CourseResponse::from)));
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}

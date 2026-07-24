package com.nyo.domain.post.dto;

import com.nyo.global.response.PageResponse;

import java.util.List;

// 공지 게시판 응답: 상단 최신 공지 3개와 일반 게시글 페이지를 한 응답으로 전달한다.
public record PostPageResponse(
        List<PostResponse> notices,
        List<PostResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static PostPageResponse of(List<PostResponse> notices, PageResponse<PostResponse> page) {
        return new PostPageResponse(
                notices, page.content(), page.page(), page.size(), page.totalElements(), page.totalPages(), page.last()
        );
    }
}

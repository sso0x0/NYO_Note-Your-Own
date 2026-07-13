package com.nyo.domain.post.service;

import com.nyo.domain.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "PostService: 커뮤니티 게시글 작성·조회·수정·삭제 로직을 담당할 예정입니다.";
    }
}

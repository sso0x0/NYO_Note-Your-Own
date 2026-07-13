package com.nyo.domain.comment.service;

import com.nyo.domain.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    /**
     * 이 서비스가 어떤 기능을 담당하는지 스스로 설명합니다.
     */
    public String introduce() {
        return "CommentService: 게시글에 달리는 댓글을 작성·조회·수정·삭제하는 로직을 담당할 예정입니다.";
    }
}

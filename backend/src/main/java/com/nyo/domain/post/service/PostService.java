package com.nyo.domain.post.service;

import com.nyo.domain.post.dto.PostRequest;
import com.nyo.domain.post.dto.PostResponse;
import com.nyo.domain.post.entity.Post;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public PostResponse create(Long userId, PostRequest request) {
        Post post = Post.create(
                userId,
                request.getTitle(),
                request.getContent(),
                request.getThumbnailUrl()
        );

        return toResponse(postRepository.save(post));
    }

    public List<PostResponse> findAll() {
        return postRepository.findByIsDeletedOrderByCreatedAtDesc(0)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PostResponse findOne(Long postId) {
        return toResponse(getPost(postId));
    }

    @Transactional
    public PostResponse update(Long postId, Long userId, PostRequest request) {
        Post post = getPost(postId);

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        post.update(request.getTitle(), request.getContent(), request.getThumbnailUrl());
        return toResponse(post);
    }

    @Transactional
    public void delete(Long postId, Long userId) {
        Post post = getPost(postId);

        if (!post.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        postRepository.delete(post);
    }

    private Post getPost(Long postId) {
        return postRepository.findByIdAndIsDeleted(postId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    private boolean isAdmin(Long userId) {
        try {
            String role = jdbcTemplate.queryForObject(
                    "SELECT role FROM users WHERE id = ?",
                    String.class,
                    userId
            );
            return "ADMIN".equals(role);
        } catch (EmptyResultDataAccessException e) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .title(post.getTitle())
                .content(post.getContent())
                .thumbnailUrl(post.getThumbnailUrl())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .isDeleted(post.isDeleted())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}

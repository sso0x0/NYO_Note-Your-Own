package com.nyo.domain.post.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.request.ImageRequest;
import com.nyo.domain.common.dto.request.ViewRequest;
import com.nyo.domain.common.entity.Image;
import com.nyo.domain.common.repository.ImageRepository;
import com.nyo.domain.common.service.LikeService;
import com.nyo.domain.common.service.ViewService;
import com.nyo.domain.post.document.PostDocument;
import com.nyo.domain.post.dto.PostRequest;
import com.nyo.domain.post.dto.PostResponse;
import com.nyo.domain.post.dto.PostPageResponse;
import com.nyo.domain.post.entity.Post;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.domain.post.repository.PostSearchRepository;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.storage.FileStorageService;
import com.nyo.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final PostSearchRepository postSearchRepository; // 커뮤니티 게시글 검색 색인 (Elasticsearch). 공지글은 색인하지 않는다.
    private final ImageRepository imageRepository;
    private final LikeService likeService;
    private final ViewService viewService;
    private final FileStorageService fileStorageService;
    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;

    @Transactional
    public PostResponse create(Long userId, PostRequest request) {
        boolean notice = Boolean.TRUE.equals(request.getNotice());
        // 관리자 공지 권한: 프론트 표시 여부와 무관하게 서버에서 ADMIN을 강제 검증한다.
        if (notice && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.NOTICE_ACCESS_DENIED);
        }

        // 게시글 기본 정보와 대표 이미지 URL을 posts 테이블에 저장할 객체로 만든다.
        Post post = Post.create(
                userId,
                request.getTitle(),
                request.getContent(),
                request.getThumbnailUrl(),
                notice
        );

        // 게시글을 먼저 저장해야 생성된 postId를 이미지 테이블에 연결할 수 있다.
        Post savedPost = postRepository.save(post);
        savePostImage(savedPost.getId(), request.getThumbnailUrl(), request.getImageOriginalName(), request.getImageFileSize());
        savePostContentImages(savedPost.getId(), request.getContentImages());
        // 공지글은 검색 대상에서 제외한다 (이미 상단에 별도로 노출됨).
        if (!notice) {
            indexPost(PostDocument.from(savedPost));
        }

        return toResponse(savedPost);
    }

    // 키워드로 게시글 검색 (Elasticsearch에서 관련도순 id를 찾은 뒤, DB에서 실제 데이터를 조회해 순서를 맞춘다). 공지글은 대상에서 제외.
    public PageResponse<PostResponse> searchPosts(String keyword, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return PageResponse.of(Page.empty(pageable));
        }

        // 검색 결과는 ES 관련도 점수순으로 정렬되므로 요청에 담긴 정렬 조건(sort)은 무시한다.
        Pageable searchPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        Page<PostDocument> searchResult = postSearchRepository.searchByKeyword(keyword, searchPageable);
        List<Long> ids = searchResult.getContent().stream().map(PostDocument::getId).toList();

        if (ids.isEmpty()) {
            return PageResponse.of(Page.empty(searchPageable));
        }

        Map<Long, Post> postsById = postRepository.findAllByIdInAndIsDeleted(ids, 0).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));

        Map<Long, String> nicknames = userService.getDisplayNicknames(
                postsById.values().stream().map(Post::getUserId).distinct().toList()
        );

        // ES가 매긴 관련도 순서를 유지하기 위해 id 순서대로 재조립 (DB와 색인이 일시적으로 어긋난 id는 건너뜀)
        List<PostResponse> content = ids.stream()
                .map(postsById::get)
                .filter(Objects::nonNull)
                .map(post -> toResponse(post, nicknames.getOrDefault(post.getUserId(), "알 수 없는 사용자")))
                .toList();

        // 건너뛴 id 수만큼 totalElements를 보정해 실제 반환된 content 개수와 어긋나지 않게 한다.
        long missing = ids.size() - content.size();
        long totalElements = searchResult.getTotalElements() - missing;

        return PageResponse.of(new PageImpl<>(content, searchPageable, totalElements));
    }

    // 전체 게시글로 검색 색인 재구축 (공지글은 제외). 색인 유실 복구, 초기 데이터 반영 등에 사용한다.
    @Transactional
    public void reindexAllPosts() {
        List<Post> posts = postRepository.findByIsDeletedAndIsNotice(0, 0, Pageable.unpaged()).getContent();
        List<PostDocument> documents = posts.stream().map(PostDocument::from).toList();

        postSearchRepository.deleteAll();
        postSearchRepository.saveAll(documents);
    }

    public PostPageResponse findAll(Pageable pageable, boolean noticeOnly) {
        if (noticeOnly) {
            // 공지만 보기: 클라이언트 정렬값과 관계없이 최종수정일 내림차순을 서버에서 강제한다.
            Pageable noticePageable = PageRequest.of(
                    pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "updatedAt")
            );
            PageResponse<PostResponse> noticePage = toPageResponse(
                    postRepository.findByIsDeletedAndIsNotice(0, 1, noticePageable)
            );
            return PostPageResponse.of(List.of(), noticePage);
        }

        // 공지 최종수정일 정렬: 가장 최근에 수정된 공지 3개를 일반 게시글 위에 전달한다.
        List<PostResponse> latestNotices = toResponseList(
                postRepository.findByIsDeletedAndIsNotice(
                        0, 1, PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "updatedAt"))
                ).getContent()
        );
        PageResponse<PostResponse> normalPage = toPageResponse(
                postRepository.findByIsDeletedAndIsNotice(0, 0, pageable)
        );
        return PostPageResponse.of(latestNotices, normalPage);
    }

    public PostResponse findOne(Long postId) {
        return toResponse(getPost(postId));
    }

    public boolean isLiked(Long postId, Long userId) {
        getPost(postId);
        return likeService.isLiked(userId, "POST", postId);
    }

    public boolean canCreateNotice(Long userId) {
        return isAdmin(userId);
    }

    @Transactional
    public void increaseViewCount(Long postId, Long userId) {
        getPost(postId);

        // common의 view_logs에 오늘 조회 기록이 없을 때만 posts.view_count를 증가시킨다.
        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("POST")
                .targetId(postId)
                .build());

        if (isNewView) {
            // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
            postRepository.increaseViewCountOnly(postId);
        }
    }

    @Transactional
    public void likePost(Long postId, Long userId) {
        getPost(postId);

        // common의 likes 테이블에 POST 좋아요 기록을 저장하고 캐시 카운트를 올린다.
        likeService.like(userId, LikeRequest.builder()
                .targetType("POST")
                .targetId(postId)
                .build());
        // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
        postRepository.increaseLikeCountOnly(postId);
    }

    @Transactional
    public void unlikePost(Long postId, Long userId) {
        getPost(postId);

        // common의 likes 테이블에서 POST 좋아요 기록을 삭제하고 캐시 카운트를 내린다.
        likeService.unlike(userId, LikeRequest.builder()
                .targetType("POST")
                .targetId(postId)
                .build());
        // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
        postRepository.decreaseLikeCountOnly(postId);
    }

    @Transactional
    public PostResponse update(Long postId, Long userId, PostRequest request) {
        Post post = getPost(postId);

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.POST_ACCESS_DENIED);
        }

        String previousThumbnailUrl = post.getThumbnailUrl();
        boolean notice = request.getNotice() == null ? post.isNotice() : Boolean.TRUE.equals(request.getNotice());
        if (notice && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.NOTICE_ACCESS_DENIED);
        }
        post.update(request.getTitle(), request.getContent(), request.getThumbnailUrl(), notice);
        saveChangedPostImage(postId, previousThumbnailUrl, request);
        savePostContentImages(postId, request.getContentImages());
        // 공지로 전환되면 검색 대상에서 빠지고, 일반 글로 남아있으면 색인 내용을 최신화한다.
        if (notice) {
            deindexPost(postId);
        } else {
            indexPost(PostDocument.from(post));
        }
        return toResponse(post);
    }

    @Transactional
    public void delete(Long postId, Long userId) {
        Post post = getPost(postId);

        if (!post.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.POST_ACCESS_DENIED);
        }

        deletePostImages(postId, post.getThumbnailUrl());
        // isDeleted 기반 소프트 삭제: comments 등 자식 데이터가 참조하는 row를 물리 삭제하지 않는다.
        post.delete();
        deindexPost(postId); // 검색 결과에서도 제외 (공지가 아니었다면 원래 있던 것만 지워짐)
    }

    // ES 색인 저장 실패가 게시글 생성/수정 트랜잭션 자체를 롤백시키지 않도록 격리한다.
    // 색인이 어긋나더라도 /api/admin/posts/reindex로 복구할 수 있으므로 예외를 삼키고 로그만 남긴다.
    private void indexPost(PostDocument document) {
        try {
            postSearchRepository.save(document);
        } catch (Exception e) {
            log.warn("게시글 검색 색인 저장 실패 (postId={})", document.getId(), e);
        }
    }

    // ES 색인 삭제 실패가 게시글 수정/삭제 트랜잭션 자체를 롤백시키지 않도록 격리한다.
    private void deindexPost(Long postId) {
        try {
            postSearchRepository.deleteById(postId);
        } catch (Exception e) {
            log.warn("게시글 검색 색인 삭제 실패 (postId={})", postId, e);
        }
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
        return toResponse(post, userService.getDisplayNickname(post.getUserId()));
    }

    private PostResponse toResponse(Post post, String authorNickname) {
        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorNickname(authorNickname)
                .title(post.getTitle())
                .content(post.getContent())
                .thumbnailUrl(post.getThumbnailUrl())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .isDeleted(post.isDeleted())
                .notice(post.isNotice())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private List<PostResponse> toResponseList(List<Post> posts) {
        // 게시글 nickname 표시: 페이지 작성자를 한 번에 조회해 반복 사용자 쿼리를 방지한다.
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                posts.stream().map(Post::getUserId).distinct().toList()
        );
        return posts.stream()
                .map(post -> toResponse(post, nicknames.getOrDefault(post.getUserId(), "알 수 없는 사용자")))
                .toList();
    }

    private PageResponse<PostResponse> toPageResponse(Page<Post> posts) {
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                posts.getContent().stream().map(Post::getUserId).distinct().toList()
        );
        return PageResponse.of(posts.map(
                post -> toResponse(post, nicknames.getOrDefault(post.getUserId(), "알 수 없는 사용자"))
        ));
    }

    private void savePostImage(Long postId, String imageUrl, String originalName, Long fileSize) {
        // 이미지가 없는 게시글이면 images 테이블에는 저장하지 않는다.
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 업로드된 이미지 URL, 원본 파일명, 파일 크기를 게시글 ID와 함께 images 테이블에 저장한다.
        imageRepository.save(Image.createForPost(postId, imageUrl, originalName, fileSize));
    }

    private void saveChangedPostImage(Long postId, String previousImageUrl, PostRequest request) {
        String newImageUrl = request.getThumbnailUrl();
        if (newImageUrl == null || newImageUrl.isBlank()
                || stripUrlFragment(newImageUrl).equals(stripUrlFragment(previousImageUrl))) {
            return;
        }

        deletePostImageUrl(postId, previousImageUrl);
        // 게시글 수정에서 이미지가 바뀌면 기존 GCS 이미지를 삭제하고 새 이미지 정보를 저장한다.
        imageRepository.save(Image.createForPost(postId, newImageUrl, request.getImageOriginalName(), request.getImageFileSize()));
    }

    private void savePostContentImages(Long postId, List<ImageRequest> contentImages) {
        if (contentImages == null || contentImages.isEmpty()) {
            return;
        }

        for (int i = 0; i < contentImages.size(); i++) {
            ImageRequest image = contentImages.get(i);
            if (image.getImageUrl() == null || image.getImageUrl().isBlank()) {
                continue;
            }

            // 본문 중간에 삽입된 여러 이미지를 순서와 함께 images 테이블에 저장한다.
            imageRepository.save(Image.createForPost(
                    postId,
                    image.getImageUrl(),
                    image.getOriginalName(),
                    image.getFileSize(),
                    image.getDisplayOrder() == null ? i + 1 : image.getDisplayOrder()
            ));
        }
    }

    private void deletePostImageUrl(Long postId, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 썸네일 교체 시에는 본문 이미지는 유지하고 기존 썸네일 URL만 GCS와 DB에서 삭제한다.
        fileStorageService.delete(imageUrl);
        imageRepository.deleteAll(imageRepository.findByPostIdAndImageUrl(postId, imageUrl));
    }

    // 메인 이미지 크기만 바뀌었을 때 같은 GCS 파일을 삭제하지 않도록 fragment를 제외해 비교한다.
    private String stripUrlFragment(String imageUrl) {
        if (imageUrl == null) {
            return "";
        }
        int fragmentIndex = imageUrl.indexOf('#');
        return fragmentIndex >= 0 ? imageUrl.substring(0, fragmentIndex) : imageUrl;
    }

    private void deletePostImages(Long postId, String thumbnailUrl) {
        List<Image> images = imageRepository.findByPostId(postId);
        Set<String> imageUrls = new LinkedHashSet<>();

        if (thumbnailUrl != null && !thumbnailUrl.isBlank()) {
            imageUrls.add(thumbnailUrl);
        }

        for (Image image : images) {
            imageUrls.add(image.getImageUrl());
        }

        for (String imageUrl : imageUrls) {
            // images 테이블과 게시글 대표 이미지 URL을 모두 확인해서 GCS 파일을 삭제한다.
            fileStorageService.delete(imageUrl);
        }

        imageRepository.deleteAll(images);
    }
}

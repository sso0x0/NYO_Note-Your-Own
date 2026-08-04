package com.nyo.domain.post.service;

import com.nyo.domain.common.dto.request.LikeRequest;
import com.nyo.domain.common.dto.request.ImageRequest;
import com.nyo.domain.common.dto.request.ViewRequest;
import com.nyo.domain.common.entity.Image;
import com.nyo.domain.common.repository.ImageRepository;
import com.nyo.domain.common.service.LikeService;
import com.nyo.domain.common.service.ViewService;
import com.nyo.domain.comment.repository.CommentRepository;
import com.nyo.domain.post.document.PostDocument;
import com.nyo.domain.post.dto.PostAdminResponse;
import com.nyo.domain.post.dto.PostRequest;
import com.nyo.domain.post.dto.PostResponse;
import com.nyo.domain.post.dto.PostPageResponse;
import com.nyo.domain.post.entity.Post;
import com.nyo.domain.post.repository.PostRepository;
import com.nyo.domain.post.repository.PostSearchRepository;
import com.nyo.domain.user.dto.UserResponse;
import com.nyo.domain.user.service.UserService;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import com.nyo.global.storage.FileStorageService;
import com.nyo.global.response.PageResponse;
import com.nyo.global.moderation.ProhibitedWordFilter;
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

// 커뮤니티 게시글 CRUD, 검색, 좋아요/조회수, 관리자 기능을 담당하는 서비스.
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {


    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ProhibitedWordFilter prohibitedWordFilter;
    private final PostSearchRepository postSearchRepository; // 커뮤니티 게시글 검색 색인 (Elasticsearch). 공지글은 색인하지 않는다.
    private final ImageRepository imageRepository;
    private final LikeService likeService;
    private final ViewService viewService;
    private final FileStorageService fileStorageService;
    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;

    // 게시글을 작성하고 이미지/검색 색인까지 함께 반영한다.
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
    public PageResponse<PostResponse> searchPosts(String keyword, String searchType, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return PageResponse.of(Page.empty(pageable));
        }

        // 검색 결과는 ES 관련도 점수순으로 정렬되므로 요청에 담긴 정렬 조건(sort)은 무시한다.
        Pageable searchPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        // 선택한 검색 종류에 따라 게시글 제목, 본문 또는 전체 필드를 검색한다.
        Page<PostDocument> searchResult = switch (searchType) {
            case "title" -> postSearchRepository.searchByTitle(keyword, searchPageable);
            case "content" -> postSearchRepository.searchByContent(keyword, searchPageable);
            case "author" -> Page.empty(searchPageable);
            default -> postSearchRepository.searchByKeyword(keyword, searchPageable);
        };
        List<Long> indexedIds = searchResult.getContent().stream().map(PostDocument::getId).toList();

        List<Long> nicknameUserIds = ("all".equals(searchType) || "author".equals(searchType))
                ? userService.findUserIdsByNickname(keyword.trim())
                : List.of();
        Page<Post> authorResult = nicknameUserIds.isEmpty()
                ? Page.empty(searchPageable)
                : postRepository.findByUserIdInAndIsDeletedAndIsNotice(nicknameUserIds, 0, 0, searchPageable);
        java.util.LinkedHashSet<Long> mergedIds = authorResult.getContent().stream()
                .map(Post::getId)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        mergedIds.addAll(indexedIds);
        List<Long> ids = List.copyOf(mergedIds);

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
        long totalElements = Math.max(
                searchResult.getTotalElements() - missing,
                authorResult.getTotalElements()
        );

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

    // 게시글 목록을 조회한다 (noticeOnly면 공지만, 아니면 최신 공지 3개 + 일반 게시글 페이지를 함께 반환).
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

    // 메인 페이지 "커뮤니티" 인기 목록 조회 (좋아요*5 + 조회수 가중치 점수 내림차순, 공지 제외)
    public PageResponse<PostResponse> getPopular(Pageable pageable) {
        return toPageResponse(postRepository.findPopular(pageable));
    }

    // 게시글 상세를 조회한다.
    public PostResponse findOne(Long postId) {
        return toResponse(getPost(postId));
    }

    // 마이페이지 - 내가 작성한 게시글 목록
    public PageResponse<PostResponse> getMyPosts(Long userId, Pageable pageable) {
        return toPageResponse(postRepository.findByUserIdAndIsDeleted(userId, 0, pageable));
    }

    // 관리자 게시글 관리 목록: 공지 여부와 관계없이 최신순으로 페이징하고, 작성자 상세 정보(이메일/권한 등)를 함께 내려준다.
    public Page<PostAdminResponse> adminGetPostList(Pageable pageable) {
        // 관리자 목록에는 삭제된 게시글도 포함해 isDeleted 상태를 확인할 수 있게 한다.
        // 일반 사용자용 조회는 기존 findByIsDeleted(0, ...) 조건을 그대로 사용한다.
        Page<Post> posts = postRepository.findAll(pageable);
        Map<Long, UserResponse> usersById = userService.adminGetUsersByIds(
                posts.getContent().stream().map(Post::getUserId).distinct().toList()
        );
        return posts.map(post -> toAdminResponse(post, usersById));
    }

    // 현재 사용자가 해당 게시글에 좋아요를 눌렀는지 확인한다.
    public boolean isLiked(Long postId, Long userId) {
        getPost(postId);
        return likeService.isLiked(userId, "POST", postId);
    }

    // 공지 게시글 작성 권한(관리자 여부)을 확인한다.
    public boolean canCreateNotice(Long userId) {
        return isAdmin(userId);
    }

    // 게시글 조회수를 증가시킨다 (중복 조회는 건너뜀).
    @Transactional
    public void increaseViewCount(Long postId, Long userId) {
        getPost(postId);

        // 조회할 때마다 posts.view_count를 증가시킨다.
        boolean isNewView = viewService.recordView(userId, ViewRequest.builder()
                .targetType("POST")
                .targetId(postId)
                .build());

        if (isNewView) {
            // 카운트 전용 쿼리라 최종 수정일(updatedAt)은 변경되지 않는다.
            postRepository.increaseViewCountOnly(postId);
        }
    }

    // 게시글에 좋아요를 등록한다.
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

    // 게시글 좋아요를 취소한다.
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

    // 게시글을 수정한다 (작성자 본인만 가능, 이미지/검색 색인도 함께 갱신).
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

    // 게시글을 소프트 삭제한다 (작성자 본인 또는 관리자만 가능).
    @Transactional
    public void delete(Long postId, Long userId) {
        Post post = getPost(postId);

        if (!post.getUserId().equals(userId) && !isAdmin(userId)) {
            throw new BusinessException(ErrorCode.POST_ACCESS_DENIED);
        }

        // isDeleted 기반 소프트 삭제: comments 등 자식 데이터가 참조하는 row를 물리 삭제하지 않는다.
        // 관리자 복구를 위해 GCS 이미지는 삭제하지 않고 그대로 보존한다.
        post.delete();
        // 게시글이 삭제되어도 연결된 댓글의 삭제 상태는 변경하지 않는다.
        // 게시글 자체가 사용자 화면에서 숨겨지므로 댓글도 노출되지 않고, 게시글 복구 시 기존 댓글 상태가 그대로 유지된다.
        deindexPost(postId); // 검색 결과에서도 제외 (공지가 아니었다면 원래 있던 것만 지워짐)
    }

    // 삭제된 게시글을 복구한다 (관리자 전용).
    @Transactional
    public void adminRestore(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        post.restore();
        // 게시글 삭제 시 댓글 상태를 바꾸지 않으므로 복구할 때도 댓글 상태를 변경하지 않는다.
        if (!post.isNotice()) {
            indexPost(PostDocument.from(post));
        }
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

    // 삭제되지 않은 게시글을 조회하고 없으면 예외를 던진다.
    private Post getPost(Long postId) {
        return postRepository.findByIdAndIsDeleted(postId, 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    // 사용자의 현재 DB 권한이 ADMIN인지 조회해 확인한다.
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

    // 작성자 닉네임을 조회해 채운 뒤 응답 DTO로 변환한다.
    private PostResponse toResponse(Post post) {
        return toResponse(post, userService.getDisplayNickname(post.getUserId()));
    }

    // 게시글 엔티티를 응답 DTO로 변환한다.
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
                // 목록과 상세에서 제목 옆에 표시할 현재 댓글 수입니다.
                .commentCount(commentRepository.countByPostIdAndIsDeleted(post.getId(), 0))
                .isDeleted(post.isDeleted())
                .notice(post.isNotice())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    // 게시글 엔티티와 작성자 정보를 묶어 관리자 응답 DTO로 변환한다.
    private PostAdminResponse toAdminResponse(Post post, Map<Long, UserResponse> usersById) {
        UserResponse author = usersById.get(post.getUserId());
        return PostAdminResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .authorLoginId(author != null ? author.getLoginId() : null)
                .authorNickname(author != null ? author.getNickname() : "알 수 없는 사용자")
                .authorEmail(author != null ? author.getEmail() : null)
                .authorRole(author != null ? author.getRole() : null)
                .authorStatus(author != null ? author.getStatus() : null)
                .title(post.getTitle())
                .content(post.getContent())
                .thumbnailUrl(post.getThumbnailUrl())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .prohibitedWords(prohibitedWordFilter.findMatchedWords(post.getTitle(), post.getContent()))
                .isDeleted(post.isDeleted())
                .notice(post.isNotice())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    // 게시글 목록을 응답 DTO 목록으로 변환한다.
    private List<PostResponse> toResponseList(List<Post> posts) {
        // 게시글 nickname 표시: 페이지 작성자를 한 번에 조회해 반복 사용자 쿼리를 방지한다.
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                posts.stream().map(Post::getUserId).distinct().toList()
        );
        return posts.stream()
                .map(post -> toResponse(post, nicknames.getOrDefault(post.getUserId(), "알 수 없는 사용자")))
                .toList();
    }

    // 게시글 페이지를 응답 DTO 페이지로 변환한다.
    private PageResponse<PostResponse> toPageResponse(Page<Post> posts) {
        Map<Long, String> nicknames = userService.getDisplayNicknames(
                posts.getContent().stream().map(Post::getUserId).distinct().toList()
        );
        return PageResponse.of(posts.map(
                post -> toResponse(post, nicknames.getOrDefault(post.getUserId(), "알 수 없는 사용자"))
        ));
    }

    // 게시글 대표 이미지 정보를 images 테이블에 저장한다.
    private void savePostImage(Long postId, String imageUrl, String originalName, Long fileSize) {
        // 이미지가 없는 게시글이면 images 테이블에는 저장하지 않는다.
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // 업로드된 이미지 URL, 원본 파일명, 파일 크기를 게시글 ID와 함께 images 테이블에 저장한다.
        imageRepository.save(Image.createForPost(postId, imageUrl, originalName, fileSize));
    }

    // 게시글 수정 시 대표 이미지가 바뀐 경우에만 기존 이미지를 삭제하고 새 이미지를 저장한다.
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

    // 게시글 본문에 삽입된 이미지들을 순서와 함께 저장한다.
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

    // 지정된 이미지 URL 하나를 GCS와 images 테이블에서 삭제한다.
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

    // 게시글에 연결된 모든 이미지(대표 이미지 포함)를 GCS와 DB에서 삭제한다.
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

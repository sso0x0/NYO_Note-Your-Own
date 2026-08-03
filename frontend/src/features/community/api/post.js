// 커뮤니티 게시글 목록/검색/상세/작성/수정/삭제, 좋아요, 조회수 등 게시글 관련 API 함수 모음
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/client';

// 게시글 목록을 페이지 단위로 조회 (공지 전용 여부, 정렬 옵션 지원)
export function getPostList({ page = 0, size = 10, noticeOnly = false, sort } = {}) {
  return apiGet('/api/posts', { page, size, noticeOnly, sort });
}

// 좋아요*5 + 조회수 가중치 점수 기준 인기 게시글 목록 (메인 페이지 "커뮤니티", 공지 제외)
export function getPopularPosts({ page = 0, size = 5 } = {}) {
  return apiGet('/api/posts/popular', { page, size });
}

// 키워드/검색 유형으로 게시글을 검색
export function searchPosts({ keyword, searchType = 'all', page = 0, size = 10 } = {}) {
  return apiGet('/api/posts/search', { keyword, searchType, page, size });
}

// 현재 사용자가 공지글을 작성할 수 있는 권한이 있는지 확인
export function canCreateNotice() {
  return apiGet('/api/posts/notice-permission');
}

// 게시글 상세 조회
export function getPost(postId) {
  return apiGet(`/api/posts/${postId}`);
}

// 게시글 작성
export function createPost(request) {
  return apiPost('/api/posts', request);
}

// 게시글 수정
export function updatePost(postId, request) {
  return apiPut(`/api/posts/${postId}`, request);
}

// 게시글 삭제
export function deletePost(postId) {
  return apiDelete(`/api/posts/${postId}`);
}

// 게시글 조회수 증가
export function increasePostViewCount(postId) {
  return apiPost(`/api/posts/${postId}/view`);
}

// 현재 사용자의 게시글 좋아요 여부 조회
export function isPostLiked(postId) {
  return apiGet(`/api/posts/${postId}/like`);
}

// 게시글에 좋아요 추가
export function likePost(postId) {
  return apiPost(`/api/posts/${postId}/like`);
}

// 게시글 좋아요 취소
export function unlikePost(postId) {
  return apiDelete(`/api/posts/${postId}/like`);
}

// 내 댓글 조회
export function getMyComments({ page = 0, size = 10 } = {}) {
  return apiGet('/api/comments/me', { page, size });
}
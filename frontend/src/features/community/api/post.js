import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/client';

export function getPostList({ page = 0, size = 10, noticeOnly = false, sort } = {}) {
  return apiGet('/api/posts', { page, size, noticeOnly, sort });
}

export function searchPosts({ keyword, page = 0, size = 10 } = {}) {
  return apiGet('/api/posts/search', { keyword, page, size });
}

export function canCreateNotice() {
  return apiGet('/api/posts/notice-permission');
}

export function getPost(postId) {
  return apiGet(`/api/posts/${postId}`);
}

export function createPost(request) {
  return apiPost('/api/posts', request);
}

export function updatePost(postId, request) {
  return apiPut(`/api/posts/${postId}`, request);
}

export function deletePost(postId) {
  return apiDelete(`/api/posts/${postId}`);
}

export function increasePostViewCount(postId) {
  return apiPost(`/api/posts/${postId}/view`);
}

export function isPostLiked(postId) {
  return apiGet(`/api/posts/${postId}/like`);
}

export function likePost(postId) {
  return apiPost(`/api/posts/${postId}/like`);
}

export function unlikePost(postId) {
  return apiDelete(`/api/posts/${postId}/like`);
}

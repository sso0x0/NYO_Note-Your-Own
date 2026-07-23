import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../api/client';

export function getSummary() {
  return apiGet('/api/admin/stats/summary');
}

export function getLecturePopularity({ limit = 10 } = {}) {
  return apiGet('/api/admin/stats/lectures/popularity', { limit });
}

export function getDailyNoteCounts({ days = 30 } = {}) {
  return apiGet('/api/admin/stats/notes/daily', { days });
}

export function getDailySignupCounts({ days = 30 } = {}) {
  return apiGet('/api/admin/stats/users/daily', { days });
}

export function getUserList({ page = 0, size = 20 } = {}) {
  return apiGet('/api/admin/users', { page, size });
}

export function getUser(userId) {
  return apiGet(`/api/admin/users/${userId}`);
}

export function changeUserRole(userId, role) {
  return apiPatch(`/api/admin/users/${userId}/role`, { role });
}

export function sanctionUser(request) {
  return apiPost('/api/admin/users/sanctions', request);
}

export function getSanctionHistory(userId) {
  return apiGet(`/api/admin/users/${userId}/sanctions`);
}

export function createLecture(request) {
  return apiPost('/api/admin/lectures', request);
}

export function updateLecture(id, request) {
  return apiPut(`/api/admin/lectures/${id}`, request);
}

export function deleteLecture(id) {
  return apiDelete(`/api/admin/lectures/${id}`);
}

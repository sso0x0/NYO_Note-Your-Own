import { apiGet } from './client';

export function getLectureList({ page = 0, size = 20, categoryId } = {}) {
  return apiGet('/api/lectures', { page, size, categoryId });
}

export function getLecture(id) {
  return apiGet(`/api/lectures/${id}`);
}

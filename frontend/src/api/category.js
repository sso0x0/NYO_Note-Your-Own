import { apiGet } from './client';

export function getCategoryList() {
  return apiGet('/api/categories');
}

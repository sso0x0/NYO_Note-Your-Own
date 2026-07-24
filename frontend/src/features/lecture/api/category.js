import { apiGet } from '../../../api/client';

export function getCategoryList() {
  return apiGet('/api/categories');
}

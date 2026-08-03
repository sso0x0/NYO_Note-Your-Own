// 강의 카테고리 목록 조회 API 래퍼.
import { apiGet } from '../../../api/client';

export function getCategoryList() {
  return apiGet('/api/categories');
}

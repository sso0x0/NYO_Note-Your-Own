import { apiGet, apiPut, apiDelete } from '../../../api/client';

export function getMyInfo() {
  return apiGet('/api/users/me');
}

export function updateMyProfile(request) {
  return apiPut('/api/users/me', request);
}

export function withdraw() {
  return apiDelete('/api/users/me');
}

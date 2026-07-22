import { apiPost } from './client';

export function signup(request) {
  return apiPost('/api/users/signup', request);
}

export function login(request) {
  return apiPost('/api/users/login', request);
}

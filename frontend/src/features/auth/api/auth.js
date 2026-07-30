import { apiPost } from '../../../api/client';

export function signup(request) {
  return apiPost('/api/users/signup', request);
}

export function login(request) {
  return apiPost('/api/users/login', request);
}

export function findLoginId(request) {
  return apiPost('/api/users/find-id', request);
}

export function sendPasswordResetCode(request) {
  return apiPost('/api/users/password/send-code', request);
}

export function resetPassword(request) {
  return apiPost('/api/users/password/reset', request);
}
export function verifyPasswordResetCode(request) {
  return apiPost('/api/users/password/verify-code', request);
}
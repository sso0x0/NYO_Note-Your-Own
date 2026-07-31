// 회원 인증 관련 API 호출 모음 (아이디 찾기 / 비밀번호 재설정 흐름 포함)
import { apiPost } from '../../../api/client';

// 회원가입
export function signup(request) {
  return apiPost('/api/users/signup', request);
}

// 로그인
export function login(request) {
  return apiPost('/api/users/login', request);
}

// 아이디 찾기: 이름+이메일 일치 확인 후 마스킹된 아이디 반환
export function findLoginId(request) {
  return apiPost('/api/users/find-id', request);
}

// 비밀번호 재설정 1단계: 아이디+휴대폰번호 확인 후 SMS로 인증코드 발송
export function sendPasswordResetCode(request) {
  return apiPost('/api/users/password/send-code', request);
}

// 비밀번호 재설정 2단계: 인증코드 검증 후 새 비밀번호로 교체
export function resetPassword(request) {
  return apiPost('/api/users/password/reset', request);
}
// 비밀번호 재설정 1.5단계: 최종 제출 전에 인증코드만 미리 확인
export function verifyPasswordResetCode(request) {
  return apiPost('/api/users/password/verify-code', request);
}
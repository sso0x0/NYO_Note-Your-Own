// 마이페이지(본인 정보) 관련 API 호출 모음 - JWT로 본인 확인하므로 userId를 따로 넘기지 않는다
import { apiGet, apiPut, apiDelete } from '../../../api/client';

// 내 정보 조회
export function getMyInfo() {
  return apiGet('/api/users/me');
}

// 내 정보 수정 (이름/닉네임/전화번호, 선택적으로 비밀번호 변경)
export function updateMyProfile(request) {
  return apiPut('/api/users/me', request);
}

// 회원 탈퇴 (소프트 딜리트)
export function withdraw() {
  return apiDelete('/api/users/me');
}

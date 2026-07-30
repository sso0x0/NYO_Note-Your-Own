import { apiGet, apiPost } from '../../../api/client';

export function createInstructorApplication(request) {
  return apiPost('/api/instructor-applications', request);
}

export function getMyInstructorApplications(params = {}) {
  return apiGet('/api/instructor-applications/me', params);
}

import { apiGet, apiPost } from '../../../api/client';

export function createInstructorApplication(request) {
  return apiPost('/api/instructor-applications', request);
}

export function getMyInstructorApplications(params = {}) {
  return apiGet('/api/instructor-applications/me', params);
}

export function getAdminInstructorApplications(params = {}) {
  return apiGet('/api/admin/instructor-applications', params);
}

export function approveInstructorApplication(applicationId) {
  return apiPost(`/api/admin/instructor-applications/${applicationId}/approve`);
}

export function rejectInstructorApplication(applicationId, reason) {
  return apiPost(`/api/admin/instructor-applications/${applicationId}/reject`, { reason });
}

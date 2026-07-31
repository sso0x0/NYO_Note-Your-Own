import { Fragment, useEffect, useRef, useState } from 'react';
import {
  approveInstructorApplication,
  getAdminInstructorApplications,
  rejectInstructorApplication,
} from '../../instructor/api/instructorApplication';
import { usePagedList } from '../hooks/usePagedList';
import './AdminInstructorApplicationsPage.css';

const PAGE_SIZE = 10;

const STATUS_LABEL = {
  PENDING: '심사 대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

function AdminInstructorApplicationsPage() {
  const [status, setStatus] = useState('');
  const applications = usePagedList(({ page, size }) =>
    getAdminInstructorApplications({ page, size, status: status || undefined })
  );
  const [expandedId, setExpandedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const firstFilterRender = useRef(true);
  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false;
      return;
    }
    applications.setPage(0);
    applications.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleToggle = (applicationId) => {
    setExpandedId((prev) => (prev === applicationId ? null : applicationId));
  };

  const handleApprove = async (application) => {
    if (!window.confirm(`${application.applicantNickname}님의 강사 신청을 승인할까요?`)) return;
    setProcessingId(application.id);
    try {
      await approveInstructorApplication(application.id);
      applications.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (application) => {
    const reason = window.prompt(`${application.applicantNickname}님의 강사 신청을 반려하는 사유를 입력해 주세요.`);
    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert('반려 사유를 입력해 주세요.');
      return;
    }

    setProcessingId(application.id);
    try {
      await rejectInstructorApplication(application.id, reason.trim());
      applications.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const items = applications.pageData?.content ?? [];
  const fillerCount = Math.max(0, PAGE_SIZE - items.length - (items.length === 0 ? 1 : 0));

  return (
    <div className="admin-page">
      <div className="admin-page__scroll">
        <div className="admin-toolbar">
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">전체 상태</option>
            <option value="PENDING">심사 대기중</option>
            <option value="APPROVED">승인됨</option>
            <option value="REJECTED">반려됨</option>
          </select>
        </div>

        {applications.status === 'loading' && <p>불러오는 중...</p>}
        {applications.status === 'error' && <p role="alert">불러오지 못했습니다: {applications.error}</p>}

        {applications.status === 'success' && applications.pageData && (
          <table className="admin-table admin-table--instructor-application">
            <thead>
              <tr>
                <th>번호</th>
                <th>신청자</th>
                <th>전문 분야</th>
                <th>경력</th>
                <th>소속/직함</th>
                <th>신청일</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((application, index) => (
                <Fragment key={application.id}>
                  <tr>
                    <td>{applications.pageData.number * PAGE_SIZE + index + 1}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-table__title-btn"
                        onClick={() => handleToggle(application.id)}
                      >
                        {application.applicantNickname}
                      </button>
                    </td>
                    <td>{application.categoryName}</td>
                    <td>{application.careerYears != null ? `${application.careerYears}년` : '-'}</td>
                    <td>{application.company || '-'}</td>
                    <td>{application.createdAt?.slice(0, 10)}</td>
                    <td>
                      <span
                        className={
                          'admin-instructor-application__status-badge admin-instructor-application__status-badge--' +
                          application.status.toLowerCase()
                        }
                      >
                        {STATUS_LABEL[application.status] ?? application.status}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {application.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--primary"
                            disabled={processingId === application.id}
                            onClick={() => handleApprove(application)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--danger"
                            disabled={processingId === application.id}
                            onClick={() => handleReject(application)}
                          >
                            반려
                          </button>
                        </>
                      ) : (
                        <span className="admin-instructor-application__reviewed-at">
                          {application.reviewedAt?.slice(0, 10) ?? '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedId === application.id && (
                    <tr>
                      <td colSpan={8}>
                        <div className="admin-detail-wrap">
                          <dl className="admin-instructor-application__summary">
                            <dt>경력 및 소개</dt>
                            <dd>{application.bio || '-'}</dd>
                            <dt>신청 동기</dt>
                            <dd>{application.motivation || '-'}</dd>
                            {application.curriculum && (
                              <>
                                <dt>강의 계획 소개</dt>
                                <dd>{application.curriculum}</dd>
                              </>
                            )}
                            {application.status === 'REJECTED' && (
                              <>
                                <dt>반려 사유</dt>
                                <dd className="admin-instructor-application__reject-reason">
                                  {application.rejectReason || '-'}
                                </dd>
                              </>
                            )}
                          </dl>
                          <dl className="admin-author-info">
                            <div>
                              <dt>유저 ID</dt>
                              <dd>{application.applicantId}</dd>
                            </div>
                            <div>
                              <dt>포트폴리오</dt>
                              <dd>
                                {application.portfolioUrl ? (
                                  <a href={application.portfolioUrl} target="_blank" rel="noreferrer">
                                    링크 보기
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>첨부파일</dt>
                              <dd>
                                {application.attachmentUrl ? (
                                  <a href={application.attachmentUrl} target="_blank" rel="noreferrer">
                                    {application.attachmentName || '첨부파일 보기'}
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>개인정보 동의</dt>
                              <dd>{application.privacyConsent ? '동의' : '미동의'}</dd>
                            </div>
                            <div>
                              <dt>심사일</dt>
                              <dd>{application.reviewedAt?.slice(0, 10) ?? '-'}</dd>
                            </div>
                          </dl>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-instructor-application__empty">
                    접수된 강사 신청이 없습니다.
                  </td>
                </tr>
              )}
              {Array.from({ length: fillerCount }).map((_, i) => (
                <tr key={`filler-${i}`} className="admin-filler-row" aria-hidden="true">
                  <td colSpan={8}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {applications.status === 'success' && applications.pageData && (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-btn"
            onClick={() => applications.setPage((p) => Math.max(0, p - 1))}
            disabled={applications.pageData.first}
          >
            이전
          </button>
          <span>
            {applications.pageData.number + 1} / {Math.max(applications.pageData.totalPages, 1)}
          </span>
          <button
            type="button"
            className="admin-btn"
            onClick={() => applications.setPage((p) => p + 1)}
            disabled={applications.pageData.last}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminInstructorApplicationsPage;

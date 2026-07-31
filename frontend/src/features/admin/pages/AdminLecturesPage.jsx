import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminLectureList } from '../api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { approveLecture, deleteLecture, rejectLecture, restoreLecture } from '../api/admin';
import { usePagedList } from '../hooks/usePagedList';
import RejectReasonModal from '../components/RejectReasonModal';
import './AdminLecturesPage.css';

const PAGE_SIZE = 10;

const STATUS_LABEL = {
  PENDING: '심사 대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

function AdminLecturesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const lectures = usePagedList(({ page, size }) =>
    getAdminLectureList({ page, size, categoryId: categoryId || undefined, status: status || undefined })
  );
  const [expandedLectureId, setExpandedLectureId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    getCategoryList().then(setCategories).catch(() => setCategories([]));
  }, []);

  // usePagedList는 page/reload 변경에만 반응하므로, 필터를 바꾸면
  // 1페이지로 되돌리고 reload()로 최신 필터값을 반영해 다시 조회한다.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    lectures.setPage(0);
    lectures.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, status]);

  const handleToggle = (lectureId) => {
    setExpandedLectureId((prev) => (prev === lectureId ? null : lectureId));
  };

  const handleDelete = async (lecture) => {
    if (!window.confirm(`"${lecture.title}" 강의를 삭제할까요?`)) return;

    try {
      await deleteLecture(lecture.id);
      lectures.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestore = async (lecture) => {
    if (!window.confirm('복구하시겠습니까?')) return;

    try {
      await restoreLecture(lecture.id);
      lectures.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (lecture) => {
    if (!window.confirm(`"${lecture.title}" 강의 등록 신청을 승인할까요?`)) return;
    setProcessingId(lecture.id);
    try {
      await approveLecture(lecture.id);
      lectures.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (lecture) => {
    setRejectTarget(lecture);
  };

  const confirmReject = async (reason) => {
    const lecture = rejectTarget;
    setProcessingId(lecture.id);
    try {
      await rejectLecture(lecture.id, reason);
      setRejectTarget(null);
      lectures.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-lecture-filter">
          <select
            className="admin-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <span className="admin-lecture-filter__arrow" aria-hidden="true">›</span>
          <select
            className="admin-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">전체 상태</option>
            <option value="PENDING">심사 대기중</option>
            <option value="APPROVED">승인됨</option>
            <option value="REJECTED">반려됨</option>
          </select>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => navigate('/admin/lectures/new')}>새 강의 등록</button>
      </div>

      <div className="admin-page__scroll">
        {lectures.status === 'loading' && <p>불러오는 중...</p>}
        {lectures.status === 'error' && <p role="alert">불러오지 못했습니다: {lectures.error}</p>}

        {lectures.status === 'success' && lectures.pageData && (
          <table className="admin-table admin-table--lecture">
            <thead>
              <tr>
                <th>번호</th>
                <th>ID</th>
                <th>카테고리</th>
                <th>강의명</th>
                <th>강사</th>
                <th>등록자</th>
                <th>수강</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lectures.pageData.content.map((lecture, index) => (
                <Fragment key={lecture.id}>
                  <tr className={lecture.isDeleted ? 'admin-row--deleted' : undefined}>
                    <td>{lectures.page * PAGE_SIZE + index + 1}</td>
                    <td>{lecture.id}</td>
                    <td>{lecture.categoryName}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(lecture.id)}>
                        {lecture.title} {lecture.isDeleted && <span className="admin-deleted-label">(삭제됨)</span>}
                      </button>
                    </td>
                    <td>{lecture.instructor}</td>
                    <td>{lecture.createdByNickname ?? '-'}</td>
                    <td>{lecture.currentEnrolled}{lecture.capacity != null ? ` / ${lecture.capacity}` : ''}</td>
                    <td>
                      <span
                        className={
                          'admin-lecture__status-badge admin-lecture__status-badge--' + lecture.status.toLowerCase()
                        }
                      >
                        {STATUS_LABEL[lecture.status] ?? lecture.status}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {lecture.isDeleted ? (
                        <button type="button" className="admin-deleted-button" onClick={() => handleRestore(lecture)}>삭제됨</button>
                      ) : lecture.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--primary"
                            disabled={processingId === lecture.id}
                            onClick={() => handleApprove(lecture)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--danger"
                            disabled={processingId === lecture.id}
                            onClick={() => handleReject(lecture)}
                          >
                            반려
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="admin-btn admin-btn--sm" onClick={() => navigate(`/admin/lectures/${lecture.id}/edit`)}>수정</button>
                          <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(lecture)}>삭제</button>
                        </>
                      )}
                    </td>
                  </tr>
                  {expandedLectureId === lecture.id && (
                    <tr>
                      <td colSpan={9}>
                        <div className="admin-detail-wrap">
                          <div className="admin-lecture__detail">
                            {lecture.thumbnailUrl && (
                              <img
                                className="admin-lecture__thumbnail"
                                src={lecture.thumbnailUrl}
                                alt={`${lecture.title} 썸네일`}
                              />
                            )}
                            <dl className="admin-lecture__summary">
                              <dt>강의 설명</dt>
                              <dd>{lecture.description || '-'}</dd>
                              <dt>강의 URL</dt>
                              <dd>
                                {lecture.lectureUrl ? (
                                  <a href={lecture.lectureUrl} target="_blank" rel="noreferrer">{lecture.lectureUrl}</a>
                                ) : (
                                  '-'
                                )}
                              </dd>
                              <dt>복습용 URL</dt>
                              <dd>
                                {lecture.reviewUrl ? (
                                  <a href={lecture.reviewUrl} target="_blank" rel="noreferrer">{lecture.reviewUrl}</a>
                                ) : (
                                  '-'
                                )}
                              </dd>
                            </dl>
                          </div>
                          <dl className="admin-author-info">
                            <div>
                              <dt>노트 개수</dt>
                              <dd>{lecture.noteCount ?? 0}</dd>
                            </div>
                            <div>
                              <dt>댓글 개수</dt>
                              <dd>{lecture.commentCount ?? 0}</dd>
                            </div>
                            <div>
                              <dt>조회수</dt>
                              <dd>{lecture.viewCount ?? 0}</dd>
                            </div>
                            <div>
                              <dt>좋아요수</dt>
                              <dd>{lecture.likeCount ?? 0}</dd>
                            </div>
                            <div>
                              <dt>인기 강의</dt>
                              <dd>{lecture.isPopular ? '예' : '아니오'}</dd>
                            </div>
                            {lecture.status !== 'PENDING' && (
                              <div>
                                <dt>심사일</dt>
                                <dd>{lecture.reviewedAt?.slice(0, 10) ?? '-'}</dd>
                              </div>
                            )}
                            {lecture.status === 'REJECTED' && (
                              <div>
                                <dt>반려 사유</dt>
                                <dd className="admin-lecture__reject-reason">{lecture.rejectReason || '-'}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {/* 데이터가 적은 페이지(특히 마지막 페이지)에서도 표 높이가 항상 동일하도록
                  빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다. */}
              {Array.from({ length: Math.max(0, PAGE_SIZE - lectures.pageData.content.length) }).map((_, i) => (
                <tr key={`filler-${i}`} className="admin-filler-row" aria-hidden="true">
                  <td colSpan={9}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lectures.status === 'success' && lectures.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => lectures.setPage((p) => Math.max(0, p - 1))} disabled={lectures.pageData.first}>
            이전
          </button>
          <span>{lectures.pageData.number + 1} / {Math.max(lectures.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => lectures.setPage((p) => p + 1)} disabled={lectures.pageData.last}>
            다음
          </button>
        </div>
      )}

      <RejectReasonModal
        open={!!rejectTarget}
        title={rejectTarget ? `"${rejectTarget.title}" 강의 등록 신청을 반려하는 사유를 입력해 주세요.` : ''}
        submitting={processingId === rejectTarget?.id}
        onCancel={() => setRejectTarget(null)}
        onSubmit={confirmReject}
      />
    </div>
  );
}

export default AdminLecturesPage;

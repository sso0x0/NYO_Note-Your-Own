import { Fragment, useState } from 'react';
import { getUserList, changeUserRole, sanctionUser, getSanctionHistory } from '../api/admin';
import { usePagedList } from '../hooks/usePagedList';
import './AdminUsersPage.css';

const PAGE_SIZE = 10;

const SANCTION_TYPES = [
  { value: 'WARNING', label: '경고' },
  { value: 'SUSPENSION', label: '정지' },
  { value: 'WITHDRAWAL', label: '강제 탈퇴' },
];

function SanctionPanel({ user, onDone }) {
  const [type, setType] = useState('WARNING');
  const [reason, setReason] = useState('');
  const [endAt, setEndAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = () => {
    setHistoryLoading(true);
    getSanctionHistory(user.id)
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setHistoryLoading(false));
  };

  const handleRoleChange = async (nextRole) => {
    setError(null);
    try {
      await changeUserRole(user.id, nextRole);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSanctionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await sanctionUser({
        userId: user.id,
        type,
        reason,
        endAt: type === 'SUSPENSION' && endAt ? new Date(endAt).toISOString() : null,
      });
      setReason('');
      setEndAt('');
      onDone();
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-users__panel">
      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="admin-users__panel-block">
        <h4 className="admin-section-title">권한 변경</h4>
        <div className="admin-users__role-actions">
          <button type="button" className="admin-btn" disabled={user.role === 'USER'} onClick={() => handleRoleChange('USER')}>
            일반회원으로 변경
          </button>
          <button type="button" className="admin-btn" disabled={user.role === 'ADMIN'} onClick={() => handleRoleChange('ADMIN')}>
            관리자로 변경
          </button>
        </div>
      </div>

      <div className="admin-users__panel-block">
        <h4 className="admin-section-title">제재 등록</h4>
        <form className="admin-users__sanction-form" onSubmit={handleSanctionSubmit}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {SANCTION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="제재 사유"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          {type === 'SUSPENSION' && (
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              title="정지 해제 예정일 (비워두면 무기한 정지)"
            />
          )}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>{submitting ? '등록 중...' : '제재 등록'}</button>
        </form>
      </div>

      <div className="admin-users__panel-block">
        <div className="admin-users__history-header">
          <h4 className="admin-section-title">제재 이력</h4>
          <button type="button" className="admin-btn admin-btn--sm" onClick={loadHistory} disabled={historyLoading}>
            {historyLoading ? '불러오는 중...' : '이력 보기'}
          </button>
        </div>
        {history && (
          history.length === 0 ? (
            <p>제재 이력이 없습니다.</p>
          ) : (
            <ul className="admin-users__history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <strong>{SANCTION_TYPES.find((t) => t.value === item.type)?.label ?? item.type}</strong>
                  {' - '}{item.reason}
                  <span className="admin-users__history-meta">
                    {' '}({item.startAt?.slice(0, 10)}{item.endAt ? ` ~ ${item.endAt.slice(0, 10)}` : ''})
                  </span>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function AdminUsersPage() {
  const users = usePagedList(getUserList);
  const [expandedUserId, setExpandedUserId] = useState(null);

  const handleToggle = (userId) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  const handlePanelDone = () => {
    users.reload();
  };

  return (
    <div className="admin-page">
      <div className="admin-page__scroll">
        <div className="admin-toolbar" />
        {users.status === 'loading' && <p>불러오는 중...</p>}
        {users.status === 'error' && <p role="alert">불러오지 못했습니다: {users.error}</p>}

        {users.status === 'success' && users.pageData && (
          <table className="admin-table admin-table--user">
            <thead>
              <tr>
                <th>번호</th>
                <th>ID</th>
                <th>아이디</th>
                <th>닉네임</th>
                <th>이메일</th>
                <th>권한</th>
                <th>상태</th>
                <th>가입일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.pageData.content.map((user, index) => (
                <Fragment key={user.id}>
                  <tr>
                    <td>{users.page * PAGE_SIZE + index + 1}</td>
                    <td>{user.id}</td>
                    <td>{user.loginId}</td>
                    <td>{user.nickname}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{user.createdAt?.slice(0, 10)}</td>
                    <td>
                      <button type="button" className="admin-btn admin-btn--sm" onClick={() => handleToggle(user.id)}>
                        {expandedUserId === user.id ? '닫기' : '관리'}
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === user.id && (
                    <tr>
                      <td colSpan={9}>
                        <SanctionPanel user={user} onDone={handlePanelDone} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {/* 데이터가 적은 페이지(특히 마지막 페이지)에서도 표 높이가 항상 동일하도록
                  빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다. */}
              {Array.from({ length: Math.max(0, PAGE_SIZE - users.pageData.content.length) }).map((_, i) => (
                <tr key={`filler-${i}`} className="admin-filler-row" aria-hidden="true">
                  <td colSpan={9}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 회원 관리 패널을 펼쳐 봐도 표 영역만 스크롤되고, 이전/다음 버튼은 화면의 같은 위치에 그대로 남는다. */}
      {users.status === 'success' && users.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => users.setPage((p) => Math.max(0, p - 1))} disabled={users.pageData.first}>
            이전
          </button>
          <span>{users.pageData.number + 1} / {Math.max(users.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => users.setPage((p) => p + 1)} disabled={users.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;

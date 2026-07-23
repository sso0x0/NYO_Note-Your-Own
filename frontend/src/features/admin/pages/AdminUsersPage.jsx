import { Fragment, useEffect, useState } from 'react';
import { getUserList, changeUserRole, sanctionUser, getSanctionHistory } from '../api/admin';
import './AdminUsersPage.css';

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
      {error && <p className="admin-users__error" role="alert">{error}</p>}

      <div className="admin-users__panel-block">
        <h4>권한 변경</h4>
        <div className="admin-users__role-actions">
          <button type="button" disabled={user.role === 'USER'} onClick={() => handleRoleChange('USER')}>
            일반회원으로 변경
          </button>
          <button type="button" disabled={user.role === 'ADMIN'} onClick={() => handleRoleChange('ADMIN')}>
            관리자로 변경
          </button>
        </div>
      </div>

      <div className="admin-users__panel-block">
        <h4>제재 등록</h4>
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
          <button type="submit" disabled={submitting}>{submitting ? '등록 중...' : '제재 등록'}</button>
        </form>
      </div>

      <div className="admin-users__panel-block">
        <div className="admin-users__history-header">
          <h4>제재 이력</h4>
          <button type="button" onClick={loadHistory} disabled={historyLoading}>
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
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    getUserList({ page })
      .then((data) => {
        if (cancelled) return;
        setPageData(data);
        setStatus('success');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const handleToggle = (userId) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  const handlePanelDone = () => {
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="admin-users">
      <h3>회원 관리</h3>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">불러오지 못했습니다: {error}</p>}

      {status === 'success' && pageData && (
        <>
          <table className="admin-users__table">
            <thead>
              <tr>
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
              {pageData.content.map((user) => (
                <Fragment key={user.id}>
                  <tr>
                    <td>{user.id}</td>
                    <td>{user.loginId}</td>
                    <td>{user.nickname}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{user.createdAt?.slice(0, 10)}</td>
                    <td>
                      <button type="button" onClick={() => handleToggle(user.id)}>
                        {expandedUserId === user.id ? '닫기' : '관리'}
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === user.id && (
                    <tr>
                      <td colSpan={8}>
                        <SanctionPanel user={user} onDone={handlePanelDone} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          <div className="admin-users__pagination">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageData.first}>
              이전
            </button>
            <span>{pageData.number + 1} / {Math.max(pageData.totalPages, 1)}</span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={pageData.last}>
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminUsersPage;

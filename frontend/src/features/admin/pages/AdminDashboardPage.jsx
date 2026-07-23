import { useEffect, useState } from 'react';
import { getSummary, getLecturePopularity, getDailyNoteCounts, getDailySignupCounts } from '../api/admin';
import './AdminDashboardPage.css';

function BarList({ items, labelKey, valueKey }) {
  const max = Math.max(1, ...items.map((item) => Number(item[valueKey]) || 0));

  return (
    <ul className="admin-bar-list">
      {items.map((item, index) => (
        <li key={index} className="admin-bar-list__row">
          <span className="admin-bar-list__label" title={item[labelKey]}>{item[labelKey]}</span>
          <div className="admin-bar-list__track">
            <div
              className="admin-bar-list__bar"
              style={{ width: `${(Number(item[valueKey]) / max) * 100}%` }}
            />
          </div>
          <span className="admin-bar-list__value">{item[valueKey]}</span>
        </li>
      ))}
    </ul>
  );
}

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [popularity, setPopularity] = useState([]);
  const [noteCounts, setNoteCounts] = useState([]);
  const [signupCounts, setSignupCounts] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    Promise.all([
      getSummary(),
      getLecturePopularity({ limit: 10 }),
      getDailyNoteCounts({ days: 14 }),
      getDailySignupCounts({ days: 14 }),
    ])
      .then(([summaryData, popularityData, noteData, signupData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setPopularity(popularityData ?? []);
        setNoteCounts(noteData ?? []);
        setSignupCounts(signupData ?? []);
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
  }, []);

  if (status === 'loading') return <p>불러오는 중...</p>;
  if (status === 'error') return <p role="alert">불러오지 못했습니다: {error}</p>;
  if (!summary) return null;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__summary">
        <div className="admin-dashboard__stat">
          <span className="admin-dashboard__stat-label">전체 회원</span>
          <span className="admin-dashboard__stat-value">{summary.totalUsers}</span>
        </div>
        <div className="admin-dashboard__stat">
          <span className="admin-dashboard__stat-label">전체 강의</span>
          <span className="admin-dashboard__stat-value">{summary.totalLectures}</span>
        </div>
        <div className="admin-dashboard__stat">
          <span className="admin-dashboard__stat-label">전체 노트</span>
          <span className="admin-dashboard__stat-value">{summary.totalNotes}</span>
        </div>
        <div className="admin-dashboard__stat">
          <span className="admin-dashboard__stat-label">전체 게시글</span>
          <span className="admin-dashboard__stat-value">{summary.totalPosts}</span>
        </div>
      </div>

      <section className="admin-dashboard__section">
        <h3>강의별 인기도 (좋아요순 Top 10)</h3>
        {popularity.length === 0 ? (
          <p>데이터가 없습니다.</p>
        ) : (
          <BarList items={popularity} labelKey="title" valueKey="likeCount" />
        )}
      </section>

      <section className="admin-dashboard__section">
        <h3>일자별 노트 작성 현황 (최근 14일)</h3>
        {noteCounts.length === 0 ? (
          <p>데이터가 없습니다.</p>
        ) : (
          <BarList items={noteCounts} labelKey="date" valueKey="count" />
        )}
      </section>

      <section className="admin-dashboard__section">
        <h3>일자별 회원 가입 추이 (최근 14일)</h3>
        {signupCounts.length === 0 ? (
          <p>데이터가 없습니다.</p>
        ) : (
          <BarList items={signupCounts} labelKey="date" valueKey="count" />
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;

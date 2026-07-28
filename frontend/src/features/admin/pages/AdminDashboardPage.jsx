import { useEffect, useState } from 'react';
import { getSummary, getLecturePopularity, getDailyNoteCounts, getDailySignupCounts } from '../api/admin';
import BarChart from '../../../components/charts/BarChart';
import LineChart from '../../../components/charts/LineChart';
import './AdminDashboardPage.css';

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

  const popularityData = popularity.map((item) => ({ label: item.title, value: Number(item.likeCount) || 0 }));
  const noteData = noteCounts.map((item) => ({ label: item.date, value: Number(item.count) || 0 }));
  const signupData = signupCounts.map((item) => ({ label: item.date, value: Number(item.count) || 0 }));

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

      <div className="admin-dashboard__grid">
        <section className="admin-dashboard__section">
          <h4>강의별 인기도 (좋아요순 Top 10)</h4>
          {popularityData.length === 0 ? (
            <p className="admin-dashboard__empty">데이터가 없습니다.</p>
          ) : (
            <BarChart data={popularityData} color="var(--text-h)" valueLabel="좋아요" />
          )}
        </section>

        <section className="admin-dashboard__section">
          <h4>일자별 회원 가입 추이 (최근 14일)</h4>
          {signupData.length === 0 ? (
            <p className="admin-dashboard__empty">데이터가 없습니다.</p>
          ) : (
            <LineChart data={signupData} color="var(--text-h)" valueLabel="가입자" />
          )}
        </section>

        <section className="admin-dashboard__section">
          <h4>일자별 노트 작성 현황 (최근 14일)</h4>
          {noteData.length === 0 ? (
            <p className="admin-dashboard__empty">데이터가 없습니다.</p>
          ) : (
            <LineChart data={noteData} color="var(--text-h)" valueLabel="노트 수" />
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

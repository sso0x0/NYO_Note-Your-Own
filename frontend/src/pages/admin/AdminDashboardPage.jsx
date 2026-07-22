import { useEffect, useState } from 'react';
import { getDailySignupCounts, getLecturePopularity, getSummary } from '../../api/admin';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import './AdminDashboardPage.css';

function formatDate(isoDate) {
  const [, month, day] = isoDate.split('-');
  return `${month}.${day}`;
}

function truncate(text, max = 16) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// 관리자 대시보드 — 전체 요약 통계 + 회원가입 추이(라인) + 인기 강의 TOP5(막대).
// 전부 AdminStatsController(내 담당 파트)에 대응하는 실제 데이터로 채운다.
function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [signupTrend, setSignupTrend] = useState(null);
  const [popularity, setPopularity] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getSummary(),
      getDailySignupCounts(14),
      getLecturePopularity(5),
    ])
        .then(([summaryRes, signupRes, popularityRes]) => {
          setSummary(summaryRes);
          setSignupTrend(signupRes.map((d) => ({ label: formatDate(d.date), value: d.count })));
          setPopularity(popularityRes.map((d) => ({ label: truncate(d.title), value: d.likeCount })));
        })
        .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p role="alert" className="admin-dashboard__error">통계를 불러오지 못했습니다: {error}</p>;
  }

  return (
      <div className="admin-dashboard">
        <h1>대시보드</h1>

        <div className="admin-dashboard__stats">
          <div className="admin-stat-tile">
            <span>총 회원수</span>
            <strong>{summary ? summary.totalUsers.toLocaleString() : '-'}</strong>
          </div>
          <div className="admin-stat-tile">
            <span>총 강의수</span>
            <strong>{summary ? summary.totalLectures.toLocaleString() : '-'}</strong>
          </div>
          <div className="admin-stat-tile">
            <span>총 노트수</span>
            <strong>{summary ? summary.totalNotes.toLocaleString() : '-'}</strong>
          </div>
          <div className="admin-stat-tile">
            <span>총 게시글수</span>
            <strong>{summary ? summary.totalPosts.toLocaleString() : '-'}</strong>
          </div>
        </div>

        <div className="admin-dashboard__charts">
          <div className="admin-card">
            <h2>회원가입 추이 (최근 14일)</h2>
            {signupTrend && <LineChart data={signupTrend} color="var(--nyo-accent, var(--accent))" valueLabel="가입자 수" />}
          </div>
          <div className="admin-card">
            <h2>인기 강의 TOP 5 (좋아요 기준)</h2>
            {popularity && (
                popularity.length > 0
                    ? <BarChart data={popularity} color="var(--nyo-accent-pink, var(--accent))" valueLabel="좋아요" />
                    : <p className="admin-dashboard__empty">아직 집계할 강의가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="admin-card admin-dashboard__reports">
          <h2>신고된 게시물 (심사 대기)</h2>
          <p className="admin-dashboard__placeholder">
            게시물 신고 기능은 아직 백엔드에 준비되어 있지 않습니다. 자리만 잡아뒀습니다.
          </p>
        </div>
      </div>
  );
}

export default AdminDashboardPage;

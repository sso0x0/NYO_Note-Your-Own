import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInstructorApplication, getMyInstructorApplications } from '../api/instructorApplication';
import { getCategoryList } from '../../lecture/api/category';
import './InstructorApplyPage.css';

function InstructorApplyPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const [latestApplication, setLatestApplication] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // 이미 대기/승인 상태인 신청이 있으면 폼 대신 그 상태를 보여줘야 하므로 카테고리 목록과 함께 불러온다.
    Promise.all([getCategoryList(), getMyInstructorApplications({ size: 1 })])
      .then(([categoryList, myApplications]) => {
        if (cancelled) return;
        setCategories(categoryList ?? []);
        setCategoryId(categoryList?.[0]?.id ?? '');
        setLatestApplication(myApplications?.content?.[0] ?? null);
        setStatus('ready');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await createInstructorApplication({
        categoryId: Number(categoryId),
        bio,
        portfolioUrl: portfolioUrl || undefined,
      });
      navigate('/main/mypage');
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <section className="instructor-apply-page">
        <p>불러오는 중...</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="instructor-apply-page">
        <p role="alert">불러오지 못했습니다: {error}</p>
      </section>
    );
  }

  if (latestApplication?.status === 'PENDING') {
    return (
      <section className="instructor-apply-page">
        <h2>강사 신청</h2>
        <p>이미 심사 대기 중인 신청이 있습니다. 관리자 승인을 기다려 주세요.</p>
        <dl className="instructor-apply-page__summary">
          <dt>전문 분야</dt>
          <dd>{latestApplication.categoryName}</dd>
          <dt>신청일</dt>
          <dd>{latestApplication.createdAt?.slice(0, 10)}</dd>
        </dl>
      </section>
    );
  }

  if (latestApplication?.status === 'APPROVED') {
    return (
      <section className="instructor-apply-page">
        <h2>강사 신청</h2>
        <p>이미 강사로 승인된 계정입니다.</p>
      </section>
    );
  }

  return (
    <section className="instructor-apply-page">
      <h2>강사 신청</h2>

      {latestApplication?.status === 'REJECTED' && (
        <p className="instructor-apply-page__notice">
          이전 신청이 반려되었습니다. 내용을 보완해 다시 신청할 수 있습니다.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          전문 분야
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          경력 및 소개
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={8}
            maxLength={4000}
            placeholder="강의 가능한 분야의 경력, 이력을 소개해주세요."
            required
          />
        </label>

        <label>
          포트폴리오 링크 (선택)
          <input
            type="text"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="블로그, GitHub, 이력서 링크 등"
          />
        </label>

        {submitError && (
          <p role="alert" className="instructor-apply-page__error">
            {submitError}
          </p>
        )}

        <button type="submit" disabled={submitting || categories.length === 0}>
          {submitting ? '제출 중...' : '신청하기'}
        </button>
      </form>
    </section>
  );
}

export default InstructorApplyPage;

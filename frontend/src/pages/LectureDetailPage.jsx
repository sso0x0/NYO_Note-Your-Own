import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLecture } from '../api/lecture';
import './LectureDetailPage.css';

function LectureDetailPage() {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);

    setLiked(false);
    setEnrolled(false);

    getLecture(id)
      .then((data) => {
        if (cancelled) return;
        setLecture(data);
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
  }, [id]);

  const isFull =
    !enrolled && lecture?.capacity != null && (lecture.currentEnrolled ?? 0) >= lecture.capacity;

  return (
    <section className="lecture-detail-page">
      <Link to="/main" className="lecture-detail-page__back">
        ← 목록으로
      </Link>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">강의를 불러오지 못했습니다: {error}</p>}

      {status === 'success' && lecture && (
        <>
          <div className="lecture-detail-page__thumb">
            {lecture.thumbnailUrl ? (
              <img src={lecture.thumbnailUrl} alt={lecture.title} />
            ) : (
              <div className="lecture-detail-page__thumb-fallback" aria-hidden="true" />
            )}
            {lecture.isPopular && <span className="lecture-detail-page__badge">인기</span>}
          </div>

          {lecture.categoryName && (
            <span className="lecture-detail-page__category">{lecture.categoryName}</span>
          )}
          <h2 className="lecture-detail-page__title">{lecture.title}</h2>
          {lecture.instructor && (
            <p className="lecture-detail-page__instructor">강사 {lecture.instructor}</p>
          )}

          <div className="lecture-detail-page__meta">
            <span>조회 {lecture.viewCount ?? 0}</span>
            <span>좋아요 {(lecture.likeCount ?? 0) + (liked ? 1 : 0)}</span>
            <span>
              수강 {(lecture.currentEnrolled ?? 0) + (enrolled ? 1 : 0)}
              {lecture.capacity != null ? ` / ${lecture.capacity}` : ''}
            </span>
          </div>

          <div className="lecture-detail-page__actions">
            <button
              type="button"
              className={`lecture-detail-page__like-btn${liked ? ' is-active' : ''}`}
              aria-pressed={liked}
              onClick={() => setLiked((v) => !v)}
            >
              {liked ? '♥ 좋아요 취소' : '♡ 좋아요'}
            </button>
            <button
              type="button"
              className={`lecture-detail-page__enroll-btn${enrolled ? ' is-active' : ''}`}
              disabled={isFull}
              onClick={() => setEnrolled((v) => !v)}
            >
              {enrolled ? '수강신청 취소' : isFull ? '정원 마감' : '수강신청'}
            </button>
          </div>

          {lecture.description && (
            <p className="lecture-detail-page__description">{lecture.description}</p>
          )}

          {lecture.lectureUrl && (
            <a
              className="lecture-detail-page__link"
              href={lecture.lectureUrl}
              target="_blank"
              rel="noreferrer"
            >
              강의 링크로 이동
            </a>
          )}
        </>
      )}
    </section>
  );
}

export default LectureDetailPage;

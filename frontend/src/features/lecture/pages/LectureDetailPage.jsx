import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getLecture,
  increaseLectureViewCount,
  isEnrolled as fetchIsEnrolled,
  enrollLecture,
  cancelEnrollment,
  isLectureLiked,
  likeLecture,
  unlikeLecture,
} from '../api/lecture';
import fallbackThumbnail from '../../../assets/images/null.png';
import { resolveLectureThumbnail } from '../../../utils/youtubeThumbnail';
import './LectureDetailPage.css';

function LectureDetailPage() {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);
    setEnrollError(null);

    setLiked(false);
    setEnrolled(false);

    const loadLecture = async () => {
      try {
        // 조회수 증가를 먼저 처리한 뒤 상세 정보를 조회해야 갱신된 숫자가 바로 표시된다.
        // 비로그인 등으로 증가 요청이 실패해도 공개된 강의 상세 조회는 계속 진행한다.
        await increaseLectureViewCount(id).catch(() => null);
        const [data, enrolledStatus, likedStatus] = await Promise.all([
          getLecture(id),
          // 수강신청 여부 조회가 실패해도(네트워크 등) 상세 화면 자체는 계속 보여준다.
          fetchIsEnrolled(id).catch(() => false),
          // 좋아요 여부 조회가 실패해도 상세 화면 자체는 계속 보여준다.
          isLectureLiked(id).catch(() => false),
        ]);

        if (cancelled) return;
        setLecture(data);
        setEnrolled(enrolledStatus);
        setLiked(!!likedStatus);
        setStatus('success');
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      }
    };

    loadLecture();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isFull =
    !enrolled && lecture?.capacity != null && (lecture.currentEnrolled ?? 0) >= lecture.capacity;

  const handleToggleLike = async () => {
    try {
      if (liked) {
        await unlikeLecture(id);
        setLiked(false);
        setLecture((l) => (l ? { ...l, likeCount: Math.max(0, (l.likeCount ?? 0) - 1) } : l));
      } else {
        await likeLecture(id);
        setLiked(true);
        setLecture((l) => (l ? { ...l, likeCount: (l.likeCount ?? 0) + 1 } : l));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEnrollClick = async () => {
    if (enrollBusy) return;
    setEnrollBusy(true);
    setEnrollError(null);

    try {
      if (enrolled) {
        await cancelEnrollment(id);
      } else {
        await enrollLecture(id);
      }
      // 정원 등 서버 기준 숫자가 바뀌므로 신청/취소 이후에는 상세 정보를 다시 불러온다.
      const data = await getLecture(id);
      setLecture(data);
      setEnrolled((v) => !v);
    } catch (err) {
      setEnrollError(err.message);
    } finally {
      setEnrollBusy(false);
    }
  };

  return (
    <section className="lecture-detail-page">
      <Link to="/main/lectures" className="lecture-detail-page__back">
        ← 목록으로
      </Link>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">강의를 불러오지 못했습니다: {error}</p>}

      {status === 'success' && lecture && (
        <>
          <div className="lecture-detail-page__thumb">
            <img
              src={resolveLectureThumbnail(lecture) ?? fallbackThumbnail}
              alt={lecture.title}
              onError={(event) => {
                event.currentTarget.src = fallbackThumbnail;
              }}
            />
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
            <span>좋아요 {lecture.likeCount ?? 0}</span>
            <span>
              수강 {lecture.currentEnrolled ?? 0}
              {lecture.capacity != null ? ` / ${lecture.capacity}` : ''}
            </span>
          </div>

          <div className="lecture-detail-page__actions">
            <button
              type="button"
              className={`lecture-detail-page__like-btn${liked ? ' is-active' : ''}`}
              aria-pressed={liked}
              onClick={handleToggleLike}
            >
              {liked ? '♥ 좋아요 취소' : '♡ 좋아요'}
            </button>
            <button
              type="button"
              className={`lecture-detail-page__enroll-btn${enrolled ? ' is-active' : ''}`}
              disabled={isFull || enrollBusy}
              onClick={handleEnrollClick}
            >
              {enrollBusy ? '처리 중...' : enrolled ? '수강신청 취소' : isFull ? '정원 마감' : '수강신청'}
            </button>
          </div>

          {enrollError && <p className="lecture-detail-page__enroll-error" role="alert">{enrollError}</p>}

          {lecture.description && (
            <p className="lecture-detail-page__description">{lecture.description}</p>
          )}

          {lecture.lectureUrl && (
            enrolled ? (
              <Link className="lecture-detail-page__link" to={`/main/lectures/${id}/watch`}>
                강의 링크로 이동
              </Link>
            ) : (
              <p className="lecture-detail-page__link-locked">
                {isFull ? '정원이 마감되어 수강할 수 없습니다.' : '수강신청 후 강의를 시청할 수 있습니다.'}
              </p>
            )
          )}
        </>
      )}
    </section>
  );
}

export default LectureDetailPage;

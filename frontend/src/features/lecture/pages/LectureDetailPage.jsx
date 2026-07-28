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
import { getNotesByLecture } from '../../note/api/note';
import NoteCard from '../../note/components/NoteCard';
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
  const [notes, setNotes] = useState([]);
  const [notesStatus, setNotesStatus] = useState('idle'); // idle | loading | success | error

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotesStatus('loading');

    getNotesByLecture(id)
      .then((data) => {
        if (cancelled) return;
        setNotes(Array.isArray(data) ? data : []);
        setNotesStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setNotesStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isFull =
    !enrolled && lecture?.capacity != null && (lecture.currentEnrolled ?? 0) >= lecture.capacity;
  const capacityPercent =
    lecture?.capacity ? Math.min(100, Math.round(((lecture.currentEnrolled ?? 0) / lecture.capacity) * 100)) : 0;

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
      {status === 'loading' && <p className="lecture-detail-page__status">불러오는 중...</p>}
      {status === 'error' && (
        <p className="lecture-detail-page__status" role="alert">강의를 불러오지 못했습니다: {error}</p>
      )}

      {status === 'success' && lecture && (
        <>
          <nav className="lecture-detail-page__crumbs" aria-label="현재 위치">
            <Link to="/main/lectures">강의 목록</Link>
            {lecture.categoryName && (
              <>
                <span>/</span>
                <span>{lecture.categoryName}</span>
              </>
            )}
            <span>/</span>
            <span className="is-current">{lecture.title}</span>
          </nav>

          <div className="lecture-detail-page__hero">
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

            <div className="lecture-detail-page__info">
              {lecture.categoryName && (
                <span className="lecture-detail-page__category">{lecture.categoryName}</span>
              )}
              <h1 className="lecture-detail-page__title">{lecture.title}</h1>
              {lecture.instructor && (
                <p className="lecture-detail-page__instructor">강사 {lecture.instructor}</p>
              )}
              {lecture.description && (
                <p className="lecture-detail-page__description">{lecture.description}</p>
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
                  <span className="lecture-detail-page__like-icon">{liked ? '♥' : '♡'}</span>
                  {liked ? ' 좋아요 취소' : ' 좋아요'}
                </button>
                {lecture.lectureUrl && (
                  enrolled ? (
                    <Link className="lecture-detail-page__link" to={`/main/lectures/${id}/watch`}>
                      강의 보러가기
                    </Link>
                  ) : (
                    <span className="lecture-detail-page__link-locked">
                      {isFull ? '정원이 마감되어 수강할 수 없습니다.' : '수강신청 후 강의를 시청할 수 있습니다.'}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="lecture-detail-page__body">
            <div className="lecture-detail-page__main">
              <div className="lecture-detail-page__section-head">
                <h2>노트 목록 <span>{notes.length}</span></h2>
              </div>

              {notesStatus === 'loading' && <p className="lecture-detail-page__status">불러오는 중...</p>}
              {notesStatus === 'error' && (
                <p className="lecture-detail-page__status" role="alert">노트를 불러오지 못했습니다.</p>
              )}
              {notesStatus === 'success' && notes.length === 0 && (
                <p className="lecture-detail-page__empty">아직 작성된 노트가 없습니다.</p>
              )}
              {notesStatus === 'success' && notes.length > 0 && (
                <div className="lecture-detail-page__notes">
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </div>

            <aside className="lecture-detail-page__sidebar">
              <div className="lecture-detail-page__enroll-card">
                <h3>수강신청</h3>

                {lecture.capacity != null && (
                  <>
                    <div className="lecture-detail-page__enroll-bar">
                      <div
                        className="lecture-detail-page__enroll-bar-fill"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                    <p className="lecture-detail-page__enroll-capacity">
                      정원 {isFull ? '마감 ' : ''}{lecture.currentEnrolled ?? 0} / {lecture.capacity}명
                    </p>
                  </>
                )}

                <button
                  type="button"
                  className={`lecture-detail-page__enroll-btn${enrolled ? ' is-active' : ''}`}
                  disabled={isFull || enrollBusy}
                  onClick={handleEnrollClick}
                >
                  {enrollBusy ? '처리 중...' : enrolled ? '수강신청 취소' : isFull ? '정원 마감' : '수강신청'}
                </button>

                {enrollError && (
                  <p className="lecture-detail-page__enroll-error" role="alert">{enrollError}</p>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

export default LectureDetailPage;

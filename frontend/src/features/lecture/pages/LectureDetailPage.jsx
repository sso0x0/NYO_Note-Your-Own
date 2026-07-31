import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getLecture,
  increaseLectureViewCount,
  isEnrolled as fetchIsEnrolled,
  enrollLecture,
  cancelEnrollment,
} from '../api/lecture';
import { getNotesByLecture } from '../../note/api/note';
import { getLectureComments } from '../api/lectureComment';
import NoteCard from '../../note/components/NoteCard';
import fallbackThumbnail from '../../../assets/images/null.png';
import { resolveLectureThumbnail } from '../../../utils/youtubeThumbnail';
import './LectureDetailPage.css';

const NOTES_PER_PAGE = 10;
const PAGE_WINDOW = 5;

function getPageNumbers(current, totalPages) {
  if (totalPages <= PAGE_WINDOW) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  let start = Math.max(1, current - Math.floor(PAGE_WINDOW / 2));
  let end = start + PAGE_WINDOW - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - PAGE_WINDOW + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const COMMENT_AVATAR_COLORS = [
  { bg: '#fdeef2', fg: '#e57391' },
  { bg: '#eef4fd', fg: '#4f83cc' },
  { bg: '#eafbf0', fg: '#2f9e58' },
  { bg: '#fff6e0', fg: '#c98a1f' },
  { bg: '#f3edfd', fg: '#8a5cf6' },
  { bg: '#fdece8', fg: '#e0553f' },
  { bg: '#e8fbfa', fg: '#1fa79a' },
  { bg: '#fdf0f7', fg: '#d1499a' },
];

function getCommentAvatarColor(comment) {
  const seed = String(comment.userId ?? comment.authorNickname ?? comment.id ?? '');
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  const color = COMMENT_AVATAR_COLORS[hash % COMMENT_AVATAR_COLORS.length];
  return { backgroundColor: color.bg, color: color.fg };
}

function formatCommentDate(value) {
  return value ? new Date(value).toLocaleString('ko-KR') : '';
}

// 커뮤니티 댓글과 같은 구조로 표시하되 작성·답글·수정·삭제 버튼은 넣지 않는다.
function LectureDetailComment({ comment }) {
  const isEdited = !comment.isDeleted && comment.createdAt && comment.updatedAt
    && comment.createdAt !== comment.updatedAt;

  return (
    <li className={`lecture-detail-page__comment${comment.isDeleted ? ' is-deleted' : ''}`}>
      <div
        className="lecture-detail-page__comment-avatar"
        aria-hidden="true"
        style={comment.isDeleted ? undefined : getCommentAvatarColor(comment)}
      >
        {(comment.authorNickname || '?').charAt(0)}
      </div>
      <div className="lecture-detail-page__comment-body">
        <div className="lecture-detail-page__comment-header">
          <strong>{comment.authorNickname || '알 수 없는 사용자'}</strong>
          {!comment.isDeleted && (
            <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
          )}
          {isEdited && <span>(수정됨)</span>}
        </div>
        <p>{comment.content}</p>
      </div>
      {comment.replies?.length > 0 && (
        <ul className="lecture-detail-page__comment-replies">
          {comment.replies.map((reply) => (
            <LectureDetailComment key={reply.id} comment={reply} />
          ))}
        </ul>
      )}
    </li>
  );
}

function LectureDetailPage() {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesStatus, setNotesStatus] = useState('idle'); // idle | loading | success | error
  const [notesPage, setNotesPage] = useState(1);
  const [activeContent, setActiveContent] = useState('notes');
  const [comments, setComments] = useState([]);
  const [commentsStatus, setCommentsStatus] = useState('idle');
  const [visibleCommentCount, setVisibleCommentCount] = useState(10);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);
    setEnrollError(null);

    setEnrolled(false);

    const loadLecture = async () => {
      try {
        // 조회수 증가를 먼저 처리한 뒤 상세 정보를 조회해야 갱신된 숫자가 바로 표시된다.
        // 비로그인 등으로 증가 요청이 실패해도 공개된 강의 상세 조회는 계속 진행한다.
        await increaseLectureViewCount(id).catch(() => null);
        const [data, enrolledStatus] = await Promise.all([
          getLecture(id),
          // 수강신청 여부 조회가 실패해도(네트워크 등) 상세 화면 자체는 계속 보여준다.
          fetchIsEnrolled(id).catch(() => false),
        ]);

        if (cancelled) return;
        setLecture(data);
        setEnrolled(enrolledStatus);
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

    setCommentsStatus('loading');
    getLectureComments(id)
      .then((data) => {
        if (cancelled) return;
        setComments(Array.isArray(data) ? data : []);
        setVisibleCommentCount(10);
        setCommentsStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setCommentsStatus('error');
      });

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
        setNotesPage(1);
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
  const notesTotalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
  const visibleNotes = notes.slice(
    (notesPage - 1) * NOTES_PER_PAGE,
    notesPage * NOTES_PER_PAGE,
  );

  const handleEnrollClick = async () => {
    if (enrollBusy) return;
    const wasEnrolled = enrolled;
    setEnrollBusy(true);
    setEnrollError(null);

    try {
      if (wasEnrolled) {
        await cancelEnrollment(id);
      } else {
        await enrollLecture(id);
      }
      // 정원 등 서버 기준 숫자가 바뀌므로 신청/취소 이후에는 상세 정보를 다시 불러온다.
      const data = await getLecture(id);
      setLecture(data);
      setEnrolled((v) => !v);
      // 수강신청이 서버에 정상 반영된 뒤에만 완료 알림을 표시한다.
      if (!wasEnrolled) {
        window.alert('수강신청이 완료되었습니다.');
      } else {
        window.alert('수강신청이 취소되었습니다.');
      }
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
              </div>

              <div className="lecture-detail-page__capacity-row">
                <span>
                  수강 {lecture.currentEnrolled ?? 0}
                  {lecture.capacity != null ? ` / ${lecture.capacity}` : ''}
                </span>
                {lecture.capacity != null && (
                  <div
                    className="lecture-detail-page__capacity-bar"
                    role="progressbar"
                    aria-label="수강 신청 현황"
                    aria-valuemin="0"
                    aria-valuemax={lecture.capacity}
                    aria-valuenow={lecture.currentEnrolled ?? 0}
                  >
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((lecture.currentEnrolled ?? 0) / Math.max(lecture.capacity, 1)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="lecture-detail-page__actions">
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
                {/* 별도 수강신청 카드를 없애고 강의 이동 버튼 바로 오른쪽에서 신청 상태를 변경한다. */}
                <button
                  type="button"
                  className={`lecture-detail-page__enroll-btn lecture-detail-page__enroll-btn--inline${enrolled ? ' is-active' : ''}`}
                  disabled={isFull || enrollBusy}
                  onClick={handleEnrollClick}
                >
                  {enrollBusy ? '처리 중...' : enrolled ? '수강신청 취소' : isFull ? '정원 마감' : '수강신청'}
                </button>
              </div>
              {enrollError && (
                <p className="lecture-detail-page__enroll-error" role="alert">{enrollError}</p>
              )}
            </div>
          </div>

          <div className="lecture-detail-page__body">
            <div className="lecture-detail-page__main">
              <div className="lecture-detail-page__content-tabs" role="tablist" aria-label="강의 활동">
                <button
                  type="button"
                  className={activeContent === 'notes' ? 'is-active' : ''}
                  aria-selected={activeContent === 'notes'}
                  onClick={() => setActiveContent('notes')}
                >
                  다른 학습자 노트
                </button>
                <button
                  type="button"
                  className={activeContent === 'comments' ? 'is-active' : ''}
                  aria-selected={activeContent === 'comments'}
                  onClick={() => setActiveContent('comments')}
                >
                  댓글
                </button>
              </div>

              {activeContent === 'notes' && (
                <>
                  {notesStatus === 'loading' && <p className="lecture-detail-page__status">불러오는 중...</p>}
                  {notesStatus === 'error' && (
                    <p className="lecture-detail-page__status" role="alert">노트를 불러오지 못했습니다.</p>
                  )}
                  {notesStatus === 'success' && notes.length === 0 && (
                    <p className="lecture-detail-page__empty">아직 작성된 노트가 없습니다.</p>
                  )}
                  {notesStatus === 'success' && notes.length > 0 && (
                    <>
                      <div className="lecture-detail-page__notes">
                        {visibleNotes.map((note) => (
                          <NoteCard key={note.id} note={note} />
                        ))}
                      </div>
                      {notesTotalPages > 1 && (
                        <nav className="lecture-detail-page__pagination" aria-label="노트 페이지">
                          <button
                            type="button"
                            className="lecture-detail-page__page-btn lecture-detail-page__page-btn--nav"
                            onClick={() => setNotesPage((page) => Math.max(1, page - 1))}
                            disabled={notesPage === 1}
                          >
                            이전
                          </button>
                          {getPageNumbers(notesPage, notesTotalPages).map((page) => (
                            <button
                              key={page}
                              type="button"
                              className={`lecture-detail-page__page-btn${page === notesPage ? ' is-active' : ''}`}
                              aria-current={page === notesPage ? 'page' : undefined}
                              onClick={() => setNotesPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="lecture-detail-page__page-btn lecture-detail-page__page-btn--nav"
                            onClick={() => setNotesPage((page) => Math.min(notesTotalPages, page + 1))}
                            disabled={notesPage === notesTotalPages}
                          >
                            다음
                          </button>
                        </nav>
                      )}
                    </>
                  )}
                </>
              )}

              {activeContent === 'comments' && (
                <ul className="lecture-detail-page__comments">
                  {commentsStatus === 'loading' && <p className="lecture-detail-page__status">불러오는 중...</p>}
                  {commentsStatus === 'error' && (
                    <p className="lecture-detail-page__status" role="alert">댓글을 불러오지 못했습니다.</p>
                  )}
                  {commentsStatus === 'success' && comments.length === 0 && (
                    <p className="lecture-detail-page__empty">아직 작성된 댓글이 없습니다.</p>
                  )}
                  {commentsStatus === 'success' && comments.slice(0, visibleCommentCount).map((comment) => (
                    <LectureDetailComment key={comment.id} comment={comment} />
                  ))}
                  {commentsStatus === 'success' && comments.length > visibleCommentCount && (
                    <li className="lecture-detail-page__comment-more-row">
                      <button
                        type="button"
                        className="lecture-detail-page__comment-more"
                        onClick={() => setVisibleCommentCount((count) => count + 10)}
                      >
                        더보기
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>

          </div>
        </>
      )}
    </section>
  );
}

export default LectureDetailPage;

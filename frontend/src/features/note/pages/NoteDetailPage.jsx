import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { deleteNote, getNote, increaseNoteViewCount, isNoteLiked, likeNote, unlikeNote } from '../api/note';
import './NoteDetailPage.css';

// 노트 상세 페이지. 조회수 증가, 좋아요 토글, 삭제를 처리한다.
function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [note, setNote] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  // 노트 id가 바뀔 때마다 조회수 증가, 상세 조회, 좋아요 여부 확인을 순서대로 처리한다.
  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);
    setLiked(false);

    // 조회수 증가를 먼저 처리한 뒤 상세 정보를 조회해야 갱신된 숫자가 바로 표시된다.
    increaseNoteViewCount(id)
      .catch(() => {})
      .then(() => getNote(id))
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        setStatus('success');
        isNoteLiked(id)
          .then((value) => {
            if (!cancelled) setLiked(!!value);
          })
          .catch(() => {});
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

  const isOwner = !!note && auth?.userId === note.userId;

  // 좋아요 등록/취소를 토글하고 화면의 좋아요 수를 낙관적으로 갱신한다.
  const handleToggleLike = async () => {
    try {
      if (liked) {
        await unlikeNote(id);
        setLiked(false);
        setNote((n) => (n ? { ...n, likeCount: Math.max(0, (n.likeCount ?? 0) - 1) } : n));
      } else {
        await likeNote(id);
        setLiked(true);
        setNote((n) => (n ? { ...n, likeCount: (n.likeCount ?? 0) + 1 } : n));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 확인 후 노트를 삭제하고 목록으로 돌아간다.
  const handleDelete = async () => {
    if (!window.confirm('이 노트를 삭제할까요?')) return;
    try {
      await deleteNote(id);
      navigate('/main/notes');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="note-detail-page">
      <Link to="/main/notes" className="note-detail-page__back">
        ← 노트 목록
      </Link>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">노트를 불러오지 못했습니다: {error}</p>}

      {status === 'success' && note && (
        <>
          {note.lectureTitle && <span className="note-detail-page__lecture">{note.lectureTitle}</span>}
          <h2 className="note-detail-page__title">{note.title}</h2>
          {note.authorNickname && <p className="note-detail-page__author">{note.authorNickname}</p>}

          <div className="note-detail-page__meta">
            <span>조회 {note.viewCount ?? 0}</span>
            <span>좋아요 {note.likeCount ?? 0}</span>
          </div>

          <div className="note-detail-page__actions">
            <button
              type="button"
              className={`note-detail-page__like-btn${liked ? ' is-active' : ''}`}
              aria-pressed={liked}
              onClick={handleToggleLike}
            >
              {liked ? '♥ 좋아요 취소' : '♡ 좋아요'}
            </button>

            {isOwner && (
              <>
                <Link to={`/main/notes/${id}/edit`} className="note-detail-page__edit-btn">
                  수정
                </Link>
                <button type="button" className="note-detail-page__delete-btn" onClick={handleDelete}>
                  삭제
                </button>
              </>
            )}
          </div>

          {note.thumbnailUrl && (
            <div className="note-detail-page__thumb">
              <img src={note.thumbnailUrl} alt={note.title} />
            </div>
          )}

          <p className="note-detail-page__content">{note.content}</p>
        </>
      )}
    </section>
  );
}

export default NoteDetailPage;

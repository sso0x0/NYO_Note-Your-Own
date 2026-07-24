import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { deleteNote, getNote, increaseNoteViewCount, isNoteLiked, likeNote, unlikeNote } from '../api/note';
import './NoteDetailPage.css';

function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [note, setNote] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);
    setLiked(false);

    getNote(id)
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        setStatus('success');
        increaseNoteViewCount(id).catch(() => {});
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

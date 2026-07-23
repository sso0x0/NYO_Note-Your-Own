import { useEffect, useState } from 'react';
import { getPostList, deletePost } from '../../community/api/post';
import { getNoteList, deleteNote } from '../../note/api/note';
import './AdminModerationPage.css';

function usePagedList(fetcher) {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    fetcher({ page })
      .then((data) => {
        if (cancelled) return;
        setPageData(data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return { page, setPage, pageData, status, error, reload };
}

function AdminModerationPage() {
  const posts = usePagedList(getPostList);
  const notes = usePagedList(getNoteList);

  const handleDeletePost = async (post) => {
    if (!window.confirm(`"${post.title}" 게시글을 삭제할까요?`)) return;
    try {
      await deletePost(post.id);
      posts.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`"${note.title}" 노트를 삭제할까요?`)) return;
    try {
      await deleteNote(note.id);
      notes.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const postItems = [...(posts.pageData?.notices ?? []), ...(posts.pageData?.content ?? [])];

  return (
    <div className="admin-moderation">
      <section className="admin-moderation__section">
        <h3>게시글 관리</h3>
        {posts.status === 'loading' && <p>불러오는 중...</p>}
        {posts.status === 'error' && <p role="alert">불러오지 못했습니다: {posts.error}</p>}
        {posts.status === 'success' && (
          <>
            <ul className="admin-moderation__list">
              {postItems.map((post) => (
                <li key={post.id}>
                  <div>
                    <span className="admin-moderation__title">{post.notice ? '[공지] ' : ''}{post.title}</span>
                    <span className="admin-moderation__meta">
                      {post.authorNickname} · 조회 {post.viewCount ?? 0} · 좋아요 {post.likeCount ?? 0}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleDeletePost(post)}>삭제</button>
                </li>
              ))}
              {postItems.length === 0 && <li className="admin-moderation__empty">게시글이 없습니다.</li>}
            </ul>
            <div className="admin-moderation__pagination">
              <button type="button" onClick={() => posts.setPage((p) => Math.max(0, p - 1))} disabled={posts.page === 0}>
                이전
              </button>
              <span>{posts.page + 1} / {Math.max(posts.pageData.totalPages, 1)}</span>
              <button type="button" onClick={() => posts.setPage((p) => p + 1)} disabled={posts.pageData.last}>
                다음
              </button>
            </div>
          </>
        )}
      </section>

      <section className="admin-moderation__section">
        <h3>노트 관리</h3>
        {notes.status === 'loading' && <p>불러오는 중...</p>}
        {notes.status === 'error' && <p role="alert">불러오지 못했습니다: {notes.error}</p>}
        {notes.status === 'success' && (
          <>
            <ul className="admin-moderation__list">
              {(notes.pageData.content ?? []).map((note) => (
                <li key={note.id}>
                  <div>
                    <span className="admin-moderation__title">{note.title}</span>
                    <span className="admin-moderation__meta">
                      {note.authorNickname} · 조회 {note.viewCount ?? 0} · 좋아요 {note.likeCount ?? 0}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleDeleteNote(note)}>삭제</button>
                </li>
              ))}
              {notes.pageData.content?.length === 0 && <li className="admin-moderation__empty">노트가 없습니다.</li>}
            </ul>
            <div className="admin-moderation__pagination">
              <button type="button" onClick={() => notes.setPage((p) => Math.max(0, p - 1))} disabled={notes.page === 0}>
                이전
              </button>
              <span>{notes.page + 1} / {Math.max(notes.pageData.totalPages, 1)}</span>
              <button type="button" onClick={() => notes.setPage((p) => p + 1)} disabled={notes.pageData.last}>
                다음
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AdminModerationPage;

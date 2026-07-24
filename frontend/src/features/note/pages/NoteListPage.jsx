import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNoteList, searchNotes } from '../api/note';
import NoteCard from '../components/NoteCard';
import './NoteListPage.css';

function NoteListPage() {
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);

    const request = appliedKeyword
      ? searchNotes({ keyword: appliedKeyword, page })
      : getNoteList({ page });

    request
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
  }, [page, appliedKeyword]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedKeyword(keyword.trim());
  };

  const handleReset = () => {
    setKeyword('');
    setAppliedKeyword('');
    setPage(0);
  };

  return (
    <section className="note-list-page">
      <div className="note-list-page__header">
        <h2>노트</h2>
        <Link to="/main/notes/new" className="note-list-page__write-btn">노트 작성</Link>
      </div>

      <form className="note-list-page__search" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="제목, 본문, 태그로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">검색</button>
        {appliedKeyword && (
          <button type="button" className="note-list-page__reset-btn" onClick={handleReset}>
            초기화
          </button>
        )}
      </form>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">노트를 불러오지 못했습니다: {error}</p>}
      {status === 'success' && pageData?.content.length === 0 && <p>등록된 노트가 없습니다.</p>}

      {status === 'success' && pageData?.content.length > 0 && (
        <>
          <div className="note-list-page__grid">
            {pageData.content.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>

          <div className="note-list-page__pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              이전
            </button>
            <span>
              {page + 1} / {Math.max(pageData.totalPages, 1)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={pageData.last}
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default NoteListPage;

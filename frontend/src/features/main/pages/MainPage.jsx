import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLectureList, searchLectures } from '../../lecture/api/lecture';
import { getNoteList, searchNotes } from '../../note/api/note';
import { getPostList, searchPosts } from '../../community/api/post';
import LectureCard from '../../lecture/components/LectureCard';
import NoteCard from '../../note/components/NoteCard';
import PostCard from '../../community/components/PostCard';
import './MainPage.css';

const HIGHLIGHT_SIZE = 5;

function MainPage() {
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [lectures, setLectures] = useState([]);
  const [notes, setNotes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    const requests = appliedKeyword
      ? [
          searchLectures({ keyword: appliedKeyword, size: HIGHLIGHT_SIZE }),
          searchNotes({ keyword: appliedKeyword, size: HIGHLIGHT_SIZE }),
          searchPosts({ keyword: appliedKeyword, size: HIGHLIGHT_SIZE }),
        ]
      : [
          getLectureList({ size: HIGHLIGHT_SIZE, sort: 'likeCount,desc' }),
          getNoteList({ size: HIGHLIGHT_SIZE, sort: 'likeCount,desc' }),
          getPostList({ size: HIGHLIGHT_SIZE, sort: 'likeCount,desc' }),
        ];

    Promise.all(requests)
      .then(([lectureData, noteData, postData]) => {
        if (cancelled) return;
        setLectures(lectureData?.content ?? []);
        setNotes(noteData?.content ?? []);
        setPosts(postData?.content ?? []);
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
  }, [appliedKeyword]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedKeyword(keyword.trim());
  };

  const handleReset = () => {
    setKeyword('');
    setAppliedKeyword('');
  };

  return (
    <section className="main-page">
      <form className="main-page__search" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="강의, 노트, 커뮤니티 글 통합 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">검색</button>
        {appliedKeyword && (
          <button type="button" className="main-page__reset-btn" onClick={handleReset}>
            초기화
          </button>
        )}
      </form>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">불러오지 못했습니다: {error}</p>}

      {status === 'success' && (
        <>
          <section className="main-page__section">
            <div className="main-page__section-header">
              <h2>{appliedKeyword ? '강의 검색 결과' : '인기 강의'}</h2>
              <Link to="/main/lectures">전체보기</Link>
            </div>
            {lectures.length === 0 ? (
              <p>결과가 없습니다.</p>
            ) : (
              <div className="main-page__grid">
                {lectures.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
              </div>
            )}
          </section>

          <section className="main-page__section">
            <div className="main-page__section-header">
              <h2>{appliedKeyword ? '노트 검색 결과' : '인기 노트'}</h2>
              <Link to="/main/notes">전체보기</Link>
            </div>
            {notes.length === 0 ? (
              <p>결과가 없습니다.</p>
            ) : (
              <div className="main-page__grid">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </section>

          <section className="main-page__section">
            <div className="main-page__section-header">
              <h2>{appliedKeyword ? '커뮤니티 검색 결과' : '커뮤니티 글'}</h2>
              <Link to="/main/community">전체보기</Link>
            </div>
            {posts.length === 0 ? (
              <p>결과가 없습니다.</p>
            ) : (
              <div className="main-page__grid">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default MainPage;

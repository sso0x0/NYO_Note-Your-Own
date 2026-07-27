import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLectureList, searchLectures } from '../../lecture/api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { getNoteList, searchNotes } from '../../note/api/note';
import { getPostList, searchPosts } from '../../community/api/post';
import LectureCard from '../../lecture/components/LectureCard';
import NoteCard from '../../note/components/NoteCard';
import PostCard from '../../community/components/PostCard';
import './MainPage.css';

const HIGHLIGHT_SIZE = 5;

// 카테고리 이름에 어울리는 칩 아이콘을 대략적으로 매칭한다. 매칭되는 게 없으면 기본 태그 아이콘을 쓴다.
function CategoryIcon({ name = '' }) {
  if (/프론트|front/i.test(name)) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" /><line x1="8" y1="22" x2="16" y2="22" /><line x1="12" y1="18" x2="12" y2="22" />
      </svg>
    );
  }
  if (/백엔드|back/i.test(name)) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0018 0V5" /><path d="M3 12a9 3 0 0018 0" />
      </svg>
    );
  }
  if (/^cs$|컴퓨터|알고리즘/i.test(name)) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    );
  }
  if (/빅데이터|데이터|data/i.test(name)) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.17L4 3a1 1 0 0 0-1 1l.17 5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82Z" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MainPage() {
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [lectures, setLectures] = useState([]);
  const [notes, setNotes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const lectureScrollRef = useRef(null);

  useEffect(() => {
    getCategoryList()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

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

  const scrollLectures = (direction) => {
    const el = lectureScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className="main-page">
      <section className="main-page__hero">
        <div className="main-page__hero-bg" aria-hidden="true" />
        <div className="main-page__hero-inner">
          <h1>오늘은 무엇을 배워볼까요?</h1>
          <form className="main-page__search" onSubmit={handleSearchSubmit}>
            <div className="main-page__search-box">
              <svg className="main-page__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="#999" strokeWidth="2" />
                <line x1="16.4" y1="16.4" x2="21" y2="21" stroke="#999" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="강의, 노트, 커뮤니티 글 통합 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {(keyword || appliedKeyword) && (
                <button
                  type="button"
                  className="main-page__search-clear"
                  onClick={handleReset}
                  aria-label="검색어 초기화"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="main-page__search-submit">검색</button>
          </form>

          {categories.length > 0 && (
            <div className="main-page__chips">
              {categories.map((category) => (
                <Link key={category.id} to="/main/lectures" className="main-page__chip">
                  <CategoryIcon name={category.name} />
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="main-page__body">
        {status === 'loading' && <p className="main-page__status">불러오는 중...</p>}
        {status === 'error' && (
          <p className="main-page__status" role="alert">불러오지 못했습니다: {error}</p>
        )}

        {status === 'success' && (
          <>
            <section className="main-page__section">
              <div className="main-page__section-head">
                <span className="main-page__eyebrow">BEST PICK</span>
                <div className="main-page__section-title-row">
                  <div>
                    <h2>{appliedKeyword ? '강의 검색 결과' : '인기 강의'}</h2>
                    <p>
                      {appliedKeyword
                        ? `'${appliedKeyword}'에 대한 검색 결과입니다`
                        : '지금 가장 많이 찾는 인기 강의를 만나보세요'}
                    </p>
                  </div>
                  <Link to="/main/lectures">전체보기</Link>
                </div>
              </div>
              {lectures.length === 0 ? (
                <p className="main-page__empty">결과가 없습니다.</p>
              ) : (
                <div className="main-page__carousel">
                  <button
                    type="button"
                    className="main-page__nav-btn main-page__nav-btn--prev"
                    onClick={() => scrollLectures(-1)}
                    aria-label="이전 강의"
                  >
                    ‹
                  </button>
                  <div className="main-page__scroll" ref={lectureScrollRef}>
                    {lectures.map((lecture) => (
                      <div className="main-page__scroll-item" key={lecture.id}>
                        <LectureCard lecture={lecture} />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="main-page__nav-btn main-page__nav-btn--next"
                    onClick={() => scrollLectures(1)}
                    aria-label="다음 강의"
                  >
                    ›
                  </button>
                </div>
              )}
            </section>

            <section className="main-page__section">
              <div className="main-page__section-head">
                <span className="main-page__eyebrow">TOP NOTES</span>
                <div className="main-page__section-title-row">
                  <div>
                    <h2>{appliedKeyword ? '노트 검색 결과' : '인기 노트'}</h2>
                    <p>
                      {appliedKeyword
                        ? `'${appliedKeyword}'에 대한 검색 결과입니다`
                        : '동료들이 가장 많이 보고 좋아요를 누른 학습 노트'}
                    </p>
                  </div>
                  <Link to="/main/notes">전체보기</Link>
                </div>
              </div>
              {notes.length === 0 ? (
                <p className="main-page__empty">결과가 없습니다.</p>
              ) : (
                <div className="main-page__list">
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </section>

            <section className="main-page__section">
              <div className="main-page__section-head">
                <span className="main-page__eyebrow">TALK</span>
                <div className="main-page__section-title-row">
                  <div>
                    <h2>{appliedKeyword ? '커뮤니티 검색 결과' : '커뮤니티'}</h2>
                    <p>
                      {appliedKeyword
                        ? `'${appliedKeyword}'에 대한 검색 결과입니다`
                        : '함께 공부하는 사람들과 질문하고 이야기해보세요'}
                    </p>
                  </div>
                  <Link to="/main/community">전체보기</Link>
                </div>
              </div>
              {posts.length === 0 ? (
                <p className="main-page__empty">결과가 없습니다.</p>
              ) : (
                <div className="main-page__panel">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default MainPage;

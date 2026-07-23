import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPostList, searchPosts } from '../api/post';
import PostCard from '../components/PostCard';
import './CommunityListPage.css';

function CommunityListPage() {
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
      ? searchPosts({ keyword: appliedKeyword, page })
      : getPostList({ page });

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

  const notices = pageData?.notices ?? [];
  const content = pageData?.content ?? [];

  return (
    <section className="community-list-page">
      <div className="community-list-page__header">
        <h2>커뮤니티</h2>
        <Link to="/main/community/new" className="community-list-page__write-btn">
          글쓰기
        </Link>
      </div>

      <form className="community-list-page__search" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="제목, 본문으로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">검색</button>
        {appliedKeyword && (
          <button type="button" className="community-list-page__reset-btn" onClick={handleReset}>
            초기화
          </button>
        )}
      </form>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">게시글을 불러오지 못했습니다: {error}</p>}

      {status === 'success' && notices.length === 0 && content.length === 0 && (
        <p>등록된 게시글이 없습니다.</p>
      )}

      {status === 'success' && (notices.length > 0 || content.length > 0) && (
        <>
          {notices.length > 0 && (
            <div className="community-list-page__grid community-list-page__grid--notice">
              {notices.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {content.length > 0 && (
            <div className="community-list-page__grid">
              {content.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="community-list-page__pagination">
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

export default CommunityListPage;

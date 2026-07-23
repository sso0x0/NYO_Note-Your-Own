import { useEffect, useState } from 'react';
import { getLectureList } from '../api/lecture';
import { getCategoryList } from '../api/category';
import LectureCard from '../components/LectureCard';
import { Link } from 'react-router-dom';
import './LectureListPage.css';

function LectureListPage() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null); // null = 전체

  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategoryList()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 강의 조회 조건이 바뀐 즉시 이전 결과 대신 로딩 상태를 보여주기 위한 의도적인 동기화입니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    getLectureList({ page, categoryId: categoryId ?? undefined })
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
  }, [page, categoryId]);

  const handleSelectCategory = (id) => {
    setCategoryId(id);
    setPage(0);
  };

  return (
    <section className="lecture-list-page">
      <h2>강의 목록</h2>

      {categories.length > 0 && (
        <div className="lecture-list-page__filters" role="group" aria-label="카테고리 필터">
          <button
            type="button"
            className={categoryId === null ? 'is-active' : ''}
            onClick={() => handleSelectCategory(null)}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={categoryId === category.id ? 'is-active' : ''}
              onClick={() => handleSelectCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">목록을 불러오지 못했습니다: {error}</p>}
      {status === 'success' && pageData?.content.length === 0 && <p>등록된 강의가 없습니다.</p>}

      {status === 'success' && pageData?.content.length > 0 && (
        <>
          <div className="lecture-list-page__grid">
            {pageData.content.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>

          <div className="lecture-list-page__pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageData.first}
            >
              이전
            </button>
            <span>
              {pageData.number + 1} / {Math.max(pageData.totalPages, 1)}
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

      {/* 메인 강의 목록 아래에서 기존 노트와 커뮤니티 게시판으로 이동할 수 있습니다. */}
      <div className="lecture-list-page__board-links">
        <section>
          <h2>노트 목록</h2>
          <p>학습 내용을 정리한 노트를 확인하고 새 노트를 작성할 수 있습니다.</p>
          <Link to="/main/notes?page=1&sort=createdAt">노트 목록으로 이동</Link>
        </section>
        <section>
          <h2>게시판</h2>
          <p>공지와 커뮤니티 게시글을 확인하고 의견을 나눌 수 있습니다.</p>
          <Link to="/main/community?page=1&sort=createdAt">게시판으로 이동</Link>
        </section>
      </div>
    </section>
  );
}

export default LectureListPage;

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLectureList, searchLectures } from '../api/lecture';
import { getCategoryList } from '../api/category';
import LectureCard from '../components/LectureCard';
import './LectureListPage.css';

const PAGE_SIZE = 18;
const PAGE_WINDOW = 5;
const SEARCH_TYPE_OPTIONS = [
  { value: 'all', label: '통합검색' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'author', label: '작성자' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: '최신순' },
  { value: 'likeCount', label: '인기순' },
  { value: 'viewCount', label: '조회수순' },
];

// 현재 페이지를 중심으로 최대 5개의 페이지 번호만 보여준다 (이전 / 1 2 3 4 5 / 다음 형태).
function getPageNumbers(current, totalPages) {
  if (totalPages <= PAGE_WINDOW) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  let start = Math.max(0, current - Math.floor(PAGE_WINDOW / 2));
  let end = start + PAGE_WINDOW - 1;
  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = end - PAGE_WINDOW + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function LectureListPage() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null); // null = 전체
  const [sort, setSort] = useState('likeCount');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [appliedSearchType, setAppliedSearchType] = useState('all');
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const searchTypeRef = useRef(null);

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

    const request = appliedKeyword
      ? searchLectures({ keyword: appliedKeyword, searchType: appliedSearchType, page, size: PAGE_SIZE })
      : getLectureList({
          page,
          size: PAGE_SIZE,
          categoryId: categoryId ?? undefined,
          sort: `${sort},desc`,
        });

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
  }, [page, categoryId, sort, appliedKeyword, appliedSearchType]);

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedKeyword(keyword.trim());
    setAppliedSearchType(searchType);
    setPage(0);
  };

  const clearSearch = () => {
    setKeyword('');
    setAppliedKeyword('');
    setPage(0);
  };

  useEffect(() => {
    if (!isSearchTypeOpen) return undefined;

    const closeSearchType = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'mousedown' && searchTypeRef.current?.contains(event.target)) return;
      setIsSearchTypeOpen(false);
    };

    document.addEventListener('mousedown', closeSearchType);
    window.addEventListener('keydown', closeSearchType);
    return () => {
      document.removeEventListener('mousedown', closeSearchType);
      window.removeEventListener('keydown', closeSearchType);
    };
  }, [isSearchTypeOpen]);

  const handleSelectCategory = (id) => {
    setCategoryId(id);
    setPage(0);
  };

  const handleSelectSort = (value) => {
    setSort(value);
    setPage(0);
    setIsSortOpen(false);
  };

  // 정렬 드롭다운을 메인 페이지 검색 종류 드롭다운과 같은 방식으로 바깥 클릭/ESC로 닫는다.
  useEffect(() => {
    if (!isSortOpen) return undefined;

    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

  return (
    <section className="lecture-list-page">
      <nav className="lecture-list-page__crumbs" aria-label="현재 위치">
        <Link to="/main">메인</Link>
        <span>/</span>
        <span className="is-current">강의 목록</span>
      </nav>
      <h2>강의 목록</h2>
      <div className="lecture-list-page__search-row">
        {/* 메인 페이지 검색바를 강의 목록 제목과 같은 줄 가운데에 배치한다. */}
        <form className="lecture-list-page__search" onSubmit={handleSearch}>
          <div className="lecture-list-page__search-type" ref={searchTypeRef}>
            <button
              type="button"
              className="lecture-list-page__search-type-btn"
              aria-haspopup="listbox"
              aria-expanded={isSearchTypeOpen}
              onClick={() => setIsSearchTypeOpen((open) => !open)}
            >
              <span>{SEARCH_TYPE_OPTIONS.find((option) => option.value === searchType)?.label}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isSearchTypeOpen && (
              <ul className="lecture-list-page__search-type-menu" role="listbox" aria-label="검색 종류">
                {SEARCH_TYPE_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={searchType === option.value}
                      className={`lecture-list-page__search-type-option${searchType === option.value ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSearchType(option.value);
                        setIsSearchTypeOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="lecture-list-page__search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="강의를 검색하세요"
              aria-label="강의 검색"
            />
            {(keyword || appliedKeyword) && (
              <button type="button" className="lecture-list-page__search-clear" onClick={clearSearch} aria-label="검색 초기화">×</button>
            )}
          </div>
          <button type="submit" className="lecture-list-page__search-submit">검색</button>
        </form>

        {/* 강의 수와 정렬을 노트 게시판처럼 검색창 오른쪽 같은 줄에 배치한다. */}
        <p className="lecture-list-page__summary">
          {status === 'loading' && '강의를 불러오는 중입니다.'}
          {status === 'success' && (
            pageData?.totalElements > 0
              ? `전체 ${pageData.totalElements}개의 강의`
              : '등록된 강의가 없습니다.'
          )}
        </p>

        <div className="lecture-list-page__sort" ref={sortRef}>
          <button
            type="button"
            className="lecture-list-page__sort-btn"
            aria-haspopup="listbox"
            aria-expanded={isSortOpen}
            onClick={() => setIsSortOpen((prev) => !prev)}
          >
            <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
            <svg
              className="lecture-list-page__sort-caret"
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              aria-hidden="true"
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isSortOpen && (
            <ul className="lecture-list-page__sort-menu" role="listbox" aria-label="정렬 기준">
              {SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={sort === option.value}
                    className={
                      'lecture-list-page__sort-option' + (sort === option.value ? ' is-selected' : '')
                    }
                    onClick={() => handleSelectSort(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="lecture-list-page__toolbar">
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

      </div>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">목록을 불러오지 못했습니다: {error}</p>}
      {status === 'success' && pageData?.content.length === 0 && (
        <div className="lecture-list-page__empty">등록된 강의가 없습니다.</div>
      )}

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
              className="lecture-list-page__page-btn lecture-list-page__page-btn--nav"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageData.first}
            >
              이전
            </button>
            {getPageNumbers(pageData.number, Math.max(pageData.totalPages, 1)).map((num) => (
              <button
                key={num}
                type="button"
                className={
                  'lecture-list-page__page-btn' + (num === pageData.number ? ' is-active' : '')
                }
                aria-current={num === pageData.number ? 'page' : undefined}
                onClick={() => setPage(num)}
              >
                {num + 1}
              </button>
            ))}
            <button
              type="button"
              className="lecture-list-page__page-btn lecture-list-page__page-btn--nav"
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

export default LectureListPage;

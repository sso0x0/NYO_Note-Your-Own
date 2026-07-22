import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryList } from '../api/category';
import { getLectureList } from '../api/lecture';
import './HomePage.css';

function MonitorIcon(props) {
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="14" rx="2"></rect>
      <line x1="8" y1="22" x2="16" y2="22"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
    </svg>
  );
}

function ServerIcon(props) {
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5v14a9 3 0 0018 0V5"></path>
      <path d="M3 12a9 3 0 0018 0"></path>
    </svg>
  );
}

function CpuIcon(props) {
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  );
}

function ChartIcon(props) {
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}

function GridIcon(props) {
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
    </svg>
  );
}

// 카테고리 이름 -> (아이콘, 테마 색상). 실제 카테고리는 /api/categories에서 오고,
// 목록에 없는 이름이 오더라도 기본 아이콘/테마로 안전하게 표시된다.
const CATEGORY_THEME = {
  프론트엔드: { Icon: MonitorIcon, theme: 'blue' },
  백엔드: { Icon: ServerIcon, theme: 'pink' },
  CS: { Icon: CpuIcon, theme: 'dark' },
  빅데이터: { Icon: ChartIcon, theme: 'green' },
};
const DEFAULT_THEME = { Icon: GridIcon, theme: 'blue' };

// 강의 API(/api/lectures)가 아직 불안정하거나(DB 스키마 이슈 등) 카테고리에
// 데이터가 없을 때 보여줄 예시 카드. LandingPage의 POPULAR_LECTURES와 같은 취지 —
// 실제 데이터가 준비되면 그쪽이 우선이고 이 목록은 자연히 안 쓰이게 된다.
const FALLBACK_LECTURES = [
  { id: 'fb-1', title: 'React 실무 마스터 클래스', instructor: '김강사', categoryName: '프론트엔드', viewCount: 5820, likeCount: 342 },
  { id: 'fb-2', title: '파이썬 데이터 분석 입문', instructor: '이강사', categoryName: '빅데이터', viewCount: 4210, likeCount: 289 },
  { id: 'fb-3', title: '스프링부트 REST API 설계', instructor: '박강사', categoryName: '백엔드', viewCount: 3150, likeCount: 201 },
  { id: 'fb-4', title: '자료구조와 알고리즘 총정리', instructor: '최강사', categoryName: 'CS', viewCount: 6890, likeCount: 415 },
  { id: 'fb-5', title: 'TypeScript 실전 UI 개발', instructor: '정강사', categoryName: '프론트엔드', viewCount: 4520, likeCount: 298 },
  { id: 'fb-6', title: '머신러닝 실전 프로젝트', instructor: '한강사', categoryName: '빅데이터', viewCount: 2980, likeCount: 176 },
];

function formatCount(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0);
}

// 로그인 후 첫 화면(메인페이지). 검색/카테고리 필터/추천 강의 카드로 구성된 대시보드.
// 노트 개수·AI 노트 요약은 아직 뒷단 API가 없어서, 화면 구조만 먼저 잡아둔 자리표시자다.
function HomePage() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = 전체
  const [lectures, setLectures] = useState(FALLBACK_LECTURES);
  const [query, setQuery] = useState('');
  const [summaryHint, setSummaryHint] = useState(null);

  useEffect(() => {
    getCategoryList().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getLectureList({ size: 6, categoryId: activeCategory ?? undefined })
      .then((data) => {
        if (cancelled) return;
        if (data?.content?.length) {
          setLectures(data.content);
        } else {
          const categoryName = categories.find((c) => c.id === activeCategory)?.name;
          setLectures(
              categoryName
                  ? FALLBACK_LECTURES.filter((l) => l.categoryName === categoryName)
                  : FALLBACK_LECTURES,
          );
        }
      })
      .catch(() => {
        // 강의 API가 아직 불안정 — 카테고리에 맞는 예시 데이터로 대체
        const categoryName = categories.find((c) => c.id === activeCategory)?.name;
        setLectures(
            categoryName
                ? FALLBACK_LECTURES.filter((l) => l.categoryName === categoryName)
                : FALLBACK_LECTURES,
        );
      });
    return () => { cancelled = true; };
  }, [activeCategory, categories]);

  const visibleLectures = lectures.filter((l) =>
      l.title.toLowerCase().includes(query.trim().toLowerCase()));

  const handleSummaryClick = (id) => {
    setSummaryHint(id);
    setTimeout(() => setSummaryHint((cur) => (cur === id ? null : cur)), 1800);
  };

  return (
      <div className="home-page">
        <section className="home-hero">
          <h1>NYO - 온라인 강의 노트 플랫폼</h1>
          <div className="home-search">
            <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="찾으시는 강의 또는 노트를 검색해 보세요."
            />
          </div>
        </section>

        <section className="home-categories">
          <button
              type="button"
              className={`home-category-tab${activeCategory === null ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
          >
            <GridIcon />
            전체
          </button>
          {categories.map((category) => {
            const { Icon } = CATEGORY_THEME[category.name] ?? DEFAULT_THEME;
            return (
                <button
                    key={category.id}
                    type="button"
                    className={`home-category-tab${activeCategory === category.id ? ' active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                >
                  <Icon />
                  {category.name}
                </button>
            );
          })}
        </section>

        <section className="home-lectures">
          <h2>추천 강의 &amp; 인기 노트</h2>
          <div className="home-lectures__grid">
            {visibleLectures.map((lecture) => {
              const { Icon: ThemeIcon, theme } = CATEGORY_THEME[lecture.categoryName] ?? DEFAULT_THEME;
              const isPlaceholder = String(lecture.id).startsWith('fb-');
              return (
                  <article className={`home-card home-card--${theme}`} key={lecture.id}>
                    <Link to={isPlaceholder ? '#' : `/main/lectures/${lecture.id}`} className="home-card__thumb">
                      <ThemeIcon width={34} height={34} />
                    </Link>
                    <div className="home-card__body">
                      {lecture.categoryName && <span className="home-card__category">{lecture.categoryName}</span>}
                      <h3 className="home-card__title">{lecture.title}</h3>
                      <div className="home-card__meta">
                        <span className="home-card__instructor-avatar" aria-hidden="true">
                          {lecture.instructor?.slice(0, 1) ?? '?'}
                        </span>
                        <span>{lecture.instructor ?? '강사 미정'}</span>
                        <span className="home-card__badge">노트 25개</span>
                      </div>
                      <div className="home-card__stats">
                        <span>조회 {formatCount(lecture.viewCount)}</span>
                        <span>좋아요 {formatCount(lecture.likeCount)}</span>
                      </div>
                      <button
                          type="button"
                          className="home-card__summary"
                          onClick={() => handleSummaryClick(lecture.id)}
                      >
                        AI 노트 요약
                      </button>
                      {summaryHint === lecture.id && (
                          <p className="home-card__summary-hint">곧 제공될 기능이에요. 조금만 기다려주세요!</p>
                      )}
                    </div>
                  </article>
              );
            })}
            {visibleLectures.length === 0 && (
                <p className="home-lectures__empty">검색 결과가 없습니다.</p>
            )}
          </div>
        </section>
      </div>
  );
}

export default HomePage;

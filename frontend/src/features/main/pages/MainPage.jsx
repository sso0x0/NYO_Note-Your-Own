import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLectureList, getPopularLectures, searchLectures } from '../../lecture/api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { getNoteListByCategory, getPopularNotes, searchNotes } from '../../note/api/note';
import { getPopularPosts, searchPosts } from '../../community/api/post';
import LectureCard from '../../lecture/components/LectureCard';
import NoteCard from '../../note/components/NoteCard';
import PostCard from '../../community/components/PostCard';
import frontendImg from '../../../assets/images/category/frontend.jpg';
import backendImg from '../../../assets/images/category/backend.jpg';
import csImg from '../../../assets/images/category/cs.png';
import bigdataImg from '../../../assets/images/category/bigdata.jpg';
import './MainPage.css';

const HIGHLIGHT_SIZE = 5;
const LECTURE_HIGHLIGHT_SIZE = 10;
const LECTURE_AUTOPLAY_MS = 3000;

const SEARCH_TYPE_OPTIONS = [
  { value: 'all', label: '통합검색' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'author', label: '작성자' },
];

// 카테고리는 프론트엔드/백엔드/CS/빅데이터 4개로 고정되어 있어(DB에 설명 컬럼이 없음) 프론트에서 짧은 설명을 매핑한다.
function getCategoryDefinition(name = '') {
  if (/프론트|front/i.test(name)) {
    return '사용자가 직접 보고 만지는 화면(UI)과 그 안의 상호작용을 만드는 분야예요. HTML/CSS/JavaScript를 기본으로, React·Vue 같은 라이브러리와 프레임워크를 활용해 웹 화면을 구현하고 반응형 레이아웃, 상태 관리, 접근성까지 함께 고려해요. 사용자가 서비스를 처음 마주하는 지점인 만큼, 디자인을 코드로 정확히 옮기는 능력과 함께 브라우저 렌더링 원리, 성능 최적화, API 연동 경험도 중요하게 다뤄지는 영역이에요. 최근에는 컴포넌트 기반 설계와 상태 관리 라이브러리(Redux, Zustand 등)를 능숙하게 다루는 능력, 그리고 SEO와 웹 접근성을 함께 고려하는 역량도 점점 더 중요해지고 있어요. 또한 크로스 브라우징 이슈나 다양한 디바이스 환경에 대응하는 테스트 경험도 실무에서 꾸준히 요구되는 부분이에요.';
  }
  if (/백엔드|back/i.test(name)) {
    return '서버, 데이터베이스, API 등 화면 뒤에서 데이터를 처리하고 저장하는 분야예요. 사용자의 요청을 받아 비즈니스 로직을 수행하고, 데이터베이스에 안전하게 데이터를 저장·조회하며, 인증/인가나 트랜잭션 같은 안정성과 보안을 책임져요. Java, Spring, Node.js 등 다양한 언어와 프레임워크로 서버 아키텍처를 설계하고, 트래픽이 몰려도 안정적으로 동작하도록 성능과 확장성을 고민하는 것도 핵심 역할이에요. 서비스가 커질수록 캐싱, 메시지 큐, 서버 분산 처리 같은 고급 주제를 다루게 되고, 배포 자동화(CI/CD)나 클라우드 인프라 운영 경험까지 함께 요구되는 경우도 많아요. 장애 대응과 로그 모니터링처럼 서비스를 안정적으로 지키는 운영 역량도 백엔드 개발자의 중요한 역할 중 하나예요.';
  }
  if (/^cs$|컴퓨터|알고리즘/i.test(name)) {
    return '자료구조, 알고리즘, 운영체제, 네트워크, 데이터베이스 이론 등 소프트웨어의 기초가 되는 컴퓨터 과학 지식을 다루는 분야예요. 특정 언어나 프레임워크에 종속되지 않는 원리를 이해함으로써 어떤 기술 스택을 쓰더라도 문제를 효율적으로 해결할 수 있는 사고력을 길러줘요. 코딩 테스트나 기술 면접에서 자주 등장하는 핵심 개념이기도 해서, 개발자로서 탄탄한 기본기를 쌓는 데 꼭 필요한 영역이에요. 시간복잡도와 공간복잡도를 분석하는 능력, 프로세스와 스레드의 동작 원리, TCP/IP 같은 네트워크 기초 지식은 실무에서 성능 이슈를 진단하고 해결할 때도 큰 도움이 돼요. 꾸준히 문제를 풀어보며 사고 과정을 코드로 표현하는 연습을 병행하면 더 효과적으로 익힐 수 있어요.';
  }
  if (/빅데이터|데이터|data/i.test(name)) {
    return '대량의 데이터를 수집·저장·처리·분석해 의미 있는 인사이트를 뽑아내는 분야예요. 통계와 데이터 파이프라인 구축부터 머신러닝·딥러닝 모델링까지 폭넓게 다루며, Python이나 SQL 같은 도구로 데이터를 정제하고 시각화하는 작업도 포함돼요. 서비스에서 쌓인 로그와 사용자 데이터를 바탕으로 의사결정을 돕거나 새로운 기능을 만들어내는, 데이터 기반 문제 해결 능력이 중요한 영역이에요. Hadoop, Spark 같은 분산 처리 프레임워크로 대규모 데이터를 다루는 경험이나, 데이터 웨어하우스·데이터 레이크 설계처럼 데이터를 체계적으로 관리하는 역량도 함께 요구돼요. 최근에는 AI/ML 모델을 실제 서비스에 배포하고 운영하는 MLOps 역량까지 데이터 분야의 범위가 점점 넓어지고 있어요.';
  }
  return '';
}

// 카테고리 이름에 어울리는 대표 이미지를 매칭한다. 매칭되는 게 없으면 프론트엔드 이미지를 기본값으로 쓴다.
function getCategoryImage(name = '') {
  if (/백엔드|back/i.test(name)) return backendImg;
  if (/^cs$|컴퓨터|알고리즘/i.test(name)) return csImg;
  if (/빅데이터|데이터|data/i.test(name)) return bigdataImg;
  return frontendImg;
}

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

// 메인 페이지: 통합 검색, 카테고리 탐색, 인기 강의/노트/커뮤니티 하이라이트를 보여준다.
function MainPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [appliedSearchType, setAppliedSearchType] = useState('all');
  const [lectures, setLectures] = useState([]);
  const [notes, setNotes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const lectureScrollRef = useRef(null);
  const lectureAutoplayPausedRef = useRef(false);
  const lecturePositionRef = useRef(0);
  const lectureStepRef = useRef(0);
  const lectureTotalWidthRef = useRef(0);
  const lectureBoostRef = useRef(0);
  const lectureRafIdRef = useRef(null);
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const searchTypeRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryLectures, setCategoryLectures] = useState([]);
  const [categoryNotes, setCategoryNotes] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState('idle'); // idle | loading | success | error

  // 카테고리 칩 목록을 불러온다.
  useEffect(() => {
    getCategoryList()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // 선택한 카테고리의 인기 강의/노트를 함께 불러온다.
  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryStatus('loading');

    Promise.all([
      getLectureList({ categoryId: selectedCategory.id, size: HIGHLIGHT_SIZE, sort: 'likeCount,desc' }),
      getNoteListByCategory({ categoryId: selectedCategory.id, size: HIGHLIGHT_SIZE, sort: 'likeCount,desc' }),
    ])
      .then(([lectureData, noteData]) => {
        if (cancelled) return;
        setCategoryLectures(lectureData?.content ?? []);
        setCategoryNotes(noteData?.content ?? []);
        setCategoryStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setCategoryStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  // 같은 카테고리를 다시 클릭하면 닫고, 다른 카테고리면 상세 시트를 연다.
  const handleToggleCategory = (category) => {
    setSelectedCategory((prev) => (prev?.id === category.id ? null : category));
  };

  // 검색 종류 드롭다운을 바깥 클릭이나 ESC로 닫는다.
  useEffect(() => {
    if (!isSearchTypeOpen) return;

    const handleClickOutside = (e) => {
      if (searchTypeRef.current && !searchTypeRef.current.contains(e.target)) {
        setIsSearchTypeOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsSearchTypeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchTypeOpen]);

  // 검색 종류를 선택하고 드롭다운을 닫는다.
  const handleSelectSearchType = (value) => {
    setSearchType(value);
    setIsSearchTypeOpen(false);
  };

  // 카테고리 상세를 바텀시트로 띄우는 동안 배경 스크롤과 ESC 닫기를 처리한다.
  useEffect(() => {
    if (!selectedCategory) return;

    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedCategory(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCategory]);

  // 검색어 유무에 따라 강의/노트/커뮤니티 인기 목록 또는 검색 결과를 불러온다.
  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    const requests = appliedKeyword
      ? [
          // 검색 상태에서는 이동 없는 한 화면에 맞춰 강의 결과를 최대 5개만 요청한다.
          searchLectures({ keyword: appliedKeyword, searchType: appliedSearchType, size: HIGHLIGHT_SIZE }),
          searchNotes({ keyword: appliedKeyword, searchType: appliedSearchType, size: HIGHLIGHT_SIZE }),
          searchPosts({ keyword: appliedKeyword, searchType: appliedSearchType, size: HIGHLIGHT_SIZE }),
        ]
      : [
          getPopularLectures({ size: LECTURE_HIGHLIGHT_SIZE }),
          getPopularNotes({ size: HIGHLIGHT_SIZE }),
          getPopularPosts({ size: HIGHLIGHT_SIZE }),
        ];

    Promise.all(requests)
      .then(([lectureData, noteData, postData]) => {
        if (cancelled) return;
        const lectureLimit = appliedKeyword ? HIGHLIGHT_SIZE : LECTURE_HIGHLIGHT_SIZE;
        setLectures((lectureData?.content ?? []).slice(0, lectureLimit));
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
  }, [appliedKeyword, appliedSearchType]);

  // 입력한 검색어와 검색 종류를 적용해 검색 결과를 조회한다.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedKeyword(keyword.trim());
    setAppliedSearchType(searchType);
  };

  // 검색어와 검색 종류를 초기화해 인기 목록으로 되돌린다.
  const handleReset = () => {
    setKeyword('');
    setAppliedKeyword('');
    setSearchType('all');
    setAppliedSearchType('all');
  };

  // 앞뒤로 원본 리스트를 하나씩 더 이어붙여서, 끝에 닿아도 반대편으로 튀지 않고 계속 이어지는 것처럼 보이게 한다.
  const extendedLectures = useMemo(
    // 검색 결과는 복제하지 않고 최대 5개만 정지 상태로 표시한다.
    () => (appliedKeyword || lectures.length <= 1 ? lectures : [...lectures, ...lectures, ...lectures]),
    [lectures, appliedKeyword]
  );

  // 카드 한 장 + gap 만큼을 한 스텝으로 계산해서, 이동 속도/거리를 카드 크기 기준으로 맞춘다.
  const getLectureItemStep = () => {
    const el = lectureScrollRef.current;
    if (!el || !el.firstElementChild) return 0;
    const gap = parseFloat(window.getComputedStyle(el).columnGap || '0') || 0;
    return el.firstElementChild.getBoundingClientRect().width + gap;
  };

  // 화살표를 누르면 멈춰있던 걸 점프시키는 대신, 흘러가던 위치에 "밀어주는 힘"만 살짝 더해서
  // 계속 흐르는 흐름 자체는 끊기지 않고 그 위에 자연스럽게 가속이 붙었다 빠지게 한다.
  const scrollLectures = (direction) => {
    if (lectures.length <= 1) return;
    const step = lectureStepRef.current || getLectureItemStep();
    if (step <= 0) return;
    lectureBoostRef.current += direction * step;
  };

  // 인기 강의 캐러셀은 멈췄다 넘어가는 방식이 아니라 항상 한 방향으로 흐르는 마퀴 방식으로 움직인다.
  // 복제해둔 [원본, 원본, 원본] 중 가운데 구간 안에서만 좌표(position)를 순환시키기 때문에
  // "끝에서 처음으로 되돌아가는" 리셋 지점 자체가 화면에 보이지 않는다.
  useEffect(() => {
    const el = lectureScrollRef.current;
    const n = lectures.length;
    if (appliedKeyword) {
      if (el) el.scrollLeft = 0;
      return undefined;
    }
    if (!el || n <= 1) return undefined;

    const step = getLectureItemStep();
    if (step <= 0) return undefined;

    lectureStepRef.current = step;
    lectureTotalWidthRef.current = step * n;
    lecturePositionRef.current = 0;
    lectureBoostRef.current = 0;
    el.scrollLeft = lectureTotalWidthRef.current;

    let lastTime = performance.now();

    const tick = (now) => {
      const dt = now - lastTime;
      lastTime = now;

      const total = lectureTotalWidthRef.current;
      const baseSpeed = lectureStepRef.current / LECTURE_AUTOPLAY_MS; // px/ms, 카드 한 칸을 약 3초에 흘러가는 속도
      let delta = lectureAutoplayPausedRef.current ? 0 : baseSpeed * dt;

      // 화살표로 받은 부스트는 지수적으로 서서히 소진시켜, 흐름 위에 자연스러운 가속처럼 얹는다.
      if (Math.abs(lectureBoostRef.current) > 0.5) {
        const consumed = lectureBoostRef.current * (1 - Math.exp(-dt / 90));
        lectureBoostRef.current -= consumed;
        delta += consumed;
      } else {
        lectureBoostRef.current = 0;
      }

      let pos = lecturePositionRef.current + delta;
      if (total > 0) {
        pos = ((pos % total) + total) % total;
      }
      lecturePositionRef.current = pos;
      el.scrollLeft = total + pos;

      lectureRafIdRef.current = requestAnimationFrame(tick);
    };

    lectureRafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (lectureRafIdRef.current) {
        cancelAnimationFrame(lectureRafIdRef.current);
        lectureRafIdRef.current = null;
      }
    };
  }, [lectures, appliedKeyword]);

  // 창 크기가 바뀌면 카드 폭이 달라지므로 속도/주기 계산에 쓰는 값을 다시 재보정한다.
  useEffect(() => {
    const handleResize = () => {
      if (lectures.length <= 1) return;
      const step = getLectureItemStep();
      if (step <= 0) return;
      lectureStepRef.current = step;
      lectureTotalWidthRef.current = step * lectures.length;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [lectures]);

  // 마우스를 올리면 인기 강의 캐러셀 자동 흐름을 멈춘다.
  const pauseLectureAutoplay = () => {
    lectureAutoplayPausedRef.current = true;
  };

  // 마우스가 벗어나면 인기 강의 캐러셀 자동 흐름을 다시 시작한다.
  const resumeLectureAutoplay = () => {
    lectureAutoplayPausedRef.current = false;
  };

  return (
    <div className="main-page">
      <section className="main-page__hero">
        <div className="main-page__hero-bg" aria-hidden="true" />
        <div className="main-page__hero-inner">
          <h1>오늘은 무엇을 배워볼까요?</h1>
          <form className="main-page__search" onSubmit={handleSearchSubmit}>
            {/* 검색창 왼쪽에서 통합·제목·내용·작성자 검색 범위를 선택한다. */}
            <div className="main-page__search-type" ref={searchTypeRef}>
              <button
                type="button"
                className="main-page__search-type-btn"
                aria-haspopup="listbox"
                aria-expanded={isSearchTypeOpen}
                onClick={() => setIsSearchTypeOpen((prev) => !prev)}
              >
                <span>{SEARCH_TYPE_OPTIONS.find((o) => o.value === searchType)?.label}</span>
                <svg
                  className="main-page__search-type-caret"
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isSearchTypeOpen && (
                <ul className="main-page__search-type-menu" role="listbox" aria-label="검색 종류">
                  {SEARCH_TYPE_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={searchType === option.value}
                        className={
                          'main-page__search-type-option' +
                          (searchType === option.value ? ' is-selected' : '')
                        }
                        onClick={() => handleSelectSearchType(option.value)}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                <button
                  key={category.id}
                  type="button"
                  className={
                    'main-page__chip' +
                    (selectedCategory?.id === category.id ? ' is-active' : '')
                  }
                  onClick={() => handleToggleCategory(category)}
                  aria-pressed={selectedCategory?.id === category.id}
                >
                  <CategoryIcon name={category.name} />
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="main-page__body">
        {selectedCategory && (
          <div className="main-page__sheet-backdrop" onClick={() => setSelectedCategory(null)}>
            <section
              className="main-page__category-detail"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="main-page__category-detail-scroll">
                <div className="main-page__category-detail-head">
                  <img
                    className="main-page__category-detail-image"
                    src={getCategoryImage(selectedCategory.name)}
                    alt={selectedCategory.name}
                  />
                  <div className="main-page__category-detail-text">
                    <span className="main-page__eyebrow">CATEGORY</span>
                    <h2>{selectedCategory.name}</h2>
                    <p>{getCategoryDefinition(selectedCategory.name)}</p>
                  </div>
                  <button
                    type="button"
                    className="main-page__category-close"
                    onClick={() => setSelectedCategory(null)}
                    aria-label="카테고리 상세 닫기"
                  >
                    ×
                  </button>
                </div>

                {categoryStatus === 'loading' && <p className="main-page__status">불러오는 중...</p>}
                {categoryStatus === 'error' && (
                  <p className="main-page__status" role="alert">불러오지 못했습니다.</p>
                )}

                {categoryStatus === 'success' && (
                  <>
                    <div className="main-page__category-block">
                      <div className="main-page__section-title-row">
                        <h3>관련 강의</h3>
                        <Link to="/main/lectures">전체보기</Link>
                      </div>
                      {categoryLectures.length === 0 ? (
                        <p className="main-page__empty">등록된 강의가 없습니다.</p>
                      ) : (
                        <div className="main-page__category-lectures">
                          {categoryLectures.map((lecture) => (
                            <LectureCard key={lecture.id} lecture={lecture} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="main-page__category-block">
                      <div className="main-page__section-title-row">
                        <h3>관련 노트</h3>
                        <Link to="/main/notes">전체보기</Link>
                      </div>
                      {categoryNotes.length === 0 ? (
                        <p className="main-page__empty">등록된 노트가 없습니다.</p>
                      ) : (
                        <div className="main-page__list">
                          {categoryNotes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onTagClick={(tagName) => navigate(`/main/notes?keyword=${encodeURIComponent(tagName)}`)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

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
                <div
                  className={`main-page__carousel${appliedKeyword ? ' is-search-result' : ''}`}
                  onMouseEnter={pauseLectureAutoplay}
                  onMouseLeave={resumeLectureAutoplay}
                >
                  {!appliedKeyword && (
                    <button
                      type="button"
                      className="main-page__nav-btn main-page__nav-btn--prev"
                      onClick={() => scrollLectures(-1)}
                      aria-label="이전 강의"
                    >
                      ‹
                    </button>
                  )}
                  <div className="main-page__scroll" ref={lectureScrollRef}>
                    {extendedLectures.map((lecture, index) => (
                      <div className="main-page__scroll-item" key={`${lecture.id}-${index}`}>
                        <LectureCard lecture={lecture} />
                      </div>
                    ))}
                  </div>
                  {!appliedKeyword && (
                    <button
                      type="button"
                      className="main-page__nav-btn main-page__nav-btn--next"
                      onClick={() => scrollLectures(1)}
                      aria-label="다음 강의"
                    >
                      ›
                    </button>
                  )}
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
                    <NoteCard
                      key={note.id}
                      note={note}
                      onTagClick={(tagName) => navigate(`/main/notes?keyword=${encodeURIComponent(tagName)}`)}
                    />
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

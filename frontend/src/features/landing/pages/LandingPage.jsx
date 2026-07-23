import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import nyoLogo from '../../../assets/images/nyo_logo.png';
import './LandingPage.css';

function MonitorIcon(props) {
  return (
    <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="14" rx="2"></rect>
      <line x1="8" y1="22" x2="16" y2="22"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
    </svg>
  );
}

function ServerIcon(props) {
  return (
    <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5v14a9 3 0 0018 0V5"></path>
      <path d="M3 12a9 3 0 0018 0"></path>
    </svg>
  );
}

function CpuIcon(props) {
  return (
    <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
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
    <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}

const EyeIcon = (props) => (
  <svg className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const HeartIcon = (props) => (
  <svg className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
  </svg>
);

// 실제 강의 데이터가 아직 충분하지 않아, 카테고리당 3개씩 임의로 만든 인기 강의 예시.
const POPULAR_LECTURES = {
  프론트엔드: [
    { title: 'React 완벽 가이드: 컴포넌트 설계부터 상태관리까지', instructor: '김민준', students: 512, likeCount: 342, viewCount: 5820 },
    { title: '타입스크립트로 시작하는 실전 UI 개발', instructor: '이서연', students: 388, likeCount: 289, viewCount: 4210 },
    { title: 'CSS Grid & Flexbox 레이아웃 마스터클래스', instructor: '박도윤', students: 276, likeCount: 201, viewCount: 3150 },
  ],
  백엔드: [
    { title: '스프링부트로 배우는 실전 REST API 설계', instructor: '최지훈', students: 601, likeCount: 415, viewCount: 6890 },
    { title: '대용량 트래픽을 견디는 서버 아키텍처', instructor: '정하은', students: 402, likeCount: 298, viewCount: 4520 },
    { title: 'JPA와 QueryDSL로 배우는 데이터 접근 계층', instructor: '한소율', students: 245, likeCount: 176, viewCount: 2980 },
  ],
  CS: [
    { title: '자료구조와 알고리즘 총정리', instructor: '오세훈', students: 730, likeCount: 523, viewCount: 8420 },
    { title: '운영체제 핵심 개념 완전정복', instructor: '배유진', students: 340, likeCount: 267, viewCount: 3890 },
    { title: '네트워크 기초부터 실전 트러블슈팅까지', instructor: '강태윤', students: 198, likeCount: 188, viewCount: 2650 },
  ],
  빅데이터: [
    { title: '파이썬으로 시작하는 데이터 분석', instructor: '윤채원', students: 655, likeCount: 456, viewCount: 7120 },
    { title: '머신러닝 실전 프로젝트로 배우기', instructor: '신동현', students: 470, likeCount: 334, viewCount: 5340 },
    { title: 'SQL로 배우는 데이터 전처리', instructor: '임하늘', students: 289, likeCount: 210, viewCount: 3410 },
  ],
};

const CATEGORIES = [
  { name: '프론트엔드', theme: 'blue', Icon: MonitorIcon },
  { name: '백엔드', theme: 'pink', Icon: ServerIcon },
  { name: 'CS', theme: 'dark', Icon: CpuIcon },
  { name: '빅데이터', theme: 'green', Icon: ChartIcon },
];

function formatCount(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function LandingPage() {
  const { isAuthenticated, auth } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const activeCategoryData = CATEGORIES.find((c) => c.name === activeCategory);
  const rootRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = rootRef.current.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page" ref={rootRef}>
      <nav className={scrolled ? 'scrolled' : ''}>
        <Link to="/" className="logo">
          <span className="logo-mark">
            <img src={nyoLogo} alt="NYO" />
          </span>
        </Link>
        <ul className={`nav-links${menuOpen ? ' mobile-open' : ''}`}>
          <li><a href="#categories" onClick={closeMenu}>카테고리 탐색</a></li>
          <li><a href="#how" onClick={closeMenu}>이용 방법</a></li>
          <li><a href="#features" onClick={closeMenu}>서비스 특징</a></li>
          <li><a href="#preview" onClick={closeMenu}>대시보드</a></li>
        </ul>
        <div className={`auth-buttons${menuOpen ? ' mobile-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{auth?.nickname}님</span>
              <Link to="/main" className="btn-signup" onClick={closeMenu}>메인으로 이동</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login" onClick={closeMenu}>로그인</Link>
              <Link to="/signup" className="btn-signup" onClick={closeMenu}>회원가입</Link>
            </>
          )}
        </div>
        <button
          type="button"
          className={`nav-toggle${menuOpen ? ' open' : ''}`}
          aria-label="메뉴 열기"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      <header className="hero">
        <div className="hero-text">
          <h1>따로 적던 강의 기록,<br />이제 <span className="highlight">한 곳에</span> 모으다</h1>
          <p>인프런, 유데미, 유튜브 등 여기저기 흩어져 있던 나만의 요약본들. 이제 NYO에서 강의 단위로 매칭하여 서로의 지식을 비교하고 함께 성장해 보세요.</p>
          <Link to={isAuthenticated ? '/main' : '/signup'} className="btn-primary-cta">
            지금 시작하기
            <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>
        <div className="hero-graphic">
          <div className="graphic-box box-1">
            <div className="dummy-line title"></div>
            <div className="dummy-line point"></div>
            <div className="dummy-line"></div>
            <div className="dummy-line short"></div>
          </div>
          <div className="graphic-box box-2">
            <p className="box-2-label">
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              뽀모도로 타이머 가동 중
            </p>
            <div className="dummy-line" style={{ width: '95%', backgroundColor: 'var(--pastel-pink)', height: 12, borderRadius: 4, marginBottom: 0 }}></div>
          </div>
          <div className="graphic-box box-3">
            <div className="tag-dot">
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41L13.42 20.58a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </div>
            <div style={{ flexGrow: 1 }}>
              <div className="dummy-line short" style={{ marginBottom: 6 }}></div>
              <div className="dummy-line" style={{ width: '80%', marginBottom: 0, height: 6 }}></div>
            </div>
          </div>
        </div>
      </header>

      <section className="category-section" id="categories">
        <h2 className="section-title reveal">관심 있는 분야의 지식을 찾아보세요</h2>

        <div className="category-container reveal">
          {CATEGORIES.map((category) => (
            <div
              key={category.name}
              className={`category-tab${activeCategory === category.name ? ' active' : ''}`}
              onClick={() => setActiveCategory(category.name)}
            >
              <category.Icon width="16" height="16" />
              {category.name}
            </div>
          ))}
        </div>

        <div className="category-lectures reveal">
          <div className="category-lectures__grid">
            {POPULAR_LECTURES[activeCategory].map((lecture, index) => (
              <article className={`popular-card popular-card--${activeCategoryData.theme}`} key={lecture.title}>
                <div className="popular-card__thumb">
                  <span className="popular-card__rank">{index + 1}</span>
                  <activeCategoryData.Icon width="34" height="34" />
                </div>
                <div className="popular-card__body">
                  <span className="popular-card__category">{activeCategory}</span>
                  <h4 className="popular-card__title">{lecture.title}</h4>
                  <p className="popular-card__instructor">{lecture.instructor} 강사</p>
                  <div className="popular-card__stats">
                    <span><EyeIcon /> {formatCount(lecture.viewCount)}</span>
                    <span><HeartIcon /> {formatCount(lecture.likeCount)}</span>
                    <span>수강생 {formatCount(lecture.students)}명</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how">
        <h2 className="section-title reveal">NYO는 이렇게 사용해요</h2>
        <div className="steps-grid">
          <div className="step-card reveal">
            <div className="step-number">01</div>
            <h3>
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path></svg>
              강의 연동하기
            </h3>
            <p>인프런, 유데미, 유튜브 등 외부 강의 링크를 등록해 강의 단위로 나만의 학습 노트를 연결하세요.</p>
            <span className="step-arrow">
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
          <div className="step-card reveal">
            <div className="step-number">02</div>
            <h3>
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              노트 작성하기
            </h3>
            <p>이미지와 코드 블록을 곁들여 블로그 형식으로 정리하고, 뽀모도로 타이머로 집중하면 AI가 핵심 태그를 자동으로 붙여줘요.</p>
            <span className="step-arrow">
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
          <div className="step-card reveal">
            <div className="step-number">03</div>
            <h3>
              <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87"></path><path d="M16 3.13a4 4 0 010 7.75"></path></svg>
              비교하고 공유하기
            </h3>
            <p>작성한 노트는 모두 공개돼요. 같은 강의를 듣는 사람들과 좋아요·댓글로 소통하고, RAG 챗봇으로 놓친 부분까지 복습하세요.</p>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <h2 className="section-title reveal">학습 몰입을 이끄는 완벽한 생태계</h2>
        <div className="feature-grid">
          <div className="feature-card reveal">
            <div className="icon-circle f-blue">
              <svg className="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h3>1:N 강의-노트 연결</h3>
            <p>로컬 드라이브나 개인 블로그에 뿔뿔이 파편화되어 있던 학습 정리본을 원본 강의 기준 하나로 매끄럽게 매핑합니다.</p>
          </div>
          <div className="feature-card reveal">
            <div className="icon-circle f-pink">
              <svg className="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3>뽀모도로 집중 타이머</h3>
            <p>노트 작성 및 영상 시청 주기에 맞춰 스스로 집중 시간을 조절하고, 누적 기록 통계를 마이페이지에서 비주얼 그래프로 피드백 받습니다.</p>
          </div>
          <div className="feature-card reveal">
            <div className="icon-circle f-dark">
              <svg className="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
            </div>
            <h3>AI 자동 태깅 & RAG 챗봇</h3>
            <p>OpenAI 기술 기반으로 긴 노트를 요약 판별하고 최적화 분류 태그를 매칭합니다. 본인이 정리한 컨텐츠를 지식 베이스로 삼은 RAG 복습 챗봇이 탑재됩니다.</p>
          </div>
        </div>
      </section>

      <section className="preview-section" id="preview">
        <h2 className="section-title reveal">깔끔한 블로그 형태의 대시보드</h2>
        <p style={{ color: 'var(--text-gray)', marginTop: 15, marginBottom: 40 }} className="reveal">실제 유저들이 가장 만족하는 NYO의 인터페이스를 먼저 확인해보세요.</p>

        <div className="dashboard-mockup reveal">
          <div className="mockup-header">
            <div className="circle"></div><div className="circle"></div><div className="circle"></div>
          </div>
          <div className="mockup-body">
            <div className="mockup-sidebar">
              <div className="mockup-menu active" style={{ width: '80%' }}></div>
              <div className="mockup-menu" style={{ width: '90%' }}></div>
              <div className="mockup-menu" style={{ width: '70%' }}></div>
            </div>
            <div className="mockup-content">
              <h4>
                <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                이번 주 가장 핫한 강의 노트
              </h4>
              <div className="note-card">
                <p>[React 완벽 가이드] 컴포넌트 스타일링 핵심 요약</p>
                <p>작성자: 홍길동</p>
              </div>
              <div className="note-card">
                <p>[Java 핵심 OOP] 객체지향 5대 원칙(SOLID) 한눈에 정리하기</p>
                <p>작성자: 홍길동</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta reveal">
        <h2>지금 나의 강의 노트를 정리해보세요</h2>
        <p>가입은 1분이면 충분해요. 흩어진 지식을 NYO 하나로 모아보세요.</p>
        <Link to={isAuthenticated ? '/main' : '/signup'} className="btn-signup">시작하기</Link>
      </section>

      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo-mark">
              <img src={nyoLogo} alt="NYO - 누구의 노트인가요?" />
            </span>
            <p className="footer-desc">온라인 강의 노트를 공유하고 비교하는 통합 지식 공유 플랫폼</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Project Team · INT A</h4>
              <p>박소현 · 염상환 · 오찬빈 · 장예지</p>
            </div>
          </div>
        </div>
        <div className="copyright">&copy; 2026 NYO Project INT A.</div>
      </footer>
    </div>
  );
}

export default LandingPage;

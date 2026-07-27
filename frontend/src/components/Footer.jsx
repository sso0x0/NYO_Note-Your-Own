import nyoLogo from '../assets/images/nyo_logo.png';
import './Footer.css';

// 로그인 후 화면 전체에서 공통으로 보이는 하단 푸터.
function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__brand">
          <span className="app-footer__logo-mark">
            <img src={nyoLogo} alt="NYO" />
          </span>
          <p>온라인 강의 노트를 공유하고 비교하는 통합 지식 공유 플랫폼</p>
        </div>
        <div className="app-footer__col">
          <h4>Project Team · INT A</h4>
          <p>박소현 · 염상환 · 오찬빈 · 장예지</p>
        </div>
      </div>
      <div className="app-footer__copyright">© 2026 NYO Project INT A.</div>
    </footer>
  );
}

export default Footer;

import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WidgetDock from './WidgetDock';
import './ProtectedLayout.css';

// 로그인 후 화면 전체에서 공통으로 쓰는 레이아웃. 상단 헤더(Header)와 하단 푸터(Footer)는
// 모든 /main, /admin 이외의 보호된 페이지에서 공통으로 재사용하도록 별도 컴포넌트로 분리했다.
// 뽀모도로/챗봇은 라우트가 아니라 WidgetDock(우하단 플로팅 아이콘 2개)으로 모든 페이지에 떠 있다.
function ProtectedLayout() {
  return (
    <div className="protected-layout">
      <Header />
      <main className="protected-layout__content">
        <Outlet />
      </main>
      <Footer />
      <WidgetDock />
    </div>
  );
}

export default ProtectedLayout;

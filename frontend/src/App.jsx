import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LectureListPage from './pages/LectureListPage';
import LectureDetailPage from './pages/LectureDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/main" element={<ProtectedLayout />}>
          <Route index element={<LectureListPage />} />
          <Route path="lectures/:id" element={<LectureDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

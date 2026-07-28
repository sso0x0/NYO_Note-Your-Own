import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminLectureList } from '../api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { deleteLecture } from '../api/admin';
import { usePagedList } from '../hooks/usePagedList';

const PAGE_SIZE = 10;

function AdminLecturesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const lectures = usePagedList(({ page, size }) => getAdminLectureList({ page, size, categoryId: categoryId || undefined }));
  const [expandedLectureId, setExpandedLectureId] = useState(null);

  useEffect(() => {
    getCategoryList().then(setCategories).catch(() => setCategories([]));
  }, []);

  // usePagedList는 page/reload 변경에만 반응하므로, 카테고리 필터를 바꾸면
  // 1페이지로 되돌리고 reload()로 최신 categoryId를 반영해 다시 조회한다.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    lectures.setPage(0);
    lectures.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleToggle = (lectureId) => {
    setExpandedLectureId((prev) => (prev === lectureId ? null : lectureId));
  };

  const handleDelete = async (lecture) => {
    if (!window.confirm(`"${lecture.title}" 강의를 삭제할까요?`)) return;

    try {
      await deleteLecture(lecture.id);
      lectures.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <select
          className="admin-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => navigate('/admin/lectures/new')}>새 강의 등록</button>
      </div>

      <div className="admin-page__scroll">
        {lectures.status === 'loading' && <p>불러오는 중...</p>}
        {lectures.status === 'error' && <p role="alert">불러오지 못했습니다: {lectures.error}</p>}

        {lectures.status === 'success' && lectures.pageData && (
          <table className="admin-table admin-table--lecture">
            <thead>
              <tr>
                <th>번호</th>
                <th>ID</th>
                <th>카테고리</th>
                <th>강의명</th>
                <th>강사</th>
                <th>수강</th>
                <th>인기</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lectures.pageData.content.map((lecture, index) => (
                <Fragment key={lecture.id}>
                  <tr>
                    <td>{lectures.page * PAGE_SIZE + index + 1}</td>
                    <td>{lecture.id}</td>
                    <td>{lecture.categoryName}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(lecture.id)}>
                        {lecture.title}
                      </button>
                    </td>
                    <td>{lecture.instructor}</td>
                    <td>{lecture.currentEnrolled}{lecture.capacity != null ? ` / ${lecture.capacity}` : ''}</td>
                    <td>{lecture.isPopular ? '인기' : ''}</td>
                    <td className="admin-actions">
                      <button type="button" className="admin-btn admin-btn--sm" onClick={() => navigate(`/admin/lectures/${lecture.id}/edit`)}>수정</button>
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(lecture)}>삭제</button>
                    </td>
                  </tr>
                  {expandedLectureId === lecture.id && (
                    <tr>
                      <td colSpan={8}>
                        <dl className="admin-author-info">
                          <div>
                            <dt>노트 개수</dt>
                            <dd>{lecture.noteCount ?? 0}</dd>
                          </div>
                          <div>
                            <dt>댓글 개수</dt>
                            <dd>{lecture.commentCount ?? 0}</dd>
                          </div>
                          <div>
                            <dt>조회수</dt>
                            <dd>{lecture.viewCount ?? 0}</dd>
                          </div>
                          <div>
                            <dt>좋아요수</dt>
                            <dd>{lecture.likeCount ?? 0}</dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {/* 데이터가 적은 페이지(특히 마지막 페이지)에서도 표 높이가 항상 동일하도록
                  빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다. */}
              {Array.from({ length: Math.max(0, PAGE_SIZE - lectures.pageData.content.length) }).map((_, i) => (
                <tr key={`filler-${i}`} className="admin-filler-row" aria-hidden="true">
                  <td colSpan={8}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lectures.status === 'success' && lectures.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => lectures.setPage((p) => Math.max(0, p - 1))} disabled={lectures.pageData.first}>
            이전
          </button>
          <span>{lectures.pageData.number + 1} / {Math.max(lectures.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => lectures.setPage((p) => p + 1)} disabled={lectures.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminLecturesPage;

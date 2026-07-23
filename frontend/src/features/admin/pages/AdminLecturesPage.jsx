import { useEffect, useState } from 'react';
import { getLectureList } from '../../lecture/api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { createLecture, updateLecture, deleteLecture } from '../api/admin';
import './AdminLecturesPage.css';

const EMPTY_FORM = {
  categoryId: '',
  title: '',
  description: '',
  lectureUrl: '',
  thumbnailUrl: '',
  instructor: '',
  capacity: '',
};

function AdminLecturesPage() {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [editingId, setEditingId] = useState(null); // null = 새 강의 등록 폼 닫힘, 'new' = 등록, id = 수정
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategoryList().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    getLectureList({ page })
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
  }, [page, reloadKey]);

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditingId('new');
  };

  const handleOpenEdit = (lecture) => {
    setForm({
      categoryId: lecture.categoryId ?? '',
      title: lecture.title ?? '',
      description: lecture.description ?? '',
      lectureUrl: lecture.lectureUrl ?? '',
      thumbnailUrl: lecture.thumbnailUrl ?? '',
      instructor: lecture.instructor ?? '',
      capacity: lecture.capacity ?? '',
    });
    setFormError(null);
    setEditingId(lecture.id);
  };

  const handleCloseForm = () => {
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const request = {
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      title: form.title,
      description: form.description || null,
      lectureUrl: form.lectureUrl || null,
      thumbnailUrl: form.thumbnailUrl || null,
      instructor: form.instructor || null,
      capacity: form.capacity ? Number(form.capacity) : null,
    };

    try {
      if (editingId === 'new') {
        await createLecture(request);
      } else {
        await updateLecture(editingId, request);
      }
      setEditingId(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lecture) => {
    if (!window.confirm(`"${lecture.title}" 강의를 삭제할까요?`)) return;

    try {
      await deleteLecture(lecture.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-lectures">
      <div className="admin-lectures__header">
        <h3>강의 관리</h3>
        {editingId === null && (
          <button type="button" onClick={handleOpenCreate}>새 강의 등록</button>
        )}
      </div>

      {editingId !== null && (
        <form className="admin-lectures__form" onSubmit={handleSubmit}>
          <h4>{editingId === 'new' ? '새 강의 등록' : '강의 수정'}</h4>
          {formError && <p className="admin-lectures__error" role="alert">{formError}</p>}

          <label>
            카테고리
            <select name="categoryId" value={form.categoryId} onChange={handleFormChange} required>
              <option value="">선택하세요</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            강의명
            <input name="title" value={form.title} onChange={handleFormChange} required maxLength={200} />
          </label>
          <label>
            강의 설명
            <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} />
          </label>
          <label>
            강의 링크
            <input name="lectureUrl" value={form.lectureUrl} onChange={handleFormChange} placeholder="https://..." />
          </label>
          <label>
            썸네일 URL
            <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleFormChange} placeholder="https://..." />
          </label>
          <label>
            강사명
            <input name="instructor" value={form.instructor} onChange={handleFormChange} maxLength={100} />
          </label>
          <label>
            수강 정원 (미입력 시 무제한)
            <input type="number" name="capacity" value={form.capacity} onChange={handleFormChange} min={1} />
          </label>

          <div className="admin-lectures__form-actions">
            <button type="submit" disabled={submitting}>{submitting ? '저장 중...' : '저장'}</button>
            <button type="button" onClick={handleCloseForm} disabled={submitting}>취소</button>
          </div>
        </form>
      )}

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">불러오지 못했습니다: {error}</p>}

      {status === 'success' && pageData && (
        <>
          <table className="admin-lectures__table">
            <thead>
              <tr>
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
              {pageData.content.map((lecture) => (
                <tr key={lecture.id}>
                  <td>{lecture.id}</td>
                  <td>{lecture.categoryName}</td>
                  <td>{lecture.title}</td>
                  <td>{lecture.instructor}</td>
                  <td>{lecture.currentEnrolled}{lecture.capacity != null ? ` / ${lecture.capacity}` : ''}</td>
                  <td>{lecture.isPopular ? '인기' : ''}</td>
                  <td className="admin-lectures__actions">
                    <button type="button" onClick={() => handleOpenEdit(lecture)}>수정</button>
                    <button type="button" onClick={() => handleDelete(lecture)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-lectures__pagination">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageData.first}>
              이전
            </button>
            <span>{pageData.number + 1} / {Math.max(pageData.totalPages, 1)}</span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={pageData.last}>
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminLecturesPage;

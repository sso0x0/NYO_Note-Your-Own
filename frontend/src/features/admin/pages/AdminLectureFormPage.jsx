import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLecture } from '../../lecture/api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { createLecture, updateLecture } from '../api/admin';
import './AdminLectureFormPage.css';

const EMPTY_FORM = {
  categoryId: '',
  title: '',
  description: '',
  lectureUrl: '',
  thumbnailUrl: '',
  instructor: '',
  capacity: '',
};

function AdminLectureFormPage() {
  const { id } = useParams();
  const isEdit = id != null;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategoryList().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(null);

    getLecture(id)
      .then((lecture) => {
        if (cancelled) return;
        setForm({
          categoryId: lecture.categoryId ?? '',
          title: lecture.title ?? '',
          description: lecture.description ?? '',
          lectureUrl: lecture.lectureUrl ?? '',
          thumbnailUrl: lecture.thumbnailUrl ?? '',
          instructor: lecture.instructor ?? '',
          capacity: lecture.capacity ?? '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const handleCancel = () => {
    navigate('/admin/lectures');
  };

  const validate = () => {
    const errors = {};
    if (!form.categoryId) errors.categoryId = '카테고리를 선택해주세요.';
    if (!form.title.trim()) errors.title = '강의명을 입력해주세요.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
      if (isEdit) {
        await updateLecture(id, request);
      } else {
        await createLecture(request);
      }
      navigate('/admin/lectures');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar admin-toolbar--form">
        <h3 className="admin-page__title">{isEdit ? '강의 수정' : '새 강의 등록'}</h3>
        <button type="button" className="admin-btn" onClick={handleCancel} disabled={submitting}>목록으로</button>
      </div>

      <div className="admin-page__scroll">
        {loading && <p>불러오는 중...</p>}
        {loadError && <p role="alert">불러오지 못했습니다: {loadError}</p>}

        {!loading && !loadError && (
          <form className="admin-lecture-form" onSubmit={handleSubmit} noValidate>
            {formError && <p className="admin-error" role="alert">{formError}</p>}

            <div className="admin-lecture-form__grid">
              <label>
                카테고리
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleFormChange}
                  required
                  className={fieldErrors.categoryId ? 'admin-field--invalid' : undefined}
                >
                  <option value="">선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {fieldErrors.categoryId && <span className="admin-field-error">{fieldErrors.categoryId}</span>}
              </label>
              <label>
                강의명
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  maxLength={200}
                  className={fieldErrors.title ? 'admin-field--invalid' : undefined}
                />
                {fieldErrors.title && <span className="admin-field-error">{fieldErrors.title}</span>}
              </label>
              <label>
                강사명
                <input name="instructor" value={form.instructor} onChange={handleFormChange} maxLength={100} />
              </label>
              <label>
                수강 정원 (미입력 시 무제한)
                <input type="number" name="capacity" value={form.capacity} onChange={handleFormChange} min={1} />
              </label>
              <label>
                강의 URL
                <input name="lectureUrl" value={form.lectureUrl} onChange={handleFormChange} placeholder="https://..." />
              </label>
              <label>
                썸네일 URL
                <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleFormChange} placeholder="https://..." />
              </label>
              <label className="admin-lecture-form__full">
                강의 설명
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={8} />
              </label>
            </div>
          </form>
        )}
      </div>

      {!loading && !loadError && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn admin-btn--primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? '저장 중...' : '저장'}
          </button>
          <button type="button" className="admin-btn" onClick={handleCancel} disabled={submitting}>취소</button>
        </div>
      )}
    </div>
  );
}

export default AdminLectureFormPage;

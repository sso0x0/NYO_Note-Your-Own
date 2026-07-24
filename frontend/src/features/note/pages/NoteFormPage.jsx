import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLectureList } from '../../lecture/api/lecture';
import { createNote, getNote, updateNote } from '../api/note';
import './NoteFormPage.css';

function NoteFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [lectureId, setLectureId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState(isEdit ? 'loading' : 'success'); // loading | success | error
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLectureList({ size: 100 })
      .then((data) => setLectures(data?.content ?? []))
      .catch(() => setLectures([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    getNote(id)
      .then((note) => {
        if (cancelled) return;
        setLectureId(String(note.lectureId));
        setTitle(note.title);
        setContent(note.content);
        setThumbnailUrl(note.thumbnailUrl ?? '');
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
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const request = {
      lectureId: lectureId ? Number(lectureId) : undefined,
      title,
      content,
      thumbnailUrl: thumbnailUrl || undefined,
    };

    try {
      const saved = isEdit ? await updateNote(id, request) : await createNote(request);
      navigate(`/main/notes/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (isEdit && status === 'loading') {
    return (
      <section className="note-form-page">
        <p>불러오는 중...</p>
      </section>
    );
  }

  if (isEdit && status === 'error') {
    return (
      <section className="note-form-page">
        <p role="alert">노트를 불러오지 못했습니다: {error}</p>
      </section>
    );
  }

  return (
    <section className="note-form-page">
      <h2>{isEdit ? '노트 수정' : '노트 작성'}</h2>

      <form onSubmit={handleSubmit}>
        <label>
          강의
          <select value={lectureId} onChange={(e) => setLectureId(e.target.value)} required>
            <option value="" disabled>
              강의를 선택하세요
            </option>
            {lectures.map((lecture) => (
              <option key={lecture.id} value={lecture.id}>
                {lecture.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          제목
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>

        <label>
          썸네일 이미지 URL (선택)
          <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
        </label>

        <label>
          본문
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} required />
        </label>

        {error && <p role="alert" className="note-form-page__error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </section>
  );
}

export default NoteFormPage;

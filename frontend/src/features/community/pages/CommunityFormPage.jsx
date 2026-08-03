import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { canCreateNotice, createPost, getPost, updatePost } from '../api/post';
import './CommunityFormPage.css';

// 게시글 작성/수정 공용 폼 (id 파라미터 유무로 모드를 구분한다)
function CommunityFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [notice, setNotice] = useState(false);
  const [canNotice, setCanNotice] = useState(false);
  const [status, setStatus] = useState(isEdit ? 'loading' : 'success'); // loading | success | error
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 현재 사용자가 공지글을 작성할 수 있는지 확인한다.
  useEffect(() => {
    canCreateNotice()
      .then((v) => setCanNotice(!!v))
      .catch(() => setCanNotice(false));
  }, []);

  // 수정 모드일 때 기존 게시글 데이터를 불러와 폼을 채운다.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    getPost(id)
      .then((post) => {
        if (cancelled) return;
        setTitle(post.title);
        setContent(post.content);
        setThumbnailUrl(post.thumbnailUrl ?? '');
        setNotice(!!post.notice);
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

  // 모드에 따라 게시글을 생성 또는 수정하고 상세 화면으로 이동한다.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const request = {
      title,
      content,
      thumbnailUrl: thumbnailUrl || undefined,
      notice: canNotice ? notice : undefined,
    };

    try {
      const saved = isEdit ? await updatePost(id, request) : await createPost(request);
      navigate(`/main/community/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (isEdit && status === 'loading') {
    return (
      <section className="community-form-page">
        <p>불러오는 중...</p>
      </section>
    );
  }

  if (isEdit && status === 'error') {
    return (
      <section className="community-form-page">
        <p role="alert">게시글을 불러오지 못했습니다: {error}</p>
      </section>
    );
  }

  return (
    <section className="community-form-page">
      <h2>{isEdit ? '게시글 수정' : '글쓰기'}</h2>

      <form onSubmit={handleSubmit}>
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

        {canNotice && (
          <label className="community-form-page__checkbox">
            <input type="checkbox" checked={notice} onChange={(e) => setNotice(e.target.checked)} />
            공지글로 등록
          </label>
        )}

        {error && <p role="alert" className="community-form-page__error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </section>
  );
}

export default CommunityFormPage;

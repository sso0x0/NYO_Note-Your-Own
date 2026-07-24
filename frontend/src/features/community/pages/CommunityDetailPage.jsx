import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { deletePost, getPost, increasePostViewCount, isPostLiked, likePost, unlikePost } from '../api/post';
import './CommunityDetailPage.css';

function CommunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);
    setLiked(false);

    getPost(id)
      .then((data) => {
        if (cancelled) return;
        setPost(data);
        setStatus('success');
        increasePostViewCount(id).catch(() => {});
        isPostLiked(id)
          .then((value) => {
            if (!cancelled) setLiked(!!value);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isOwner = !!post && auth?.userId === post.userId;

  const handleToggleLike = async () => {
    try {
      if (liked) {
        await unlikePost(id);
        setLiked(false);
        setPost((p) => (p ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) - 1) } : p));
      } else {
        await likePost(id);
        setLiked(true);
        setPost((p) => (p ? { ...p, likeCount: (p.likeCount ?? 0) + 1 } : p));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 게시글을 삭제할까요?')) return;
    try {
      await deletePost(id);
      navigate('/main/community');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="community-detail-page">
      <Link to="/main/community" className="community-detail-page__back">
        ← 커뮤니티 목록
      </Link>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">게시글을 불러오지 못했습니다: {error}</p>}

      {status === 'success' && post && (
        <>
          {post.notice && <span className="community-detail-page__badge">공지</span>}
          <h2 className="community-detail-page__title">{post.title}</h2>
          {post.authorNickname && <p className="community-detail-page__author">{post.authorNickname}</p>}

          <div className="community-detail-page__meta">
            <span>조회 {post.viewCount ?? 0}</span>
            <span>좋아요 {post.likeCount ?? 0}</span>
          </div>

          <div className="community-detail-page__actions">
            <button
              type="button"
              className={`community-detail-page__like-btn${liked ? ' is-active' : ''}`}
              aria-pressed={liked}
              onClick={handleToggleLike}
            >
              {liked ? '♥ 좋아요 취소' : '♡ 좋아요'}
            </button>

            {isOwner && (
              <>
                <Link to={`/main/community/${id}/edit`} className="community-detail-page__edit-btn">
                  수정
                </Link>
                <button type="button" className="community-detail-page__delete-btn" onClick={handleDelete}>
                  삭제
                </button>
              </>
            )}
          </div>

          {post.thumbnailUrl && (
            <div className="community-detail-page__thumb">
              <img src={post.thumbnailUrl} alt={post.title} />
            </div>
          )}

          <p className="community-detail-page__content">{post.content}</p>
        </>
      )}
    </section>
  );
}

export default CommunityDetailPage;

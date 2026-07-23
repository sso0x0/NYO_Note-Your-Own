import { Link } from 'react-router-dom';
import './PostCard.css';

function PostCard({ post }) {
  const { id, title, authorNickname, thumbnailUrl, viewCount, likeCount, notice, createdAt } = post;

  return (
    <article className={`post-card${notice ? ' post-card--notice' : ''}`}>
      <Link to={`/main/community/${id}`} className="post-card__link">
        <div className="post-card__thumb">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} loading="lazy" />
          ) : (
            <div className="post-card__thumb-fallback" aria-hidden="true" />
          )}
        </div>

        <div className="post-card__body">
          {notice && <span className="post-card__badge">공지</span>}
          <h3 className="post-card__title">{title}</h3>
          {authorNickname && <p className="post-card__author">{authorNickname}</p>}

          <div className="post-card__meta">
            <span>조회 {viewCount ?? 0}</span>
            <span>좋아요 {likeCount ?? 0}</span>
            {createdAt && <span>{createdAt.slice(0, 10)}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default PostCard;

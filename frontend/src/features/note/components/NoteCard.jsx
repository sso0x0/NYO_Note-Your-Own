import { Link } from 'react-router-dom';
import './NoteCard.css';

function NoteCard({ note }) {
  const { id, title, authorNickname, lectureTitle, categoryName, thumbnailUrl, viewCount, likeCount, createdAt, tags } = note;

  return (
    <article className="note-card">
      <Link to={`/main/notes/${id}`} className="note-card__link">
        <div className="note-card__thumb">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} loading="lazy" />
          ) : (
            <div className="note-card__thumb-fallback" aria-hidden="true" />
          )}
        </div>

        <div className="note-card__body">
          {(categoryName || lectureTitle) && (
            <div className="note-card__eyebrow">
              {categoryName && <span className="note-card__category">{categoryName}</span>}
              {lectureTitle && <span className="note-card__lecture">{lectureTitle}</span>}
            </div>
          )}
          <h3 className="note-card__title">{title}</h3>
          {authorNickname && <p className="note-card__author">{authorNickname}</p>}

          {tags?.length > 0 && (
            <div className="note-card__tags">
              {tags.map((tag) => (
                <span key={tag.tagId} className="note-card__tag">
                  #{tag.tagName}
                </span>
              ))}
            </div>
          )}

          <div className="note-card__meta">
            <span>조회 {viewCount ?? 0}</span>
            <span>좋아요 {likeCount ?? 0}</span>
            {createdAt && <span>{createdAt.slice(0, 10)}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default NoteCard;

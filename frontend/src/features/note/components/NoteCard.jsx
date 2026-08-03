import { Link } from 'react-router-dom';
import './NoteCard.css';

// 노트 목록/메인 페이지에서 쓰는 카드. 썸네일·제목·태그·좋아요 등 요약 정보를 보여준다.
function NoteCard({ note, onTagClick }) {
  const { id, title, authorNickname, lectureTitle, categoryName, thumbnailUrl, viewCount, likeCount, createdAt, tags } = note;

  // 태그 클릭 시 카드 링크 이동을 막고 부모에게 태그 클릭 이벤트만 전달한다.
  const handleTagClick = (event, tagName) => {
    if (!onTagClick) return;
    // 태그를 누를 때 부모 카드 링크가 실행되어 노트 상세로 이동하는 것을 막는다.
    event.preventDefault();
    event.stopPropagation();
    onTagClick(tagName);
  };

  return (
    <article className="note-card">
      <Link to={`/main/notes/${id}`} className="note-card__link">
        <div className="note-card__thumb">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} loading="lazy" />
          ) : (
            /* 메인 페이지 인기 노트도 게시판과 같은 기본 썸네일을 사용한다. */
            <img
              className="note-card__thumb-fallback-image"
              src="/images/note-empty.png"
              alt=""
              draggable={false}
            />
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
                <span
                  key={tag.tagId}
                  className={`note-card__tag${onTagClick ? ' note-card__tag--clickable' : ''}`}
                  role={onTagClick ? 'link' : undefined}
                  tabIndex={onTagClick ? 0 : undefined}
                  onClick={(event) => handleTagClick(event, tag.tagName)}
                  onKeyDown={(event) => {
                    if (onTagClick && (event.key === 'Enter' || event.key === ' ')) {
                      handleTagClick(event, tag.tagName);
                    }
                  }}
                >
                  {tag.isAiGenerated && <span className="note-card__tag-ai">AI</span>}
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

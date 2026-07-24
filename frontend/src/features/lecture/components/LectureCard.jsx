import { Link } from 'react-router-dom';
import fallbackThumbnail from '../../../assets/images/null.png';
import { resolveLectureThumbnail } from '../../../utils/youtubeThumbnail';
import './LectureCard.css';

function LectureCard({ lecture }) {
  const {
    id,
    title,
    instructor,
    categoryName,
    viewCount,
    likeCount,
    currentEnrolled,
    capacity,
    isPopular,
  } = lecture;

  const thumbnailSrc = resolveLectureThumbnail(lecture) ?? fallbackThumbnail;

  return (
    <article className="lecture-card">
      <Link to={`/main/lectures/${id}`} className="lecture-card__link">
        <div className="lecture-card__thumb">
          <img
            src={thumbnailSrc}
            alt={title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = fallbackThumbnail;
            }}
          />
          {isPopular && <span className="lecture-card__badge">인기</span>}
        </div>

        <div className="lecture-card__body">
          {categoryName && <span className="lecture-card__category">{categoryName}</span>}
          <h3 className="lecture-card__title">{title}</h3>
          {instructor && <p className="lecture-card__instructor">{instructor}</p>}

          <div className="lecture-card__meta">
            <span>조회 {viewCount ?? 0}</span>
            <span>좋아요 {likeCount ?? 0}</span>
            <span>
              수강 {currentEnrolled ?? 0}
              {capacity != null ? ` / ${capacity}` : ''}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default LectureCard;

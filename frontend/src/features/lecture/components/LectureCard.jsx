import { Link } from 'react-router-dom';
import fallbackThumbnail from '../../../assets/images/null.png';
import { resolveLectureThumbnail } from '../../../utils/youtubeThumbnail';
import './LectureCard.css';

// 강의 목록/추천 영역에서 쓰는 카드 하나: 썸네일 + 인기 배지 + 카테고리/제목/태그/통계를 보여준다.
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
    // 강의는 아직 AI 해시태그 저장 테이블이 없어 항상 비어있다. 백엔드에 lecture_tags가 추가되면
    // NoteCard와 동일한 형태({ tagId, tagName, isAiGenerated })로 내려주면 바로 렌더링된다.
    tags,
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

          {tags?.length > 0 && (
            <div className="lecture-card__tags">
              {tags.map((tag) => (
                <span key={tag.tagId} className="lecture-card__tag">
                  #{tag.tagName}
                </span>
              ))}
            </div>
          )}

          <div className="lecture-card__footer">
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
        </div>
      </Link>
    </article>
  );
}

export default LectureCard;

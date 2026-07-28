import { Fragment, useState } from 'react';
import { getAdminPostList, restorePost } from '../api/post';
import { deletePost } from '../../community/api/post';
import { usePagedList } from '../hooks/usePagedList';
import './AdminModerationPage.css';

const PAGE_SIZE = 10;

function AdminModerationPage() {
  const posts = usePagedList(getAdminPostList);
  const [expandedPostId, setExpandedPostId] = useState(null);

  const handleToggle = (postId) => {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm(`"${post.title}" 게시글을 삭제할까요?`)) return;
    try {
      await deletePost(post.id);
      posts.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestorePost = async (post) => {
    if (!window.confirm('복구하시겠습니까?')) return;
    try {
      await restorePost(post.id);
      posts.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const postItems = posts.pageData?.content ?? [];
  // 데이터가 적은 페이지(특히 마지막 페이지·빈 목록)에서도 표 높이가 항상 동일하도록
  // 빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다.
  const fillerCount = Math.max(0, PAGE_SIZE - postItems.length);

  return (
    <div className="admin-page">
      <div className="admin-page__scroll">
        <div className="admin-toolbar" />
        {posts.status === 'loading' && <p>불러오는 중...</p>}
        {posts.status === 'error' && <p role="alert">불러오지 못했습니다: {posts.error}</p>}
        {posts.status === 'success' && posts.pageData && (
          <table className="admin-table admin-table--post">
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>조회</th>
                <th>좋아요</th>
                <th>금지어 검사</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {postItems.map((post, index) => (
                <Fragment key={post.id}>
                  <tr className={post.isDeleted ? 'admin-row--deleted' : undefined}>
                    <td>{posts.pageData.number * PAGE_SIZE + index + 1}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(post.id)}>
                        {post.notice ? '[공지] ' : ''}{post.title} {post.isDeleted && <span className="admin-deleted-label">(삭제됨)</span>}
                      </button>
                    </td>
                    <td>{post.authorNickname}</td>
                    <td>{post.viewCount ?? 0}</td>
                    <td>{post.likeCount ?? 0}</td>
                    <td>
                      {post.prohibitedWords?.length > 0 ? (
                        <span className="admin-moderation-warning">
                          검토 필요
                        </span>
                      ) : '정상'}
                    </td>
                    <td className="admin-actions">
                      {post.isDeleted ? (
                        <button type="button" className="admin-deleted-button" onClick={() => handleRestorePost(post)}>삭제됨</button>
                      ) : (
                        <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeletePost(post)}>삭제</button>
                      )}
                    </td>
                  </tr>
                  {expandedPostId === post.id && (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-detail-wrap">
                          <div className="admin-detail">{post.content}</div>
                          <dl className="admin-author-info">
                            <div>
                              <dt>유저 ID</dt>
                              <dd>{post.userId}</dd>
                            </div>
                            <div>
                              <dt>로그인 아이디</dt>
                              <dd>{post.authorLoginId ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>이메일</dt>
                              <dd>{post.authorEmail ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>권한</dt>
                              <dd>{post.authorRole ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>상태</dt>
                              <dd>{post.authorStatus ?? '-'}</dd>
                            </div>
                          </dl>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {Array.from({ length: fillerCount }).map((_, i) => (
                <tr key={`filler-${i}`} className="admin-filler-row" aria-hidden="true">
                  <td colSpan={6}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 게시글 내용을 펼쳐 봐도 표 영역만 스크롤되고, 이전/다음 버튼은 화면의 같은 위치에 그대로 남는다. */}
      {posts.status === 'success' && posts.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => posts.setPage((p) => Math.max(0, p - 1))} disabled={posts.pageData.first}>
            이전
          </button>
          <span>{posts.pageData.number + 1} / {Math.max(posts.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => posts.setPage((p) => p + 1)} disabled={posts.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminModerationPage;

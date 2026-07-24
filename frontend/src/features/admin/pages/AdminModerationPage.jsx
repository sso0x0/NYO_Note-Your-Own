import { Fragment, useState } from 'react';
import { getPostList, deletePost } from '../../community/api/post';
import { usePagedList } from '../hooks/usePagedList';
import './AdminModerationPage.css';

const PAGE_SIZE = 10;

function AdminModerationPage() {
  const posts = usePagedList(getPostList);
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

  // 공지(notices)는 content(size:10)와 별개로 항상 얹혀 오기 때문에, 합친 뒤 10개로
  // 잘라야 관리자 화면에 실제로 10개씩만 보인다.
  const postItems = [...(posts.pageData?.notices ?? []), ...(posts.pageData?.content ?? [])].slice(0, PAGE_SIZE);
  // 데이터가 적은 페이지(특히 마지막 페이지·빈 목록)에서도 표 높이가 항상 동일하도록
  // 빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다.
  const fillerCount = Math.max(0, PAGE_SIZE - postItems.length);

  return (
    <div className="admin-page">
      <div className="admin-page__scroll">
        <div className="admin-toolbar" />
        {posts.status === 'loading' && <p>불러오는 중...</p>}
        {posts.status === 'error' && <p role="alert">불러오지 못했습니다: {posts.error}</p>}
        {posts.status === 'success' && (
          <table className="admin-table admin-table--post">
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>조회</th>
                <th>좋아요</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {postItems.map((post, index) => (
                <Fragment key={post.id}>
                  <tr>
                    <td>{posts.page * PAGE_SIZE + index + 1}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(post.id)}>
                        {post.notice ? '[공지] ' : ''}{post.title}
                      </button>
                    </td>
                    <td>{post.authorNickname}</td>
                    <td>{post.viewCount ?? 0}</td>
                    <td>{post.likeCount ?? 0}</td>
                    <td className="admin-actions">
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeletePost(post)}>삭제</button>
                    </td>
                  </tr>
                  {expandedPostId === post.id && (
                    <tr>
                      <td colSpan={6}>
                        <div className="admin-detail">{post.content}</div>
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
      {posts.status === 'success' && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => posts.setPage((p) => Math.max(0, p - 1))} disabled={posts.page === 0}>
            이전
          </button>
          <span>{posts.page + 1} / {Math.max(posts.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => posts.setPage((p) => p + 1)} disabled={posts.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminModerationPage;

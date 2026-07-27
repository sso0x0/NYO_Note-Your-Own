import { Fragment, useEffect, useRef, useState } from 'react';
import { getCommentList, deleteComment } from '../api/comment';
import { usePagedList } from '../hooks/usePagedList';
import './AdminCommentsPage.css';

const PAGE_SIZE = 10;

const TARGET_TYPE_LABEL = {
  POST: '게시글',
  LECTURE: '강의',
};

function AdminCommentsPage() {
  const [targetType, setTargetType] = useState('');
  const comments = usePagedList(({ page, size }) => getCommentList({ page, size, targetType: targetType || undefined }));
  const [expandedCommentId, setExpandedCommentId] = useState(null);

  // usePagedList는 page/reload 변경에만 반응하므로, 유형 필터를 바꾸면
  // 1페이지로 되돌리고 reload()로 최신 targetType을 반영해 다시 조회한다.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    comments.setPage(0);
    comments.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType]);

  const handleToggle = (commentId) => {
    setExpandedCommentId((prev) => (prev === commentId ? null : commentId));
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('이 댓글을 삭제할까요?')) return;
    try {
      await deleteComment(comment.id);
      comments.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const commentItems = comments.pageData?.content ?? [];
  // 데이터가 적은 페이지(특히 마지막 페이지·빈 목록)에서도 표 높이가 항상 동일하도록
  // 빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다.
  const fillerCount = Math.max(0, PAGE_SIZE - commentItems.length);

  return (
    <div className="admin-page">
      <div className="admin-page__scroll">
        <div className="admin-toolbar">
          <select
            className="admin-select"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          >
            <option value="">전체 유형</option>
            <option value="POST">게시글</option>
            <option value="LECTURE">강의</option>
          </select>
        </div>
        {comments.status === 'loading' && <p>불러오는 중...</p>}
        {comments.status === 'error' && <p role="alert">불러오지 못했습니다: {comments.error}</p>}
        {comments.status === 'success' && comments.pageData && (
          <table className="admin-table admin-table--comment">
            <thead>
              <tr>
                <th>번호</th>
                <th>유형</th>
                <th>구분</th>
                <th>대상</th>
                <th>작성자</th>
                <th>이메일</th>
                <th>작성일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {commentItems.map((comment, index) => (
                <Fragment key={comment.id}>
                  <tr>
                    <td>{comments.pageData.number * PAGE_SIZE + index + 1}</td>
                    <td>{TARGET_TYPE_LABEL[comment.targetType] ?? comment.targetType}</td>
                    <td>{comment.parentCommentId ? '답글' : '댓글'}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(comment.id)}>
                        {comment.targetTitle ?? '(삭제된 대상)'}
                      </button>
                    </td>
                    <td>{comment.authorNickname}</td>
                    <td>{comment.authorEmail ?? '-'}</td>
                    <td>{comment.createdAt?.slice(0, 10)}</td>
                    <td className="admin-actions">
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeleteComment(comment)}>삭제</button>
                    </td>
                  </tr>
                  {expandedCommentId === comment.id && (
                    <tr>
                      <td colSpan={8}>
                        <div className="admin-comments__detail">
                          <div className="admin-detail">{comment.content}</div>
                          <dl className="admin-comments__author-info">
                            <div>
                              <dt>구분</dt>
                              <dd>{comment.parentCommentId ? `답글 (상위 댓글 #${comment.parentCommentId})` : '원댓글'}</dd>
                            </div>
                            <div>
                              <dt>유저 ID</dt>
                              <dd>{comment.userId}</dd>
                            </div>
                            <div>
                              <dt>로그인 아이디</dt>
                              <dd>{comment.authorLoginId ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>권한</dt>
                              <dd>{comment.authorRole ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>상태</dt>
                              <dd>{comment.authorStatus ?? '-'}</dd>
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
                  <td colSpan={8}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 댓글 내용을 펼쳐 봐도 표 영역만 스크롤되고, 이전/다음 버튼은 화면의 같은 위치에 그대로 남는다. */}
      {comments.status === 'success' && comments.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => comments.setPage((p) => Math.max(0, p - 1))} disabled={comments.pageData.first}>
            이전
          </button>
          <span>{comments.pageData.number + 1} / {Math.max(comments.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => comments.setPage((p) => p + 1)} disabled={comments.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminCommentsPage;

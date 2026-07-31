import { Fragment, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAdminNoteList } from '../api/note';
import { deleteNote } from '../../note/api/note';
import { usePagedList } from '../hooks/usePagedList';
import './AdminNotesPage.css';

const PAGE_SIZE = 10;

function AdminNotesPage() {
  const location = useLocation();
  const notes = usePagedList(getAdminNoteList, location.state?.focusPage ?? 0);
  // 신고 관리에서 선택한 노트 ID가 있으면 해당 상세 행을 자동으로 연다.
  const [expandedNoteId, setExpandedNoteId] = useState(location.state?.focusTargetId ?? null);

  const handleToggle = (noteId) => {
    setExpandedNoteId((prev) => (prev === noteId ? null : noteId));
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`"${note.title}" 노트를 삭제할까요?`)) return;
    try {
      await deleteNote(note.id);
      notes.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const noteItems = notes.pageData?.content ?? [];
  // 데이터가 적은 페이지(특히 마지막 페이지·빈 목록)에서도 표 높이가 항상 동일하도록
  // 빈 줄을 채워, 이전/다음 버튼 위치가 페이지마다 흔들리지 않게 한다.
  const fillerCount = Math.max(0, PAGE_SIZE - noteItems.length);

  return (
    <div className="admin-page">
      <div className="admin-page__scroll">
        <div className="admin-toolbar" />
        {notes.status === 'loading' && <p>불러오는 중...</p>}
        {notes.status === 'error' && <p role="alert">불러오지 못했습니다: {notes.error}</p>}
        {notes.status === 'success' && notes.pageData && (
          <table className="admin-table admin-table--note">
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>강의</th>
                <th>작성자</th>
                <th>조회</th>
                <th>좋아요</th>
                <th>금지어 검사</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {noteItems.map((note, index) => (
                <Fragment key={note.id}>
                  <tr className={note.isDeleted ? 'admin-row--deleted' : undefined}>
                    <td>{notes.pageData.number * PAGE_SIZE + index + 1}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(note.id)}>
                        {note.title} {note.isDeleted && <span className="admin-deleted-label">(삭제됨)</span>}
                      </button>
                    </td>
                    <td>{note.lectureTitle ?? '(연결 안 됨)'}</td>
                    <td>{note.authorNickname}</td>
                    <td>{note.viewCount ?? 0}</td>
                    <td>{note.likeCount ?? 0}</td>
                    <td>
                      {note.prohibitedWords?.length > 0 ? (
                        <span className="admin-moderation-warning">
                          검토 필요
                        </span>
                      ) : '정상'}
                    </td>
                    <td className="admin-actions">
                      {note.isDeleted ? (
                        <span className="admin-deleted-label admin-actions__deleted-label">삭제됨</span>
                      ) : (
                        <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeleteNote(note)}>삭제</button>
                      )}
                    </td>
                  </tr>
                  {expandedNoteId === note.id && (
                    <tr>
                      <td colSpan={8}>
                        <div className="admin-detail-wrap">
                          <div className="admin-detail">{note.content}</div>

                          <h4 className="admin-section-title">작성자 정보</h4>
                          <dl className="admin-author-info">
                            <div>
                              <dt>유저 ID</dt>
                              <dd>{note.userId}</dd>
                            </div>
                            <div>
                              <dt>로그인 아이디</dt>
                              <dd>{note.authorLoginId ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>이메일</dt>
                              <dd>{note.authorEmail ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>권한</dt>
                              <dd>{note.authorRole ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>상태</dt>
                              <dd>{note.authorStatus ?? '-'}</dd>
                            </div>
                          </dl>

                          <h4 className="admin-section-title">강의 정보</h4>
                          <dl className="admin-author-info">
                            <div>
                              <dt>강의 ID</dt>
                              <dd>{note.lectureId ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>강의명</dt>
                              <dd>{note.lectureTitle ?? '(연결 안 됨)'}</dd>
                            </div>
                            <div>
                              <dt>카테고리</dt>
                              <dd>{note.lectureCategoryName ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>강사</dt>
                              <dd>{note.lectureInstructor ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>수강 인원</dt>
                              <dd>
                                {note.lectureCurrentEnrolled ?? '-'}
                                {note.lectureCapacity != null ? ` / ${note.lectureCapacity}` : ''}
                              </dd>
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
                  <td colSpan={7}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 노트 내용을 펼쳐 봐도 표 영역만 스크롤되고, 이전/다음 버튼은 화면의 같은 위치에 그대로 남는다. */}
      {notes.status === 'success' && notes.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => notes.setPage((p) => Math.max(0, p - 1))} disabled={notes.pageData.first}>
            이전
          </button>
          <span>{notes.pageData.number + 1} / {Math.max(notes.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => notes.setPage((p) => p + 1)} disabled={notes.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminNotesPage;

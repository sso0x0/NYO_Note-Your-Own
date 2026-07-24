import { Fragment, useState } from 'react';
import { getNoteList, deleteNote } from '../../note/api/note';
import { usePagedList } from '../hooks/usePagedList';
import './AdminNotesPage.css';

const PAGE_SIZE = 10;

function AdminNotesPage() {
  const notes = usePagedList(getNoteList);
  const [expandedNoteId, setExpandedNoteId] = useState(null);

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
        {notes.status === 'success' && (
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
              {noteItems.map((note, index) => (
                <Fragment key={note.id}>
                  <tr>
                    <td>{notes.page * PAGE_SIZE + index + 1}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => handleToggle(note.id)}>
                        {note.title}
                      </button>
                    </td>
                    <td>{note.authorNickname}</td>
                    <td>{note.viewCount ?? 0}</td>
                    <td>{note.likeCount ?? 0}</td>
                    <td className="admin-actions">
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeleteNote(note)}>삭제</button>
                    </td>
                  </tr>
                  {expandedNoteId === note.id && (
                    <tr>
                      <td colSpan={6}>
                        <div className="admin-detail">{note.content}</div>
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

      {/* 노트 내용을 펼쳐 봐도 표 영역만 스크롤되고, 이전/다음 버튼은 화면의 같은 위치에 그대로 남는다. */}
      {notes.status === 'success' && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => notes.setPage((p) => Math.max(0, p - 1))} disabled={notes.page === 0}>
            이전
          </button>
          <span>{notes.page + 1} / {Math.max(notes.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => notes.setPage((p) => p + 1)} disabled={notes.pageData.last}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminNotesPage;

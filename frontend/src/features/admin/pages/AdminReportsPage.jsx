import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminReports, markReportReviewed } from '../../report/api/report'
import { usePagedList } from '../hooks/usePagedList'
import './AdminReportsPage.css'

const PAGE_SIZE = 10
const TYPE_LABEL = { NOTE: '노트', POST: '게시글', COMMENT: '댓글' }
const formatDate = (value) => value ? new Date(value).toLocaleString('ko-KR') : '-'

function AdminReportsPage() {
  const navigate = useNavigate()
  const reports = usePagedList(getAdminReports)
  const [expandedId, setExpandedId] = useState(null)

  const review = async (report) => {
    if (!window.confirm('이 신고를 확인 완료로 처리하시겠습니까?')) return
    try {
      await markReportReviewed(report.id)
      reports.reload()
    } catch (error) {
      window.alert(error.message)
    }
  }

  const items = reports.pageData?.content ?? []
  const targetPath = { NOTE: '/admin/notes', POST: '/admin/moderation', COMMENT: '/admin/comments' }

  return (
    <div className="admin-page admin-reports">
      <div className="admin-page__scroll">
        {reports.status === 'loading' && <p>불러오는 중...</p>}
        {reports.status === 'error' && <p role="alert">불러오지 못했습니다: {reports.error}</p>}
        {reports.status === 'success' && reports.pageData && (
          <table className="admin-table admin-table--reports">
            <thead>
              <tr>
                <th>번호</th><th>대상</th><th>제목</th><th>신고자</th>
                <th>신고 사유</th><th>신고일</th><th>회원 관리</th><th>대상 관리</th><th>상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((report, index) => (
                <Fragment key={report.id}>
                  <tr className={report.status === 'REVIEWED' ? 'admin-report--reviewed' : undefined}>
                    <td>{reports.pageData.number * PAGE_SIZE + index + 1}</td>
                    <td>{TYPE_LABEL[report.targetType] ?? report.targetType}</td>
                    <td>
                      <button type="button" className="admin-table__title-btn" onClick={() => setExpandedId((current) => current === report.id ? null : report.id)}>
                        {report.targetTitle}
                      </button>
                    </td>
                    <td>{report.reporterNickname}</td>
                    <td className="admin-reports__reason">{report.reason}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        onClick={() => navigate('/admin/users', { state: { focusUserId: report.reporterId, focusPage: report.userPage } })}
                      >
                        회원관리
                      </button>
                    </td>
                    <td>
                      {/* 신고 종류에 따라 해당 관리자 목록으로 이동하고 대상 행을 자동으로 펼친다. */}
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        onClick={() => navigate(targetPath[report.targetType], { state: { focusTargetId: report.targetId, focusPage: report.targetPage } })}
                      >
                        {TYPE_LABEL[report.targetType]}관리
                      </button>
                    </td>
                    <td>
                      {report.status === 'PENDING' ? (
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => review(report)}>확인</button>
                      ) : <span className="admin-reports__done">확인 완료</span>}
                    </td>
                  </tr>
                  {expandedId === report.id && (
                    <tr>
                      <td colSpan={9}>
                        <div className="admin-report-detail">
                          <div><strong>신고 사유</strong><p>{report.reason}</p></div>
                          <div><strong>신고 대상 내용</strong><p>{report.targetContent || '(내용 없음)'}</p></div>
                          <small>대상 ID: {report.targetId} · 신고자 ID: {report.reporterId}</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {items.length === 0 && <tr><td colSpan={9} className="admin-reports__empty">접수된 신고가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {reports.status === 'success' && reports.pageData && (
        <div className="admin-pagination">
          <button type="button" className="admin-btn" onClick={() => reports.setPage((page) => Math.max(0, page - 1))} disabled={reports.pageData.first}>이전</button>
          <span>{reports.pageData.number + 1} / {Math.max(reports.pageData.totalPages, 1)}</span>
          <button type="button" className="admin-btn" onClick={() => reports.setPage((page) => page + 1)} disabled={reports.pageData.last}>다음</button>
        </div>
      )}
    </div>
  )
}

export default AdminReportsPage

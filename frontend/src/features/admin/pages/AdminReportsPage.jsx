import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminReports, markReportReviewed } from '../../report/api/report'
import { usePagedList } from '../hooks/usePagedList'
import './AdminReportsPage.css'

const PAGE_SIZE = 10
const TYPE_LABEL = { NOTE: '노트', POST: '게시글', COMMENT: '댓글' }
// 숫자를 2자리 문자열로 맞춘다 (예: 3 -> "03").
const pad2 = (n) => String(n).padStart(2, '0')
// ISO 날짜 문자열을 "YY.MM.DD HH:MI:SS" 형식으로 변환한다.
const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  const yy = pad2(d.getFullYear() % 100)
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  const ss = pad2(d.getSeconds())
  return `${yy}.${mm}.${dd} ${hh}:${mi}:${ss}`
}

// 신고 목록 관리자 화면: 노트/게시글/댓글 신고를 통합 조회하고 확인 처리한다.
function AdminReportsPage() {
  const navigate = useNavigate()
  const [targetType, setTargetType] = useState('')
  const reports = usePagedList(({ page, size }) => getAdminReports({
    page,
    size,
    targetType: targetType || undefined,
  }))
  const [expandedId, setExpandedId] = useState(null)
  const firstFilterRender = useRef(true)

  // usePagedList는 page/reload 변경에만 반응하므로, 유형 필터를 바꾸면
  // 1페이지로 되돌리고 reload()로 최신 필터값을 반영해 다시 조회한다.
  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false
      return
    }
    // 유형을 변경하면 이전 페이지 번호를 유지하지 않고 첫 페이지에서 다시 조회한다.
    reports.setPage(0)
    reports.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType])

  // 확인 후 신고를 확인 완료 상태로 처리하고 목록을 다시 불러온다.
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
        <div className="admin-toolbar">
          <select className="admin-select" value={targetType} onChange={(event) => setTargetType(event.target.value)}>
            <option value="">전체 유형</option>
            <option value="NOTE">노트</option>
            <option value="POST">게시글</option>
            <option value="COMMENT">댓글</option>
          </select>
        </div>
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
                  <tr className={report.status === 'REVIEWED' ? 'admin-row--deleted' : undefined}>
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
                          <div className="admin-detail"><strong>신고 사유</strong><p>{report.reason}</p></div>
                          <div className="admin-detail"><strong>신고 대상 내용</strong><p>{report.targetContent || '(내용 없음)'}</p></div>
                          <div className="admin-report-detail__meta">
                            대상 ID: {report.targetId} · 신고자 ID: {report.reporterId}
                          </div>
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

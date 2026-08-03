import { useState } from 'react'
import { createReport } from '../api/report'
import './ReportButton.css'

// 게시글/댓글 등 대상에 대한 신고 버튼과 사유 입력 모달을 함께 제공한다.
function ReportButton({ targetType, targetId, className = '' }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 신고 모달을 닫고 입력값과 에러를 초기화한다.
  const close = () => {
    if (saving) return
    setOpen(false)
    setReason('')
    setError('')
  }

  // 사유를 검증한 뒤 신고를 서버에 등록하고 모달을 닫는다.
  const submit = async (event) => {
    event.preventDefault()
    if (!reason.trim()) {
      setError('신고 사유를 입력해 주세요.')
      return
    }
    try {
      setSaving(true)
      setError('')
      // 화면에서 받은 대상 정보와 사용자가 작성한 사유만 전송한다.
      await createReport(targetType, targetId, reason.trim())
      close()
      window.alert('신고가 접수되었습니다.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`report-open-button ${className}`.trim()}
        onClick={() => setOpen(true)}
      >
        신고
      </button>

      {open && (
        <div className="report-modal-backdrop" role="presentation" onMouseDown={close}>
          <section
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`report-title-${targetType}-${targetId}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={`report-title-${targetType}-${targetId}`}>신고 사유</h2>
            <form onSubmit={submit}>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={1000}
                rows={6}
                placeholder="관리자가 확인할 수 있도록 신고 사유를 입력해 주세요."
                autoFocus
              />
              <div className="report-modal__counter">{reason.length} / 1000</div>
              {error && <p className="report-modal__error" role="alert">{error}</p>}
              <div className="report-modal__actions">
                <button type="button" onClick={close} disabled={saving}>취소</button>
                <button type="submit" className="report-modal__submit" disabled={saving}>
                  {saving ? '신고 중...' : '신고하기'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

export default ReportButton

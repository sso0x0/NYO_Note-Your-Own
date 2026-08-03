import { useEffect, useState } from 'react';
import './RejectReasonModal.css';

// 강사 신청/강의 반려 사유 입력 UI를 신고 글 작성 모달(ReportButton)과 같은 형태로 통일한다.
function RejectReasonModal({ open, title, submitting, onCancel, onSubmit }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  // 제출 처리 중에는 닫히지 않도록 막고, 그 외에는 취소 콜백을 호출한다.
  const close = () => {
    if (submitting) return;
    onCancel();
  };

  // 반려 사유가 비어있지 않은지 검증한 뒤 트리밍해서 상위로 전달한다.
  const submit = (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('반려 사유를 입력해 주세요.');
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <div className="reject-modal-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="reject-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="reject-modal-title">{title}</h2>
        <form onSubmit={submit}>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={6}
            placeholder="반려 사유를 입력해 주세요."
            autoFocus
          />
          <div className="reject-modal__counter">{reason.length} / 1000</div>
          {error && <p className="reject-modal__error" role="alert">{error}</p>}
          <div className="reject-modal__actions">
            <button type="button" onClick={close} disabled={submitting}>취소</button>
            <button type="submit" className="reject-modal__submit" disabled={submitting}>
              {submitting ? '반려 처리 중...' : '반려하기'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RejectReasonModal;

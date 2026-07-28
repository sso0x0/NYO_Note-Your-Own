import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './charts.css';

// 차트 데이터를 표로 보여주는 팝업. 대시보드 그리드 레이아웃에 영향을 주지 않도록
// document.body에 포털로 띄운다.
function ChartTableModal({ title, columns, rows, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="chart-modal__overlay" onClick={onClose}>
      <div className="chart-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="chart-modal__header">
          <h4>{title}</h4>
          <button type="button" className="chart-modal__close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="chart-modal__body">
          <table className="chart__table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ChartTableModal;

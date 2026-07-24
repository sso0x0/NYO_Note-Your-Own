import { useState } from 'react';
import './charts.css';

// 단일 계열 가로 막대 차트 (강의 제목처럼 긴 라벨에 적합). 각 막대가 곧 히트 영역이라
// 마우스를 올리면 그 막대에 대한 툴팁이 뜨고, 값은 막대 끝에 직접 라벨로도 보여준다.
function BarChart({ data, color, valueLabel = '값' }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
      <div className="chart">
        <div className="bar-chart">
          {data.map((d, i) => (
              <div
                  key={d.label}
                  className="bar-chart__row"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
              >
                <span className="bar-chart__label" title={d.label}>{d.label}</span>
                <div className="bar-chart__track">
                  <div
                      className="bar-chart__fill"
                      style={{ width: `${(d.value / max) * 100}%`, background: color, opacity: hoverIndex === i ? 1 : 0.85 }}
                  />
                </div>
                <span className="bar-chart__value">{d.value.toLocaleString()}</span>
                {hoverIndex === i && (
                    <div className="chart__tooltip chart__tooltip--bar">
                      <strong>{d.value.toLocaleString()}</strong>
                      <span>{valueLabel} · {d.label}</span>
                    </div>
                )}
              </div>
          ))}
        </div>

        <button type="button" className="chart__table-toggle" onClick={() => setShowTable((v) => !v)}>
          {showTable ? '차트로 보기' : '표로 보기'}
        </button>

        {showTable && (
            <table className="chart__table">
              <thead>
              <tr><th>강의</th><th>{valueLabel}</th></tr>
              </thead>
              <tbody>
              {data.map((d) => (
                  <tr key={d.label}><td>{d.label}</td><td>{d.value.toLocaleString()}</td></tr>
              ))}
              </tbody>
            </table>
        )}
      </div>
  );
}

export default BarChart;

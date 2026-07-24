import { useMemo, useRef, useState } from 'react';
import './charts.css';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

// 단일 시계열 라인 차트. 데이터가 하나뿐이라 범례는 두지 않고(차트 제목이 계열명을
// 대신함), 대신 크로스헤어 + 툴팁으로 정확한 값을 확인할 수 있게 했다.
// color: 이 차트에서 쓸 단일 색상(브랜드 accent 등) — 여러 계열 비교용이 아니므로 하나만 받는다.
function LineChart({ data, color, valueLabel = '값' }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef(null);

  const { points, yTicks, maxValue } = useMemo(() => {
    const values = data.map((d) => d.value);
    const max = Math.max(1, ...values);
    // 눈금은 딱 떨어지는 값으로 (0 / max/2 / max 근사)
    const niceMax = Math.ceil(max / 5) * 5 || 5;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const pts = data.map((d, i) => ({
      x: PAD.left + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1)),
      y: PAD.top + innerH - (innerH * d.value) / niceMax,
      ...d,
    }));
    const ticks = [0, niceMax / 2, niceMax];
    return { points: pts, yTicks: ticks, maxValue: niceMax };
  }, [data]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  const handleMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < best) { best = dist; nearest = i; }
    });
    setHoverIndex(nearest);
  };

  return (
      <div className="chart">
        <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="chart__svg"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((t) => {
            const y = PAD.top + (HEIGHT - PAD.top - PAD.bottom) - ((HEIGHT - PAD.top - PAD.bottom) * t) / maxValue;
            return (
                <g key={t}>
                  <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} className="chart__grid" />
                  <text x={PAD.left - 8} y={y + 4} className="chart__axis-label" textAnchor="end">
                    {t.toLocaleString()}
                  </text>
                </g>
            );
          })}

          {hovered && (
              <line
                  x1={hovered.x} x2={hovered.x}
                  y1={PAD.top} y2={HEIGHT - PAD.bottom}
                  className="chart__crosshair"
              />
          )}

          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
              <circle
                  key={p.label}
                  cx={p.x} cy={p.y}
                  r={i === hoverIndex ? 5 : 4}
                  fill={color}
                  stroke="var(--bg, #fff)"
                  strokeWidth={2}
              />
          ))}

          {/* 히트 영역: 각 점 주변에 넉넉한 투명 원을 둬서 정확히 점을 조준하지 않아도 반응하게 함 */}
          {points.map((p, i) => (
              <circle
                  key={`hit-${p.label}`}
                  cx={p.x} cy={p.y} r={12}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
              />
          ))}
        </svg>

        {hovered && (
            <div
                className="chart__tooltip"
                style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
            >
              <strong>{hovered.value.toLocaleString()}</strong>
              <span>{hovered.label}</span>
            </div>
        )}

        <button type="button" className="chart__table-toggle" onClick={() => setShowTable((v) => !v)}>
          {showTable ? '차트로 보기' : '표로 보기'}
        </button>

        {showTable && (
            <table className="chart__table">
              <thead>
              <tr><th>날짜</th><th>{valueLabel}</th></tr>
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

export default LineChart;

import { useId, useMemo, useRef, useState } from 'react';
import './charts.css';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

// 1/2/5/10... 배수 중 roughStep 이상인 가장 작은 값으로 스냅 (표준 "nice numbers" 눈금 계산)
function niceTickStep(roughStep) {
  if (roughStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  let niceResidual;
  if (residual >= 5) niceResidual = 10;
  else if (residual >= 2) niceResidual = 5;
  else if (residual >= 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

// 단일 시계열 라인 차트. 데이터가 하나뿐이라 범례는 두지 않고(차트 제목이 계열명을
// 대신함), 대신 크로스헤어 + 툴팁으로 정확한 값을 확인할 수 있게 했다.
// color: 이 차트에서 쓸 단일 색상(브랜드 accent 등) — 여러 계열 비교용이 아니므로 하나만 받는다.
// formatValue: 툴팁/표에 표시할 값을 커스텀 포맷팅하고 싶을 때 사용 (예: 그래프는 시간 단위로 그리되
// 정확한 값은 분 단위로 보여주고 싶은 경우). 기본은 그래프에 쓰는 값 그대로 표시.
function LineChart({ data, color, valueLabel = '값', formatValue }) {
  const format = formatValue ?? ((v) => v.toLocaleString());
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef(null);
  const gradientId = useId();

  const { points, yTicks, maxValue } = useMemo(() => {
    const values = data.map((d) => d.value);
    const max = Math.max(1, ...values);
    // 눈금 3~4개를 목표로 1/2/5/10 배수 중 하나로 스텝을 스냅한다 (예: 0/5/10, 0/2/4/6, 0/10/20/30 등)
    const step = niceTickStep(max / 3);
    const niceMax = Math.ceil(max / step) * step;
    const ticks = [];
    for (let t = 0; t <= niceMax + step * 1e-6; t += step) {
      ticks.push(Math.round(t * 100) / 100);
    }
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const pts = data.map((d, i) => ({
      x: PAD.left + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1)),
      y: PAD.top + innerH - (innerH * d.value) / niceMax,
      ...d,
    }));
    return { points: pts, yTicks: ticks, maxValue: niceMax };
  }, [data]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  // 선 아래를 베이스라인까지 채우는 영역 경로 (그라데이션으로 칠해서 빈 공간을 줄인다)
  const baselineY = HEIGHT - PAD.bottom;
  const areaPath = points.length > 0
      ? `M${points[0].x},${baselineY} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${baselineY} Z`
      : '';

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
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

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

          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}

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
                  r={i === hoverIndex ? 6 : 5}
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
              <strong>{format(hovered.value, hovered)}</strong>
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
                  <tr key={d.label}><td>{d.label}</td><td>{format(d.value, d)}</td></tr>
              ))}
              </tbody>
            </table>
        )}
      </div>
  );
}

export default LineChart;

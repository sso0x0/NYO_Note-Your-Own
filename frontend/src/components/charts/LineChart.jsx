import { useId, useMemo, useRef, useState } from 'react';
import ChartTableModal from './ChartTableModal';
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

// "YYYY-MM-DD" 형식이면 "MM-DD"만 남겨 x축 라벨 폭을 줄인다. 그 외 형식은 그대로 보여준다.
function formatXLabel(label) {
  if (typeof label === 'string' && /^\d{4}-\d{2}-\d{2}/.test(label)) {
    return label.slice(5, 10);
  }
  return label;
}

// 단일 시계열 라인 차트. 데이터가 하나뿐이라 범례는 두지 않고(차트 제목이 계열명을
// 대신함), 대신 크로스헤어 + 툴팁으로 정확한 값을 확인할 수 있게 했다.
// color: 이 차트에서 쓸 단일 색상(브랜드 accent 등) — 여러 계열 비교용이 아니므로 하나만 받는다.
// formatValue: 툴팁/표에 표시할 값을 커스텀 포맷팅하고 싶을 때 사용 (예: 그래프는 시간 단위로 그리되
// 정확한 값은 분 단위로 보여주고 싶은 경우). 기본은 그래프에 쓰는 값 그대로 표시.
function LineChart({ data, color, valueLabel = '값', formatValue }) {
  const format = formatValue ?? ((v) => v.toLocaleString());
  const [hoverIndex, setHoverIndex] = useState(null);
  // 툴팁은 SVG 밖의 일반 div라 뷰박스 좌표를 그대로 쓸 수 없어, 화면에 실제로 그려진
  // 픽셀 위치(svg 박스 기준)를 따로 들고 있다가 위치 지정에 사용한다.
  const [hoverPos, setHoverPos] = useState(null);
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

  // x축 라벨(날짜)이 너무 많으면 겹치므로, 최대 개수를 두고 처음/끝을 포함해 균등한 간격으로 골라 표시한다.
  const xTickIndices = useMemo(() => {
    const maxLabels = 7;
    if (points.length <= maxLabels) return points.map((_, i) => i);
    const step = (points.length - 1) / (maxLabels - 1);
    const indices = new Set();
    for (let i = 0; i < maxLabels; i += 1) {
      indices.add(Math.round(i * step));
    }
    return Array.from(indices).sort((a, b) => a - b);
  }, [points]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  // 선 아래를 베이스라인까지 채우는 영역 경로 (그라데이션으로 칠해서 빈 공간을 줄인다)
  const baselineY = HEIGHT - PAD.bottom;
  const areaPath = points.length > 0
      ? `M${points[0].x},${baselineY} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${baselineY} Z`
      : '';

  // svg는 viewBox 종횡비(WIDTH:HEIGHT)를 유지한 채(xMidYMid meet) 실제 박스에 맞춰지므로,
  // 박스가 더 넓거나 좁으면 축소 비율(scale)과 가운데 정렬 여백(offset)이 생긴다.
  // 화면 좌표 <-> 뷰박스 좌표를 서로 정확히 변환하려면 이 scale/offset을 함께 계산해야 한다.
  const getTransform = () => {
    const rect = svgRef.current.getBoundingClientRect();
    const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
    const offsetX = (rect.width - WIDTH * scale) / 2;
    const offsetY = (rect.height - HEIGHT * scale) / 2;
    return { rect, scale, offsetX, offsetY };
  };

  // 데이터 포인트를 호버 상태로 설정하고, 툴팁을 그 점의 실제 화면 픽셀 위치에 맞춘다.
  const setHoverAt = (index) => {
    const p = points[index];
    if (!svgRef.current || !p) return;
    const { scale, offsetX, offsetY } = getTransform();
    setHoverIndex(index);
    setHoverPos({ x: offsetX + p.x * scale, y: offsetY + p.y * scale });
  };

  const clearHover = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  // 마우스 x좌표에 가장 가까운 데이터 포인트를 찾아 호버 상태로 설정한다.
  // 좌표가 축 라벨 여백 등 패딩 영역(실제 그래프 사각형 바깥, letterbox 여백 포함)이면 반응하지 않는다.
  const handleMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const { rect, scale, offsetX, offsetY } = getTransform();
    const relX = (e.clientX - rect.left - offsetX) / scale;
    const relY = (e.clientY - rect.top - offsetY) / scale;
    if (relX < PAD.left || relX > WIDTH - PAD.right || relY < PAD.top || relY > HEIGHT - PAD.bottom) {
      clearHover();
      return;
    }
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < best) { best = dist; nearest = i; }
    });
    setHoverAt(nearest);
  };

  return (
      <div className="chart">
        <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="chart__svg"
            onMouseMove={handleMove}
            onMouseLeave={clearHover}
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

          {xTickIndices.map((i) => {
            const p = points[i];
            return (
                <text key={`x-${p.label}`} x={p.x} y={HEIGHT - PAD.bottom + 16} className="chart__axis-label" textAnchor="middle">
                  {formatXLabel(p.label)}
                </text>
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
                  onMouseEnter={() => setHoverAt(i)}
              />
          ))}
        </svg>

        {hovered && hoverPos && (
            <div
                className="chart__tooltip"
                style={{ left: `${hoverPos.x}px`, top: `${hoverPos.y}px` }}
            >
              <strong>{format(hovered.value, hovered)}</strong>
              <span>{hovered.label}</span>
            </div>
        )}

        <button type="button" className="chart__table-toggle" onClick={() => setShowTable(true)}>
          표로 보기
        </button>

        {showTable && (
            <ChartTableModal
                title={`날짜별 ${valueLabel}`}
                columns={['날짜', valueLabel]}
                rows={data.map((d) => [d.label, format(d.value, d)])}
                onClose={() => setShowTable(false)}
            />
        )}
      </div>
  );
}

export default LineChart;

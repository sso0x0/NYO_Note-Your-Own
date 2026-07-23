import { useState } from 'react'

const PRESET_COLORS = [
  '#000000', '#424242', '#757575', '#d32f2f', '#f57c00',
  '#fbc02d', '#388e3c', '#1976d2', '#7b1fa2', '#e91e63',
]

function TextColorPicker({ value, onChange, onApply }) {
  const [open, setOpen] = useState(false)
  const [draftColor, setDraftColor] = useState(value)

  const selectColor = (color) => {
    setDraftColor(color)
    onChange(color)
  }

  return (
    <div className="text-color-picker">
      <button type="button" className="text-color-picker-trigger" onClick={() => setOpen((prev) => !prev)}>
        <span className="text-color-sample" style={{ backgroundColor: draftColor }} aria-hidden="true" />
        글자색
      </button>

      {open && (
        // 커스텀 팔레트: 브라우저 기본 색상 창 대신 팔레트 판 내부에 적용 버튼을 제공합니다.
        <div className="text-color-palette" role="dialog" aria-label="글자색 선택">
          <div className="text-color-swatches">
            {PRESET_COLORS.map((color) => (
              <button
                type="button"
                className={color === draftColor ? 'text-color-swatch selected' : 'text-color-swatch'}
                style={{ backgroundColor: color }}
                aria-label={`${color} 선택`}
                key={color}
                onClick={() => selectColor(color)}
              />
            ))}
          </div>

          <label className="text-color-custom">
            직접 선택
            <input type="color" value={draftColor} onChange={(event) => selectColor(event.target.value)} />
          </label>

          <div className="text-color-palette-actions">
            {/* 색상 재적용 수정: 비동기 상태를 기다리지 않고 팔레트의 최신 색상을 직접 전달합니다. */}
            <button type="button" onClick={() => { onApply(draftColor); setOpen(false) }}>적용</button>
            <button type="button" onClick={() => setOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TextColorPicker

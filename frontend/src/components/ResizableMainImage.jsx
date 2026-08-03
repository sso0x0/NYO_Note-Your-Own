import { useRef } from 'react'

// 핸들을 좌우로 드래그해 메인 이미지 표시 너비를 조절하는 컴포넌트.
function ResizableMainImage({ src, alt, width, onWidthChange }) {
  const wrapperRef = useRef(null)
  const imageRef = useRef(null)

  // 핸들을 드래그하는 동안 포인터 이동량만큼 너비를 계산해 반영하고, 포인터를 떼면 리스너를 정리한다.
  const startResize = (event) => {
    event.preventDefault()
    const wrapper = wrapperRef.current
    const image = imageRef.current
    if (!wrapper || !image) return

    const startX = event.clientX
    const startWidth = wrapper.getBoundingClientRect().width
    const maximumWidth = Math.min(
      image.naturalWidth || 1200,
      wrapper.parentElement?.clientWidth || 1200,
      1200,
    )
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)

    const resize = (moveEvent) => {
      const nextWidth = Math.max(120, Math.min(startWidth + moveEvent.clientX - startX, maximumWidth))
      onWidthChange(Math.round(nextWidth))
    }
    const stop = () => {
      handle.removeEventListener('pointermove', resize)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }

    handle.addEventListener('pointermove', resize)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  return (
    <div ref={wrapperRef} className="main-image-resize-wrapper" style={{ width: `${width}px` }}>
      <img ref={imageRef} className="note-thumbnail" src={src} alt={alt} draggable={false} />
      {/* 이 버튼을 좌우로 드래그해 메인 이미지 크기를 변경합니다. */}
      <span
        className="main-image-resize-handle"
        role="slider"
        aria-label="메인 이미지 크기 조절"
        aria-valuemin="120"
        aria-valuemax="1200"
        aria-valuenow={width}
        onPointerDown={startResize}
      />
    </div>
  )
}

export default ResizableMainImage

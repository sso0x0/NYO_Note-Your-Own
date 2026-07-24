import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { parseTextColors } from '../utils/textColor'

const serializeNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? ''
  if (node.nodeName === 'BR') return '\n'
  if (node instanceof HTMLElement && node.dataset.contentImageSource) {
    const width = Number.parseInt(node.dataset.contentImageWidth || '', 10)
    return `\n![본문 이미지](${node.dataset.contentImageSource})${width ? `{width=${width}}` : ''}\n`
  }
  if (node.nodeName === 'IMG') {
    const source = node.dataset.contentImageSource || node.getAttribute('src') || ''
    return `\n![본문 이미지](${source})\n`
  }

  const content = Array.from(node.childNodes).map(serializeNode).join('')
  const color = node instanceof HTMLElement ? node.dataset.noteColor : null
  const wrappedContent = color ? `[color=${color}]${content}[/color]` : content

  return ['DIV', 'P'].includes(node.nodeName) ? `${wrappedContent}\n` : wrappedContent
}

const createResizableImage = (source, previewUrl, savedWidth) => {
  const wrapper = document.createElement('span')
  wrapper.className = 'editor-image-wrapper'
  wrapper.contentEditable = 'false'
  wrapper.dataset.contentImageSource = source

  const image = document.createElement('img')
  image.src = previewUrl
  image.className = 'editor-inline-image'
  image.alt = '본문 이미지'
  image.draggable = false
  wrapper.append(image)

  const handle = document.createElement('span')
  handle.className = 'editor-image-resize-handle'
  handle.title = '드래그하여 이미지 크기 조절'
  wrapper.append(handle)

  const applyWidth = (width) => {
    const editorWidth = wrapper.parentElement?.clientWidth || width
    const originalWidth = image.naturalWidth || width
    const maximumWidth = Math.min(originalWidth, editorWidth)
    const minimumWidth = Math.min(80, maximumWidth)
    const nextWidth = Math.max(minimumWidth, Math.min(width, maximumWidth))
    wrapper.style.width = `${nextWidth}px`
    wrapper.dataset.contentImageWidth = String(Math.round(nextWidth))
  }

  image.addEventListener('load', () => applyWidth(savedWidth || Math.min(image.naturalWidth, wrapper.parentElement?.clientWidth || image.naturalWidth)))
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = wrapper.getBoundingClientRect().width
    handle.setPointerCapture(event.pointerId)

    const resize = (moveEvent) => applyWidth(startWidth + moveEvent.clientX - startX)
    const stop = () => {
      handle.removeEventListener('pointermove', resize)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
      wrapper.dispatchEvent(new Event('input', { bubbles: true }))
    }
    handle.addEventListener('pointermove', resize)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  })

  return wrapper
}

const serializeEditor = (editor) => Array.from(editor.childNodes)
  .map(serializeNode)
  .join('')
  .replace(/\n$/, '')

const renderValue = (editor, value) => {
  editor.replaceChildren()
  const appendText = (text) => parseTextColors(text).forEach((part) => {
    if (!part.color) {
      editor.append(document.createTextNode(part.text))
      return
    }

    const span = document.createElement('span')
    span.dataset.noteColor = part.color
    span.style.color = part.color
    span.textContent = part.text
    editor.append(span)
  })

  // 저장된 본문 이미지 마크다운은 코드 대신 에디터 안의 실제 이미지로 렌더링한다.
  const imagePattern = /!\[본문 이미지\]\(([^)]+)\)(?:\{width=(\d+)\})?/g
  let lastIndex = 0
  let match = imagePattern.exec(value)
  while (match) {
    appendText(value.slice(lastIndex, match.index))
    editor.append(createResizableImage(match[1], match[1], Number.parseInt(match[2] || '', 10)))
    lastIndex = imagePattern.lastIndex
    match = imagePattern.exec(value)
  }
  appendText(value.slice(lastIndex))
}

const RichTextEditor = forwardRef(function RichTextEditor({ value, onChange }, ref) {
  const editorRef = useRef(null)
  const selectionRef = useRef(null)

  useEffect(() => {
    const editor = editorRef.current
    if (editor && serializeEditor(editor) !== value) renderValue(editor, value)
  }, [value])

  const rememberSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection?.rangeCount || selection.isCollapsed) return

    const range = selection.getRangeAt(0)
    if (!editor?.contains(range.startContainer) || !editor.contains(range.endContainer)) return

    // 역방향 드래그 수정: anchor/focus 방향과 무관한 정규화된 Range를 저장합니다.
    selectionRef.current = range.cloneRange()
  }

  const rememberSelectionAfterMouseUp = () => {
    // 브라우저가 뒤→앞 선택 범위를 확정한 다음 프레임에서 저장합니다.
    requestAnimationFrame(rememberSelection)
  }

  const emitChange = () => onChange(serializeEditor(editorRef.current))

  const preventDroppedContent = (event) => {
    // contentEditable의 기본 드롭 동작이 blob: 이미지 태그를 자동 생성하지 못하게 차단합니다.
    event.preventDefault()
  }

  useImperativeHandle(ref, () => ({
    insertImage(source, previewUrl) {
      const editor = editorRef.current
      if (!editor) return false

      // 현재 커서 위치에 미리보기 이미지를 넣되 저장 값에는 임시 식별자를 유지한다.
      const image = createResizableImage(source, previewUrl)

      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      if (range && editor.contains(range.startContainer)) {
        range.deleteContents()
        range.insertNode(image)
        range.setStartAfter(image)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editor.append(image)
      }
      editor.append(document.createElement('br'))
      emitChange()
      return true
    },
    insertCodeBlock(codeBlock) {
      const editor = editorRef.current
      if (!editor) return false

      // 에디터 전체를 다시 그리지 않고 현재 커서에 코드블록 문법만 넣어 이미지 미리보기를 유지합니다.
      const textNode = document.createTextNode(codeBlock)
      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      if (range && editor.contains(range.startContainer)) {
        range.deleteContents()
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editor.append(textNode)
      }
      emitChange()
      return true
    },
    applyColor(color) {
      const range = selectionRef.current
      if (!range || range.collapsed) return false

      // 작성자 색상 미리보기: 선택 영역을 실제 span으로 표시하고 저장할 때만 색상 코드로 변환합니다.
      const span = document.createElement('span')
      span.dataset.noteColor = color
      span.style.color = color
      span.append(range.extractContents())

      // 색상 재적용 수정: 기존 색상 span을 풀어 중첩 코드를 만들지 않고 새 색상 하나로 교체합니다.
      span.querySelectorAll('[data-note-color]').forEach((child) => child.replaceWith(...child.childNodes))
      range.insertNode(span)

      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.selectAllChildren(span)
      selectionRef.current = selection.getRangeAt(0).cloneRange()
      emitChange()
      return true
    },
  }))

  return (
    <div
      ref={editorRef}
      className="rich-text-editor"
      contentEditable
      role="textbox"
      aria-multiline="true"
      data-placeholder="노트 내용을 입력하세요."
      suppressContentEditableWarning
      onInput={emitChange}
      onMouseUp={rememberSelectionAfterMouseUp}
      onKeyUp={rememberSelection}
      onSelect={rememberSelection}
      onDragOver={preventDroppedContent}
      onDrop={preventDroppedContent}
    />
  )
})

export default RichTextEditor

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { parseTextColors } from '../utils/textColor'

// contentEditable DOM 노드 트리를 저장용 마크다운 유사 문자열로 직렬화한다.
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
  let wrappedContent = color ? `[color=${color}]${content}[/color]` : content
  if (node instanceof HTMLElement && node.dataset.noteBold) wrappedContent = `[bold]${wrappedContent}[/bold]`
  if (node instanceof HTMLElement && node.dataset.noteItalic) wrappedContent = `[italic]${wrappedContent}[/italic]`
  if (node instanceof HTMLElement && node.dataset.noteUnderline) wrappedContent = `[underline]${wrappedContent}[/underline]`

  return ['DIV', 'P'].includes(node.nodeName) ? `${wrappedContent}\n` : wrappedContent
}

// 드래그로 크기 조절 가능한 이미지 래퍼(이미지 + 리사이즈 핸들)를 만들어 에디터에 삽입한다.
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

  // 요청된 너비를 에디터/원본 이미지 크기 범위 안으로 제한해 래퍼와 저장용 데이터 속성에 반영한다.
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

// 에디터 DOM 전체를 직렬화해 저장용 문자열(value)로 만든다.
const serializeEditor = (editor) => Array.from(editor.childNodes)
  .map(serializeNode)
  .join('')
  .replace(/\n$/, '')

// 저장된 value 문자열을 파싱해 에디터 DOM(색상/서식 span, 이미지)을 다시 그린다.
const renderValue = (editor, value) => {
  editor.replaceChildren()
  // 텍스트를 색상/서식 조각으로 나눠 서식이 있으면 span으로, 없으면 텍스트 노드로 추가한다.
  const appendText = (text) => parseTextColors(text).forEach((part) => {
    if (!part.color && !part.bold && !part.italic && !part.underline) {
      editor.append(document.createTextNode(part.text))
      return
    }

    const span = document.createElement('span')
    if (part.color) {
      span.dataset.noteColor = part.color
      span.style.color = part.color
    }
    if (part.bold) {
      span.dataset.noteBold = 'true'
      span.style.fontWeight = '700'
    }
    if (part.italic) {
      span.dataset.noteItalic = 'true'
      span.style.fontStyle = 'italic'
    }
    if (part.underline) {
      span.dataset.noteUnderline = 'true'
      span.style.textDecoration = 'underline'
    }
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

// 노트 본문 작성용 서식(색상/굵게/기울임/밑줄) + 이미지 삽입을 지원하는 contentEditable 에디터.
// ref로 insertImage/insertCodeBlock/applyColor/applyTextStyle 명령을 노출해 외부 툴바에서 호출한다.
const RichTextEditor = forwardRef(function RichTextEditor({ value, onChange }, ref) {
  const editorRef = useRef(null)
  const selectionRef = useRef(null)

  // 외부에서 바뀐 value가 현재 에디터 내용과 다르면 에디터 DOM을 다시 그려 동기화한다.
  useEffect(() => {
    const editor = editorRef.current
    if (editor && serializeEditor(editor) !== value) renderValue(editor, value)
  }, [value])

  // 에디터 내부의 현재 선택 범위(커서 포함)를 기억해 나중에 이미지 삽입 등에 사용한다.
  const rememberSelection = () => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection?.rangeCount) return

    const range = selection.getRangeAt(0)
    if (!editor?.contains(range.startContainer) || !editor.contains(range.endContainer)) return

    // 드래그 선택 영역뿐 아니라 일반 텍스트 커서도 저장해 파일 선택 후 이미지 삽입 위치로 사용합니다.
    selectionRef.current = range.cloneRange()
  }

  // mouseup 시점에 선택 범위를 기억한다.
  const rememberSelectionAfterMouseUp = () => {
    // 브라우저가 뒤→앞 선택 범위를 확정한 다음 프레임에서 저장합니다.
    requestAnimationFrame(rememberSelection)
  }

  // 에디터 DOM을 직렬화해 상위 컴포넌트의 onChange로 전달한다.
  const emitChange = () => onChange(serializeEditor(editorRef.current))

  // 드롭 이벤트의 기본 동작을 막는다.
  const preventDroppedContent = (event) => {
    // contentEditable의 기본 드롭 동작이 blob: 이미지 태그를 자동 생성하지 못하게 차단합니다.
    event.preventDefault()
  }

  useImperativeHandle(ref, () => ({
    // 저장된 커서 위치(또는 현재 선택 영역)에 리사이즈 가능한 이미지를 삽입한다.
    insertImage(source, previewUrl) {
      const editor = editorRef.current
      if (!editor) return false

      // 현재 커서 위치에 미리보기 이미지를 넣되 저장 값에는 임시 식별자를 유지한다.
      const image = createResizableImage(source, previewUrl)

      const selection = window.getSelection()
      const liveRange = selection?.rangeCount ? selection.getRangeAt(0) : null
      // 파일 선택창을 열며 포커스를 잃었으면 에디터에서 마지막으로 기억한 커서 위치를 복원합니다.
      const range = liveRange && editor.contains(liveRange.startContainer)
        ? liveRange
        : selectionRef.current?.cloneRange()
      if (range && editor.contains(range.startContainer)) {
        range.deleteContents()
        range.insertNode(image)
        range.setStartAfter(image)
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
        selectionRef.current = range.cloneRange()
      } else {
        editor.append(image)
      }
      editor.append(document.createElement('br'))
      emitChange()
      return true
    },
    // 현재 커서 위치에 코드블록 텍스트를 그대로 삽입한다.
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
    // 선택 영역을 색상 span으로 감싸고, 중첩된 기존 색상 span은 풀어서 하나로 합친다.
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
    // 선택 영역에 굵게/기울임/밑줄 서식을 토글 적용한다(이미 적용돼 있으면 해제).
    applyTextStyle(styleName) {
      const range = selectionRef.current
      if (!range || range.collapsed || !['bold', 'italic', 'underline'].includes(styleName)) return false

      const editor = editorRef.current
      const dataAttribute = styleName === 'bold'
        ? 'data-note-bold'
        : styleName === 'italic'
          ? 'data-note-italic'
          : 'data-note-underline'
      const selector = `[${dataAttribute}]`
      const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement
      const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE
        ? range.endContainer
        : range.endContainer.parentElement
      const startWrapper = startElement?.closest?.(selector)
      const endWrapper = endElement?.closest?.(selector)

      if (startWrapper && startWrapper === endWrapper && editor?.contains(startWrapper)) {
        // 같은 서식이 적용된 선택 영역에서 버튼을 다시 누르면 감싼 span만 풀어 토글 해제합니다.
        const children = [...startWrapper.childNodes]
        startWrapper.replaceWith(...children)
        if (children.length > 0) {
          const selection = window.getSelection()
          const nextRange = document.createRange()
          nextRange.setStartBefore(children[0])
          nextRange.setEndAfter(children.at(-1))
          selection.removeAllRanges()
          selection.addRange(nextRange)
          selectionRef.current = nextRange.cloneRange()
        }
        emitChange()
        return true
      }

      const span = document.createElement('span')
      const dataKey = `note${styleName[0].toUpperCase()}${styleName.slice(1)}`
      span.dataset[dataKey] = 'true'
      if (styleName === 'bold') span.style.fontWeight = '700'
      if (styleName === 'italic') span.style.fontStyle = 'italic'
      if (styleName === 'underline') span.style.textDecoration = 'underline'
      span.append(range.extractContents())

      // 같은 서식을 다시 감싸 중첩 코드가 쌓이지 않도록 선택 영역 내부의 동일 서식은 합칩니다.
      span.querySelectorAll(selector)
        .forEach((child) => child.replaceWith(...child.childNodes))
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

export const wrapTextWithColor = (content, selectionStart, selectionEnd, color) => {
  const selectedText = content.slice(selectionStart, selectionEnd)
  const textToWrap = selectedText || '색상을 적용할 글자'
  const openingTag = `[color=${color}]`

  return {
    content: `${content.slice(0, selectionStart)}${openingTag}${textToWrap}[/color]${content.slice(selectionEnd)}`,
    selectionStart: selectionStart + openingTag.length,
    selectionEnd: selectionStart + openingTag.length + textToWrap.length,
  }
}

// 노트에 저장된 색상 문법을 일반 텍스트와 색상 조각으로 안전하게 분리합니다.
export const parseTextColors = (text) => {
  // 색상 코드 숨김 수정: 중첩된 색상 코드도 스택으로 해석해 코드 문자열이 화면에 노출되지 않게 합니다.
  const colorPattern = /\[color=(#[0-9a-fA-F]{6})\]|\[\/color\]/g
  const parts = []
  const colorStack = []
  let lastIndex = 0
  let match

  while ((match = colorPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const part = { text: text.slice(lastIndex, match.index), color: colorStack.at(-1) ?? null }
      const previous = parts.at(-1)
      if (previous?.color === part.color) previous.text += part.text
      else parts.push(part)
    }

    if (match[1]) colorStack.push(match[1])
    else colorStack.pop()
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const part = { text: text.slice(lastIndex), color: colorStack.at(-1) ?? null }
    const previous = parts.at(-1)
    if (previous?.color === part.color) previous.text += part.text
    else parts.push(part)
  }
  return parts
}

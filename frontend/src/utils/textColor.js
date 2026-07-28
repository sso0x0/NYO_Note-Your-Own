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
  // 색상과 볼드/이탤릭/밑줄 저장 문법을 스택으로 해석해 코드 문자열은 화면에 숨깁니다.
  const stylePattern = /\[color=(#[0-9a-fA-F]{6})\]|\[\/color\]|\[(\/?)(bold|italic|underline)\]/g
  const parts = []
  const colorStack = []
  const styleDepth = { bold: 0, italic: 0, underline: 0 }
  let lastIndex = 0
  let match

  const appendPart = (partText) => {
    if (!partText) return
    const part = {
      text: partText,
      color: colorStack.at(-1) ?? null,
      bold: styleDepth.bold > 0,
      italic: styleDepth.italic > 0,
      underline: styleDepth.underline > 0,
    }
    const previous = parts.at(-1)
    const sameStyle = previous
      && previous.color === part.color
      && previous.bold === part.bold
      && previous.italic === part.italic
      && previous.underline === part.underline
    if (sameStyle) previous.text += part.text
    else parts.push(part)
  }

  while ((match = stylePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendPart(text.slice(lastIndex, match.index))
    }

    if (match[1]) colorStack.push(match[1])
    else if (match[0] === '[/color]') colorStack.pop()
    else if (match[3]) {
      const style = match[3]
      styleDepth[style] = Math.max(0, styleDepth[style] + (match[2] ? -1 : 1))
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    appendPart(text.slice(lastIndex))
  }
  return parts
}

const MAIN_IMAGE_WIDTH_PATTERN = /#nyo-width=(\d+)$/

export const parseMainImage = (storedUrl) => {
  const url = String(storedUrl ?? '')
  const match = url.match(MAIN_IMAGE_WIDTH_PATTERN)

  return {
    url: url.replace(MAIN_IMAGE_WIDTH_PATTERN, ''),
    width: match ? Math.max(120, Math.min(Number(match[1]), 1200)) : 500,
  }
}

export const storeMainImageWidth = (url, width) => {
  const cleanUrl = parseMainImage(url).url
  if (!cleanUrl) return ''

  const safeWidth = Math.max(120, Math.min(Number(width) || 500, 1200))
  // DB 컬럼을 추가하지 않고 이미지 URL fragment에 표시 너비를 함께 저장합니다.
  return `${cleanUrl}#nyo-width=${safeWidth}`
}

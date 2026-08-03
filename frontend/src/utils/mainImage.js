// 메인(대표) 이미지 URL에 표시 너비를 함께 저장/복원하기 위한 유틸.
const MAIN_IMAGE_WIDTH_PATTERN = /#nyo-width=(\d+)$/

// 저장된 URL에서 표시 너비(#nyo-width=)를 분리해 순수 URL과 너비값으로 나눈다.
export const parseMainImage = (storedUrl) => {
  const url = String(storedUrl ?? '')
  const match = url.match(MAIN_IMAGE_WIDTH_PATTERN)

  return {
    url: url.replace(MAIN_IMAGE_WIDTH_PATTERN, ''),
    width: match ? Math.max(120, Math.min(Number(match[1]), 1200)) : 500,
  }
}

// 순수 이미지 URL에 표시 너비를 fragment로 붙여 저장용 문자열을 만든다.
export const storeMainImageWidth = (url, width) => {
  const cleanUrl = parseMainImage(url).url
  if (!cleanUrl) return ''

  const safeWidth = Math.max(120, Math.min(Number(width) || 500, 1200))
  // DB 컬럼을 추가하지 않고 이미지 URL fragment에 표시 너비를 함께 저장합니다.
  return `${cleanUrl}#nyo-width=${safeWidth}`
}

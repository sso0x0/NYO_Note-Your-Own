export const createPendingContentImage = (file) => ({
  token: `content-image-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file,
  previewUrl: URL.createObjectURL(file),
})

export const appendContentImageToken = (content, token) => `${content}\n![본문 이미지](${token})\n`

export const uploadPendingContentImages = async (content, pendingImages, uploadImage) => {
  let savedContent = content
  const contentImages = []

  for (let i = 0; i < pendingImages.length; i += 1) {
    const pendingImage = pendingImages[i]
    const uploadedImage = await uploadImage(pendingImage.file)

    // 본문 안의 임시 이미지 토큰을 실제 GCS URL로 바꾼 뒤 저장 요청에 사용한다.
    // 작성 화면에는 임시 토큰을 노출하지 않고, 저장 직전에 실제 이미지 URL 마크다운을 추가한다.
    const imageMarkdown = `\n![본문 이미지](${uploadedImage.imageUrl})\n`
    savedContent = savedContent.includes(pendingImage.token)
      ? savedContent.split(pendingImage.token).join(uploadedImage.imageUrl)
      : `${savedContent}${imageMarkdown}`
    contentImages.push({
      imageUrl: uploadedImage.imageUrl,
      originalName: uploadedImage.originalName,
      fileSize: uploadedImage.fileSize,
      displayOrder: i + 1,
    })
  }

  return { savedContent, contentImages }
}

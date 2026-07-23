import { useRef, useState } from 'react'
import { createPendingContentImage, uploadPendingContentImages } from '../../../utils/contentImages'
import TextColorPicker from '../components/TextColorPicker'
import RichTextEditor from '../../../components/RichTextEditor'
import { useAuth } from '../../../context/AuthContext'

const initialForm = {
  title: '테스트 노트',
  content: '노트 내용입니다.',
  thumbnailUrl: '',
}

function NoteCreate({ onBack, onCreated }) {
  const { auth } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [contentImageFiles, setContentImageFiles] = useState([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageInputKey, setImageInputKey] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [textColor, setTextColor] = useState('#d32f2f')
  const contentRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const uploadImage = async (file) => {
    // 이미지 파일은 JSON이 아니라 multipart/form-data로 백엔드에 보낸다.
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth?.accessToken}` },
      body: formData,
    })
    if (!response.ok) {
      // CORS/서버 오류가 일반 텍스트여도 JSON 파싱 오류로 덮어쓰지 않고 원인을 표시합니다.
      const errorText = await response.text()
      throw new Error(errorText || `HTTP ${response.status}`)
    }

    return response.json()
  }

  const handleImageChange = (event) => {
    // 파일 선택 시에는 GCS에 올리지 않고 화면 미리보기만 만든다.
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMessage('이미지는 저장 버튼을 누르면 업로드됩니다.')
  }

  const clearMainImage = () => {
    // 선택 취소 시 브라우저 미리보기 URL과 파일 입력값을 함께 초기화합니다.
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(null)
    setPreviewUrl('')
    setImageInputKey((key) => key + 1)
    setForm((prev) => ({ ...prev, thumbnailUrl: '' }))
  }

  const insertCodeBlock = () => {
    // 노트 본문에 마크다운 코드블럭 문법을 삽입해 코드 예시를 저장할 수 있게 한다.
    const codeBlock = '\n```java\n// 코드를 입력하세요\n```\n'
    setForm((prev) => ({
      ...prev,
      content: `${prev.content}${codeBlock}`,
    }))
  }

  const applyTextColor = (color) => {
    // 작성자 화면에서는 색상 코드 없이 실제 색으로 보이며 저장 데이터에만 코드가 포함됩니다.
    contentRef.current?.applyColor(color)
  }

  const handleContentImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const pendingImage = createPendingContentImage(file)
    setContentImageFiles((prev) => [...prev, pendingImage])
    // 파일 선택 즉시 현재 커서 위치에 실제 이미지 미리보기를 삽입한다.
    contentRef.current?.insertImage(pendingImage.token, pendingImage.previewUrl)
    event.target.value = ''
  }

  const createNote = async (event) => {
    event.preventDefault()
    // React가 버튼을 다시 그리기 전 발생할 수 있는 연속 제출도 함수 입구에서 차단합니다.
    if (loading) return
    setLoading(true)
    setMessage('노트를 저장하는 중입니다.')

    try {
      // 저장 버튼을 눌렀을 때만 GCS에 업로드하고, 받은 URL을 노트 저장 요청에 넣는다.
      const uploadedImage = imageFile ? await uploadImage(imageFile) : null
      const imageUrl = uploadedImage?.imageUrl ?? form.thumbnailUrl
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage)

      // 작성자는 JWT 로그인 사용자로 확정하고, 연결 강의는 서버가 DB에서 자동 선택한다.
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          content: uploadedContent.savedContent,
          thumbnailUrl: imageUrl || null,
          // 업로드 응답의 원본 파일명과 파일 크기를 DB 저장용으로 같이 보낸다.
          imageOriginalName: uploadedImage?.originalName ?? null,
          imageFileSize: uploadedImage?.fileSize ?? null,
          contentImages: uploadedContent.contentImages,
        }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok) {
        setMessage(`노트 저장 실패: HTTP ${response.status}`)
        return
      }

      onCreated(data.id)
    } catch (error) {
      setMessage(`노트 저장 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const imagePreview = previewUrl || form.thumbnailUrl

  return (
    <>
      <header className="note-header">
        <div>
          <h1>노트 작성</h1>
          <p>이미지를 선택한 뒤 저장하면 GCS에 업로드되고 DB에 URL이 저장됩니다.</p>
        </div>
        <button type="button" onClick={onBack}>목록</button>
      </header>

      <section className="note-write-panel">
        <form className="note-write-form" onSubmit={createNote}>
          <label>
            제목
            <input name="title" value={form.title} onChange={handleChange} />
          </label>

          <div className="note-content-field">
            <span className="note-field-label">메인 이미지</span>
            <input key={imageInputKey} type="file" accept="image/*" onChange={handleImageChange} disabled={loading} />
          </div>

          {imagePreview && (
            <div className="image-preview-box">
              <img className="note-thumbnail" src={imagePreview} alt="메인 이미지 미리보기" />
              {imageFile && <p className="image-preview-name">{imageFile.name}</p>}
              <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} placeholder="직접 이미지 URL을 넣을 수도 있습니다." />
              <button type="button" className="image-preview-remove" onClick={clearMainImage} disabled={loading}>이미지 선택 취소</button>
            </div>
          )}

          {/* 코드블록 오작동 수정: 버튼을 label 안에 두면 빈 영역 클릭도 버튼 클릭으로 전달될 수 있습니다. */}
          <div className="note-content-field">
            <span className="note-field-label">내용</span>
            <div className="note-editor-toolbar">
              <button type="button" onClick={insertCodeBlock}>
                코드블럭 삽입
              </button>
            </div>
            <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={loading} />
            {/* 커스텀 팔레트: 팔레트 판 안의 적용 버튼으로 선택한 글자색을 확정합니다. */}
            <TextColorPicker value={textColor} onChange={setTextColor} onApply={applyTextColor} />
            <RichTextEditor
              ref={contentRef}
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
            />
          </div>

          {/* 저장 요청 중에는 버튼을 비활성화해 이미지 및 게시물이 중복 저장되지 않게 합니다. */}
          <button type="submit" disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
        </form>
        {message && <p className="note-message">{message}</p>}
      </section>
    </>
  )
}

export default NoteCreate

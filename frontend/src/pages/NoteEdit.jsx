import { useEffect, useRef, useState } from 'react'
import { createPendingContentImage, uploadPendingContentImages } from '../utils/contentImages'
import TextColorPicker from '../components/TextColorPicker'
import RichTextEditor from '../components/RichTextEditor'
import { useAuth } from '../context/AuthContext'

function NoteEdit({ noteId, onBack, onSaved }) {
  const { auth } = useAuth()
  const [form, setForm] = useState({
    lectureId: '1',
    title: '',
    content: '',
    thumbnailUrl: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [contentImageFiles, setContentImageFiles] = useState([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('노트를 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [textColor, setTextColor] = useState('#d32f2f')
  const contentRef = useRef(null)

  useEffect(() => {
    const loadNote = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/notes/${noteId}`)
        const data = await response.json()

        if (!response.ok) {
          setMessage(`노트 조회 실패: HTTP ${response.status}`)
          return
        }

        setForm({
          lectureId: String(data.lectureId),
          title: data.title ?? '',
          content: data.content ?? '',
          thumbnailUrl: data.thumbnailUrl ?? '',
        })
        setMessage('저장하면 기존 제목과 내용이 note_histories 테이블에 저장됩니다.')
      } catch (error) {
        setMessage(`노트 조회 실패: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadNote()
  }, [noteId])

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

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMessage('이미지는 수정 저장 버튼을 누르면 업로드됩니다.')
  }

  const insertCodeBlock = () => {
    // 노트 수정 중에도 본문에 마크다운 코드블럭 문법을 추가할 수 있게 한다.
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

  const updateNote = async (event) => {
    event.preventDefault()
    // React가 버튼을 다시 그리기 전 발생할 수 있는 연속 제출도 함수 입구에서 차단합니다.
    if (loading) return
    setLoading(true)
    setMessage('노트를 수정하는 중입니다.')

    try {
      // 새 이미지가 있으면 저장 시점에만 GCS에 올리고, 없으면 기존 URL을 유지한다.
      const uploadedImage = imageFile ? await uploadImage(imageFile) : null
      const imageUrl = uploadedImage?.imageUrl ?? form.thumbnailUrl
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage)

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        // JWT 사용자와 실제 작성자가 같은지는 백엔드 서비스에서 최종 검증합니다.
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          lectureId: Number(form.lectureId),
          title: form.title,
          content: uploadedContent.savedContent,
          thumbnailUrl: imageUrl || null,
          // 새 이미지를 업로드한 경우 원본 파일명과 파일 크기를 DB 저장용으로 같이 보낸다.
          imageOriginalName: uploadedImage?.originalName ?? null,
          imageFileSize: uploadedImage?.fileSize ?? null,
          contentImages: uploadedContent.contentImages,
        }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok) {
        setMessage(`노트 수정 실패: HTTP ${response.status}`)
        return
      }

      onSaved(data.id)
    } catch (error) {
      setMessage(`노트 수정 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const imagePreview = previewUrl || form.thumbnailUrl

  return (
    <>
      <header className="note-header">
        <div>
          <h1>노트 수정</h1>
          <p>새 이미지를 선택한 뒤 수정 저장하면 GCS에 업로드되고 DB URL이 바뀝니다.</p>
        </div>
        <button type="button" onClick={onBack}>상세</button>
      </header>

      <section className="note-write-panel">
        <form className="note-write-form" onSubmit={updateNote}>
          <div className="note-field-row">
            <label>
              강의 ID
              <input name="lectureId" value={form.lectureId} onChange={handleChange} />
            </label>
          </div>

          <label>
            제목
            <input name="title" value={form.title} onChange={handleChange} />
          </label>

          <label>
            {/* 메인 이미지 명칭 변경: 게시판 제목 미리보기에 사용하는 대표 이미지입니다. */}
            메인 이미지
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading} />
          </label>

          {imagePreview && (
            <div className="image-preview-box">
              <img className="note-thumbnail" src={imagePreview} alt="메인 이미지 미리보기" />
              <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} placeholder="기존 이미지 URL" />
            </div>
          )}

          {/* 코드블록 오작동 수정: 본문 도구 영역은 입력 label과 분리합니다. */}
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

          {/* 수정 요청 중에는 버튼을 비활성화해 같은 변경이 중복 저장되지 않게 합니다. */}
          <button type="submit" disabled={loading}>{loading ? '저장 중...' : '수정 저장'}</button>
        </form>
        {message && <p className="note-message">{message}</p>}
      </section>
    </>
  )
}

export default NoteEdit

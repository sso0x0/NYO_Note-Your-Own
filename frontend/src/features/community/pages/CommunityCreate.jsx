import { useEffect, useRef, useState } from 'react'
import { createPendingContentImage, uploadPendingContentImages } from '../../../utils/contentImages'
import { useAuth } from '../../../context/AuthContext'
import RichTextEditor from '../../../components/RichTextEditor'

const initialForm = {
  title: '',
  content: '',
  thumbnailUrl: '',
  notice: false,
}

function CommunityCreate({ onBack, onCreated }) {
  const { auth } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [contentImageFiles, setContentImageFiles] = useState([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageInputKey, setImageInputKey] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [canCreateNotice, setCanCreateNotice] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const checkNoticePermission = async () => {
      if (!auth?.accessToken) {
        if (!cancelled) setCanCreateNotice(false)
        return
      }
      try {
        const response = await fetch('/api/posts/notice-permission', {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        })
        const allowed = response.ok && await response.json()
        if (!cancelled) setCanCreateNotice(allowed)
      } catch {
        if (!cancelled) setCanCreateNotice(false)
      }
    }
    checkNoticePermission()
    return () => { cancelled = true }
  }, [auth?.accessToken])

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
    const imageInfo = await response.json()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return imageInfo
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

  const createPost = async (event) => {
    event.preventDefault()
    // React가 버튼을 다시 그리기 전 발생할 수 있는 연속 제출도 함수 입구에서 차단합니다.
    if (loading) return
    if (!auth?.userId || !auth?.accessToken) {
      setMessage('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      return
    }
    setLoading(true)
    setMessage('게시글을 저장하는 중입니다.')

    try {
      // 저장 버튼을 눌렀을 때만 GCS에 업로드하고, 받은 URL을 게시글 저장 요청에 넣는다.
      const uploadedImage = imageFile ? await uploadImage(imageFile) : null
      const imageUrl = uploadedImage?.imageUrl ?? form.thumbnailUrl
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage)

      const response = await fetch('/api/posts', {
        method: 'POST',
        // JWT를 보내면 백엔드가 토큰의 사용자 ID를 게시글 작성자로 사용합니다.
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
          notice: canCreateNotice && form.notice,
        }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (response.status === 401) {
        setMessage('로그인이 만료되었습니다. 다시 로그인한 뒤 작성해 주세요.')
        return
      }

      if (!response.ok) {
        setMessage(`게시글 저장 실패: HTTP ${response.status}`)
        return
      }

      onCreated(data.id)
    } catch (error) {
      setMessage(`게시글 저장 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const imagePreview = previewUrl || form.thumbnailUrl

  return (
    <>
      <header className="note-header">
        <div>
          <h1>게시글 작성</h1>
          <p>이미지를 선택한 뒤 저장하면 GCS에 업로드되고 DB에 URL이 저장됩니다.</p>
        </div>
        <button type="button" onClick={onBack}>목록</button>
      </header>

      <section className="note-write-panel">
        <form className="note-write-form" onSubmit={createPost}>
          <label>
            제목
            <input name="title" value={form.title} onChange={handleChange} />
          </label>

          {canCreateNotice && (
            // 관리자 공지 작성: ADMIN 사용자에게만 공지 체크박스를 표시합니다.
            <label className="notice-checkbox">
              <input type="checkbox" name="notice" checked={form.notice} onChange={handleChange} />
              공지로 작성
            </label>
          )}

          {/* 파일 입력을 label 전체로 감싸지 않아 빈 영역 클릭 시 파일 선택창이 열리지 않게 합니다. */}
          <div className="note-content-field">
            <span className="note-field-label">메인 이미지</span>
            <input key={imageInputKey} type="file" accept="image/*" onChange={handleImageChange} disabled={loading} />
          </div>

          {imagePreview && (
            <div className="image-preview-box">
              <img className="note-thumbnail" src={imagePreview} alt="커뮤니티 메인 이미지 미리보기" />
              {imageFile && <p className="image-preview-name">{imageFile.name}</p>}
              <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} placeholder="직접 이미지 URL을 넣을 수도 있습니다." />
              <button type="button" className="image-preview-remove" onClick={clearMainImage} disabled={loading}>이미지 선택 취소</button>
            </div>
          )}

          {/* 본문 영역도 파일 입력과 분리해 에디터 주변 공백이 이미지 선택을 실행하지 않게 합니다. */}
          <div className="note-content-field">
            <span className="note-field-label">내용</span>
            <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={loading} />
            <RichTextEditor
              ref={contentRef}
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
            />
          </div>

          {/* 저장 요청 중에는 버튼을 비활성화해 이미지 및 게시글이 중복 저장되지 않게 합니다. */}
          <button type="submit" disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
        </form>
        {message && <p className="note-message">{message}</p>}
      </section>
    </>
  )
}

export default CommunityCreate

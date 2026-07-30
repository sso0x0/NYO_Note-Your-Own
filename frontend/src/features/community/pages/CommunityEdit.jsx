import { useEffect, useRef, useState } from 'react'
import {
  createPendingContentImage,
  findFirstContentImageUrl,
  uploadPendingContentImages,
} from '../../../utils/contentImages'
import { useAuth } from '../../../context/AuthContext'
import RichTextEditor from '../../../components/RichTextEditor'
import { storeMainImageWidth } from '../../../utils/mainImage'

function CommunityEdit({ postId, onBack, onSaved }) {
  const { auth } = useAuth()
  const [form, setForm] = useState({
    title: '',
    content: '',
    notice: false,
  })
  const [contentImageFiles, setContentImageFiles] = useState([])
  const [message, setMessage] = useState('게시글을 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [canCreateNotice, setCanCreateNotice] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
        })
        const data = await response.json()

        if (!response.ok) {
          setMessage(`게시글 조회 실패: HTTP ${response.status}`)
          return
        }

        setForm({
          title: data.title ?? '',
          content: data.content ?? '',
          notice: data.notice ?? false,
        })
        // 관리자 공지 수정: 작성자의 현재 ADMIN 권한을 확인해 공지 옵션을 노출합니다.
        const permissionResponse = await fetch('/api/posts/notice-permission', {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        })
        setCanCreateNotice(permissionResponse.ok && await permissionResponse.json())
        setMessage('')
      } catch (error) {
        setMessage(`게시글 조회 실패: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [postId, auth.accessToken])

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

  const updatePost = async (event) => {
    event.preventDefault()
    // React가 버튼을 다시 그리기 전 발생할 수 있는 연속 제출도 함수 입구에서 차단합니다.
    if (loading) return
    setLoading(true)
    setMessage('')

    try {
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage)
      // 수정 후에도 현재 본문에서 첫 번째로 등장하는 이미지를 자동 썸네일로 다시 지정한다.
      const firstImageUrl = findFirstContentImageUrl(uploadedContent.savedContent)
      const firstImageInfo = uploadedContent.contentImages.find((image) => image.imageUrl === firstImageUrl)

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        // JWT 사용자와 실제 작성자가 같은지는 백엔드 서비스에서 최종 검증합니다.
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          content: uploadedContent.savedContent,
          thumbnailUrl: firstImageUrl ? storeMainImageWidth(firstImageUrl, 500) : null,
          imageOriginalName: firstImageInfo?.originalName ?? null,
          imageFileSize: firstImageInfo?.fileSize ?? null,
          contentImages: uploadedContent.contentImages,
          notice: canCreateNotice ? form.notice : undefined,
        }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok) {
        setMessage(`게시글 수정 실패: HTTP ${response.status}`)
        return
      }

      onSaved(data.id)
    } catch (error) {
      setMessage(`게시글 수정 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="note-header">
        <div>
          <h1>게시글 수정</h1>
        </div>
        <button type="button" onClick={onBack}>상세</button>
      </header>

      <section className="note-write-panel">
        <form className="note-write-form" onSubmit={updatePost}>
          <label>
            제목
            <input name="title" value={form.title} onChange={handleChange} />
          </label>

          {canCreateNotice && (
            // 관리자 공지 수정: ADMIN만 공지 여부를 변경할 수 있습니다.
            <label className="notice-checkbox">
              <input type="checkbox" name="notice" checked={form.notice} onChange={handleChange} />
              공지로 설정
            </label>
          )}

          {/* 파일 입력과 편집기를 label 하나로 감싸면 편집기 클릭도 파일 선택 클릭으로 전달된다.
              일반 컨테이너로 분리해 실제 파일 입력을 눌렀을 때만 파일 선택 창이 열리게 한다. */}
          <div className="note-content-field">
            <span className="note-field-label">내용</span>
            <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={loading} />
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

export default CommunityEdit

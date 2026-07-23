import { useEffect, useRef, useState } from 'react'
import { createPendingContentImage, uploadPendingContentImages } from '../utils/contentImages'
import { useAuth } from '../context/AuthContext'
import RichTextEditor from '../components/RichTextEditor'

function CommunityEdit({ postId, onBack, onSaved }) {
  const { auth } = useAuth()
  const [form, setForm] = useState({
    title: '',
    content: '',
    thumbnailUrl: '',
    notice: false,
  })
  const [imageFile, setImageFile] = useState(null)
  const [contentImageFiles, setContentImageFiles] = useState([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('게시글을 불러오는 중입니다.')
  const [loading, setLoading] = useState(false)
  const [canCreateNotice, setCanCreateNotice] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/posts/${postId}`)
        const data = await response.json()

        if (!response.ok) {
          setMessage(`게시글 조회 실패: HTTP ${response.status}`)
          return
        }

        setForm({
          title: data.title ?? '',
          content: data.content ?? '',
          thumbnailUrl: data.thumbnailUrl ?? '',
          notice: data.notice ?? false,
        })
        // 관리자 공지 수정: 작성자의 현재 ADMIN 권한을 확인해 공지 옵션을 노출합니다.
        const permissionResponse = await fetch('/api/posts/notice-permission', {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        })
        setCanCreateNotice(permissionResponse.ok && await permissionResponse.json())
        setMessage('새 이미지를 선택하면 수정 저장 시 기존 GCS 이미지를 삭제하고 새 이미지로 교체합니다.')
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

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMessage('이미지는 수정 저장 버튼을 누르면 업로드됩니다.')
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
    setMessage('게시글을 수정하는 중입니다.')

    try {
      // 새 이미지가 있으면 저장 시점에만 GCS에 올리고, 없으면 기존 URL을 유지한다.
      const uploadedImage = imageFile ? await uploadImage(imageFile) : null
      const imageUrl = uploadedImage?.imageUrl ?? form.thumbnailUrl
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage)

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
          thumbnailUrl: imageUrl || null,
          // 새 이미지를 업로드한 경우 원본 파일명과 파일 크기를 DB 저장용으로 같이 보낸다.
          imageOriginalName: uploadedImage?.originalName ?? null,
          imageFileSize: uploadedImage?.fileSize ?? null,
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

  const imagePreview = previewUrl || form.thumbnailUrl

  return (
    <>
      <header className="note-header">
        <div>
          <h1>게시글 수정</h1>
          <p>새 이미지를 선택한 뒤 수정 저장하면 GCS 이미지와 DB URL이 교체됩니다.</p>
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

          <label>
            {/* 커뮤니티 메인 이미지 명칭 변경: 게시판 제목 미리보기에 사용하는 대표 이미지입니다. */}
            메인 이미지
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading} />
          </label>

          {imagePreview && (
            <div className="image-preview-box">
              <img className="note-thumbnail" src={imagePreview} alt="커뮤니티 메인 이미지 미리보기" />
              <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} placeholder="기존 이미지 URL" />
            </div>
          )}

          <label>
            내용
            <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={loading} />
            <RichTextEditor
              ref={contentRef}
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
            />
          </label>

          {/* 수정 요청 중에는 버튼을 비활성화해 같은 변경이 중복 저장되지 않게 합니다. */}
          <button type="submit" disabled={loading}>{loading ? '저장 중...' : '수정 저장'}</button>
        </form>
        {message && <p className="note-message">{message}</p>}
      </section>
    </>
  )
}

export default CommunityEdit

import { useEffect, useRef, useState } from 'react'
import {
  createPendingContentImage,
  findFirstContentImageUrl,
  uploadPendingContentImages,
} from '../../../utils/contentImages'
import { useAuth } from '../../../context/AuthContext'
import RichTextEditor from '../../../components/RichTextEditor'
import TextColorPicker from '../../note/components/TextColorPicker'
import { storeMainImageWidth } from '../../../utils/mainImage'
import './CommunityCreate.css'

// 게시글 수정 폼: 기존 게시글을 불러와 채운 뒤 수정 내용을 저장한다.
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
  const [textColor, setTextColor] = useState('#000000')
  const contentRef = useRef(null)

  // 기존 게시글 정보를 불러와 폼을 채우고, 공지 작성 권한도 함께 확인한다.
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

  // 입력 필드 값 변경을 폼 상태에 반영한다 (체크박스는 checked, 그 외는 value 사용).
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

  // 이미지 파일을 선택하면 임시 첨부 목록에 추가하고 에디터 커서 위치에 미리보기를 삽입한다.
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

  const applyTextStyle = (styleName) => {
    // 선택한 본문에 볼드 또는 밑줄을 적용하고, 이미 적용된 상태라면 해제한다.
    contentRef.current?.applyTextStyle(styleName)
  }

  const applyTextColor = (color) => {
    // 선택한 글자에 팔레트에서 고른 색상을 적용한다.
    contentRef.current?.applyColor(color)
  }

  // 본문 이미지를 업로드하고 수정 내용을 서버에 전송해 게시글을 갱신한다.
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
    <section className="community-write-page">
      <header className="community-write-page__header">
        <div>
          <span className="community-write-page__eyebrow">COMMUNITY</span>
          <h1>게시글 수정</h1>
          {/* 게시글 작성 페이지와 같은 뒤로가기 버튼 디자인을 맞춘다. */}
          <button type="button" className="community-write-page__back" onClick={onBack}>← 상세</button>
        </div>
      </header>

      <form className="community-write-page__form" onSubmit={updatePost}>
        <div className="community-write-page__titlebar">
          <input
            className="community-write-page__title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="제목을 입력하세요"
          />
          {canCreateNotice && (
            // 관리자 공지 수정: ADMIN만 공지 여부를 변경할 수 있습니다.
            <label className="community-write-page__notice">
              <input type="checkbox" name="notice" checked={form.notice} onChange={handleChange} />
              공지
            </label>
          )}
        </div>

        {message && <p className="community-write-page__message">{message}</p>}

        <div className="community-write-page__toolbar">
          <div className="community-write-page__toolbar-group">
            <label className="community-write-page__image-button" title="이미지 삽입">
              이미지
              <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={loading} hidden />
            </label>
            <button type="button" onClick={() => applyTextStyle('bold')} title="볼드"><strong>B</strong></button>
            <button type="button" onClick={() => applyTextStyle('underline')} title="밑줄"><u>U</u></button>
            <TextColorPicker value={textColor} onChange={setTextColor} onApply={applyTextColor} />
          </div>
        </div>

        <div className="community-write-page__editor">
          <RichTextEditor
            ref={contentRef}
            value={form.content}
            onChange={(content) => setForm((prev) => ({ ...prev, content }))}
          />
        </div>

        {/* 수정 요청 중에는 버튼을 비활성화해 같은 변경이 중복 저장되지 않게 합니다. */}
        <div className="community-write-page__actions">
          <button type="submit" className="community-write-page__submit" disabled={loading}>
            {loading ? '저장 중...' : '수정하기'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CommunityEdit

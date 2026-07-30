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

const initialForm = {
  title: '',
  content: '',
  notice: false,
}

function CommunityCreate({ onBack, onCreated }) {
  const { auth } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [contentImageFiles, setContentImageFiles] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [canCreateNotice, setCanCreateNotice] = useState(false)
  const [textColor, setTextColor] = useState('#000000')
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

  const createPost = async (event) => {
    event.preventDefault()
    // React가 버튼을 다시 그리기 전 발생할 수 있는 연속 제출도 함수 입구에서 차단합니다.
    if (loading) return
    if (!auth?.userId || !auth?.accessToken) {
      setMessage('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      return
    }
    setLoading(true)
    setMessage('')

    try {
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage)
      // 별도 메인 이미지 없이 본문에서 가장 먼저 등장하는 이미지를 자동 썸네일로 사용한다.
      const firstImageUrl = findFirstContentImageUrl(uploadedContent.savedContent)
      const firstImageInfo = uploadedContent.contentImages.find((image) => image.imageUrl === firstImageUrl)

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
          thumbnailUrl: firstImageUrl ? storeMainImageWidth(firstImageUrl, 500) : null,
          imageOriginalName: firstImageInfo?.originalName ?? null,
          imageFileSize: firstImageInfo?.fileSize ?? null,
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

  return (
    <section className="community-write-page">
      <header className="community-write-page__header">
        <div>
          <span className="community-write-page__eyebrow">COMMUNITY</span>
          <h1>게시글 작성</h1>
          {/* 게시글 상세의 목록 버튼과 문구까지 동일하게 맞춘다. */}
          <button type="button" className="community-write-page__back" onClick={onBack}>← 목록</button>
        </div>
      </header>

      <form className="community-write-page__form" onSubmit={createPost}>
        <div className="community-write-page__titlebar">
          <input
            className="community-write-page__title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="제목을 입력하세요"
          />
          {canCreateNotice && (
            // 관리자에게만 공지 작성 선택지를 표시한다.
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

        {/* 저장 버튼은 작성 내용을 확인한 뒤 누를 수 있도록 에디터 아래에 배치한다. */}
        <div className="community-write-page__actions">
          <button type="submit" className="community-write-page__submit" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CommunityCreate

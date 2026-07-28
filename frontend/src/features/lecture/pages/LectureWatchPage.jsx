import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLecture, isEnrolled as fetchIsEnrolled } from '../api/lecture';
import {
  getLectureComments,
  createLectureComment,
  updateLectureComment,
  deleteLectureComment,
} from '../api/lectureComment';
import { getNotesByLecture, createNote, updateNote } from '../../note/api/note';
import { getNoteTags, generateAiTags } from '../../note/api/tag';
import { sendMessage } from '../../chat/api/chat';
import { useAuth } from '../../../context/AuthContext';
import { createPendingContentImage, uploadPendingContentImages } from '../../../utils/contentImages';
import { getYoutubeVideoId, resolveLectureThumbnail } from '../../../utils/youtubeThumbnail';
import fallbackThumbnail from '../../../assets/images/null.png';
import RichTextEditor from '../../../components/RichTextEditor';
import TextColorPicker from '../../note/components/TextColorPicker';
import ChatMessage from '../../chat/ChatMessage';
import ChatInput from '../../chat/ChatInput';
import '../../chat/chat.css';
import './LectureWatchPage.css';

const emptyForm = { title: '', content: '' };
const QUESTION_LIST_PREVIEW_COUNT = 4;

// 질문 목록 아이콘. 다른 위젯 아이콘들과 톤을 맞춘 단색 아웃라인 SVG.
function QuestionListIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="4.5" cy="6" r="0.8" fill="currentColor" />
        <circle cx="4.5" cy="12" r="0.8" fill="currentColor" />
        <circle cx="4.5" cy="18" r="0.8" fill="currentColor" />
        <path d="M8.5 6h11M8.5 12h11M8.5 18h11" />
      </svg>
  );
}

const findFirstContentImageUrl = (content) => {
  const match = String(content ?? '').match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/);
  return match?.[1] ?? null;
};

// 유튜브 링크(watch/youtu.be/embed/shorts)에서 embed용 URL을 뽑아낸다. 유튜브가 아니면 null.
// TODO: 추후 영상을 자체 저장 방식으로 바꾸면 이 유튜브 재생 로직 전체를 다시 확인해야 한다.
function getYoutubeEmbedUrl(url) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function LectureCommentItem({ comment, auth, onReply, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = auth && String(comment.userId) === String(auth.userId);
  const canDelete = !comment.isDeleted && (isOwner || auth?.role === 'ADMIN');

  const saveEdit = async () => {
    const saved = await onUpdate(comment, editContent);
    if (saved) setEditing(false);
  };

  return (
    <li className="comment-item">
      <div className="comment-body">
        {editing ? (
          <div className="comment-edit-form">
            <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows="3" />
            <button type="button" onClick={saveEdit}>저장</button>
            <button type="button" onClick={() => setEditing(false)}>취소</button>
          </div>
        ) : <p>{comment.content}</p>}
        <span>작성자 {comment.authorNickname || '알 수 없는 사용자'}</span>
        {!comment.isDeleted && <button type="button" onClick={() => onReply(comment)}>답글</button>}
        {!comment.isDeleted && isOwner && !editing && <button type="button" onClick={() => setEditing(true)}>수정</button>}
        {canDelete && <button type="button" className="danger-button" onClick={() => onDelete(comment)}>삭제</button>}
      </div>

      {comment.replies?.length > 0 && (
        <ul className="comment-replies">
          {comment.replies.map((reply) => (
            <LectureCommentItem key={reply.id} comment={reply} auth={auth} onReply={onReply} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}

function LectureWatchPage() {
  const { id } = useParams();
  const lectureId = Number(id);
  const { auth } = useAuth();

  const [lecture, setLecture] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | locked
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [activeTab, setActiveTab] = useState('write'); // write | others
  const [notes, setNotes] = useState([]);
  const [myNote, setMyNote] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [contentImageFiles, setContentImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [textColor, setTextColor] = useState('#d32f2f');
  const contentRef = useRef(null);

  const [tags, setTags] = useState([]);
  const [tagGenerating, setTagGenerating] = useState(false);
  const [tagError, setTagError] = useState(null);

  const [chatDrawerOpen, setChatDrawerOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatBottomRef = useRef(null);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionListExpanded, setQuestionListExpanded] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({ content: '', parentCommentId: null });
  const [commentMessage, setCommentMessage] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);
    setIsPlaying(false);

    Promise.all([getLecture(id), fetchIsEnrolled(id)])
      .then(([data, enrolled]) => {
        if (cancelled) return;
        setLecture(data);
        // 수강신청을 하지 않았다면 정원이 찬 강의처럼 시청 화면 자체를 막는다.
        setStatus(enrolled ? 'success' : 'locked');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadNotes = useCallback(async () => {
    try {
      const list = await getNotesByLecture(id);
      setNotes(list ?? []);
      // 로그인 ID의 자료형이 달라도 같은 사용자의 기존 노트를 찾아 수정 모드로 유지합니다.
      const own = (list ?? []).find((note) => String(note.userId) === String(auth?.userId)) ?? null;
      setMyNote(own);
      setForm(own ? { title: own.title, content: own.content } : emptyForm);
      setContentImageFiles([]);
    } catch (err) {
      setSaveMessage(`노트를 불러오지 못했습니다: ${err.message}`);
    }
  }, [id, auth?.userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotes();
  }, [loadNotes]);

  const loadTags = useCallback(async (noteId) => {
    if (!noteId) {
      setTags([]);
      return;
    }
    try {
      const response = await getNoteTags(noteId);
      setTags(response ?? []);
    } catch (err) {
      setTagError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTagError(null);
    loadTags(myNote?.id);
  }, [myNote?.id, loadTags]);

  const handleGenerateTags = async () => {
    if (!myNote || tagGenerating) return;
    setTagGenerating(true);
    setTagError(null);
    try {
      await generateAiTags(myNote.id);
      await loadTags(myNote.id);
    } catch (err) {
      setTagError(err.message);
    } finally {
      setTagGenerating(false);
    }
  };

  // 대화는 서버(chat_histories)에 계속 저장되지만, 페이지를 나갔다 들어오거나
  // 다른 강의로 이동하면 화면에는 이전 대화를 다시 불러오지 않고 빈 상태로 시작한다.
  useEffect(() => {
    setChatMessages([]);
    setChatError(null);
    setShowQuestionList(false);
    setQuestionListExpanded(false);
  }, [lectureId]);

  // 서버(chat_histories)에서 지난 질문을 다시 불러오지 않고, 위 chatMessages와 똑같이
  // "이번에 페이지를 들어온 뒤로 물어본 것"만 걸러서 보여준다 (마이페이지 챗봇 기록과는 별개).
  const askedQuestions = chatMessages.filter((message) => message.senderRole === 'USER');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 질문 목록에서 항목을 누르면 대화창에서 그 질문이 있는 위치로 스크롤해서 보여주고, 팝오버는 닫는다.
  const scrollToQuestion = (questionId) => {
    setShowQuestionList(false);
    document.getElementById(`lecture-chat-message-${questionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const loadComments = useCallback(async () => {
    try {
      const list = await getLectureComments(lectureId);
      setComments(list ?? []);
    } catch (err) {
      setCommentMessage(`댓글을 불러오지 못했습니다: ${err.message}`);
    }
  }, [lectureId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const selectCommentReplyTarget = (comment) => {
    setCommentForm((prev) => ({ ...prev, parentCommentId: comment.id, content: '' }));
  };

  const cancelCommentReply = () => {
    setCommentForm((prev) => ({ ...prev, parentCommentId: null }));
  };

  const handleCreateComment = async (event) => {
    event.preventDefault();
    if (!commentForm.content.trim()) {
      setCommentMessage('댓글 내용을 입력해 주세요.');
      return;
    }

    setCommentSaving(true);
    try {
      await createLectureComment({
        lectureId,
        parentCommentId: commentForm.parentCommentId,
        content: commentForm.content,
      });
      setCommentForm({ content: '', parentCommentId: null });
      setCommentMessage('');
      await loadComments();
    } catch (err) {
      setCommentMessage(`댓글 저장 실패: ${err.message}`);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleUpdateComment = async (comment, content) => {
    if (!content.trim()) {
      setCommentMessage('댓글 내용을 입력해 주세요.');
      return false;
    }
    try {
      await updateLectureComment(comment.id, {
        lectureId,
        parentCommentId: comment.parentCommentId,
        content,
      });
      await loadComments();
      return true;
    } catch (err) {
      setCommentMessage(`댓글 수정 실패: ${err.message}`);
      return false;
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await deleteLectureComment(comment.id);
      await loadComments();
    } catch (err) {
      setCommentMessage(`댓글 삭제 실패: ${err.message}`);
    }
  };

  const insertCodeBlock = () => {
    const codeBlock = '\n```\n// 코드를 입력하세요\n```\n';
    contentRef.current?.insertCodeBlock(codeBlock);
  };

  const uploadImage = async (file) => {
    // 이미지 파일은 JSON이 아니라 multipart/form-data로 백엔드에 보낸다.
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth?.accessToken}` },
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const handleContentImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 선택 시에는 바로 업로드하지 않고 커서 위치에 미리보기만 넣는다. 실제 업로드는 저장할 때 처리한다.
    const pendingImage = createPendingContentImage(file);
    setContentImageFiles((prev) => [...prev, pendingImage]);
    contentRef.current?.insertImage(pendingImage.token, pendingImage.previewUrl);
    event.target.value = '';
  };

  const applyTextColor = (color) => {
    // 선택한 글자는 에디터에서 즉시 색으로 보이고 저장할 때 본문 색상 코드로 직렬화됩니다.
    contentRef.current?.applyColor(color);
  };

  const applyTextStyle = (styleName) => {
    contentRef.current?.applyTextStyle(styleName);
  };

  const handleSaveNote = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.title.trim()) {
      setSaveMessage('노트 제목을 입력해 주세요.');
      return;
    }
    if (!form.content.trim()) {
      setSaveMessage('노트 내용을 입력해 주세요.');
      return;
    }

    setSaving(true);
    setSaveMessage('노트를 저장하는 중입니다.');
    try {
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage);
      // 본문의 첫 번째 이미지를 게시판 대표 이미지로 자동 사용하고, 없으면 기본 이미지가 나오게 null로 저장합니다.
      const firstImageUrl = findFirstContentImageUrl(uploadedContent.savedContent);
      const firstUploadedImage = uploadedContent.contentImages
        .find((image) => image.imageUrl === firstImageUrl);

      let savedNote;
      if (myNote) {
        savedNote = await updateNote(myNote.id, {
          lectureId,
          title: form.title,
          content: uploadedContent.savedContent,
          thumbnailUrl: firstImageUrl,
          imageOriginalName: firstUploadedImage?.originalName ?? null,
          imageFileSize: firstUploadedImage?.fileSize ?? null,
          contentImages: uploadedContent.contentImages,
        });
      } else {
        savedNote = await createNote({
          lectureId,
          title: form.title,
          content: uploadedContent.savedContent,
          thumbnailUrl: firstImageUrl,
          imageOriginalName: firstUploadedImage?.originalName ?? null,
          imageFileSize: firstUploadedImage?.fileSize ?? null,
          contentImages: uploadedContent.contentImages,
        });
      }
      // 저장 직후에도 같은 폼을 수정 모드로 유지해 다음 저장부터 기존 노트를 계속 갱신합니다.
      setMyNote(savedNote);
      setForm({
        title: savedNote.title,
        content: savedNote.content,
      });
      setContentImageFiles([]);
      setSaveMessage('노트를 저장했습니다.');
      await loadNotes();
    } catch (err) {
      setSaveMessage(`노트 저장 실패: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChatSend = async (message) => {
    setChatError(null);
    setChatSending(true);
    setChatMessages((prev) => [...prev, { id: `pending-${Date.now()}`, senderRole: 'USER', message }]);

    try {
      const answer = await sendMessage({ lectureId, message });
      setChatMessages((prev) => [...prev, answer]);
    } catch (err) {
      setChatError(err.message);
    } finally {
      setChatSending(false);
    }
  };

  // 다른 학습자 노트는 좋아요가 많은 순서로, 좋아요가 같으면 최신 작성 순서로 보여줍니다.
  const othersNotes = notes
    .filter((note) => String(note.userId) !== String(auth?.userId))
    .sort((first, second) => {
      const likeDifference = (second.likeCount ?? 0) - (first.likeCount ?? 0);
      if (likeDifference !== 0) return likeDifference;
      return new Date(second.createdAt ?? 0) - new Date(first.createdAt ?? 0);
    });
  const youtubeEmbedUrl = getYoutubeEmbedUrl(lecture?.lectureUrl);

  return (
    <section className="lecture-watch-page">
      <Link to={`/main/lectures/${id}`} className="lecture-watch-page__back">
        ← 강의 상세로
      </Link>

      {status === 'loading' && <p>불러오는 중...</p>}
      {status === 'error' && <p role="alert">강의를 불러오지 못했습니다: {error}</p>}

      {status === 'locked' && (
        <div className="lecture-watch-page__locked">
          <p>정원이 마감되었거나 수강신청을 하지 않은 강의입니다.</p>
          <Link to={`/main/lectures/${id}`}>강의 상세에서 수강신청하기</Link>
        </div>
      )}

      {status === 'success' && lecture && (
        <div className="lecture-watch-page__layout">
          <div className="lecture-watch-page__main">
            <div className="lecture-watch-page__top">
              <div className="lecture-watch-page__pip">
                {isPlaying && youtubeEmbedUrl ? (
                  <iframe
                    className="lecture-watch-page__player"
                    src={`${youtubeEmbedUrl}?autoplay=1`}
                    title={lecture.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img
                      src={resolveLectureThumbnail(lecture) ?? fallbackThumbnail}
                      alt={lecture.title}
                      onError={(event) => {
                        event.currentTarget.src = fallbackThumbnail;
                      }}
                    />

                    {youtubeEmbedUrl ? (
                      <button
                        type="button"
                        className="lecture-watch-page__play"
                        aria-label="강의 영상 재생"
                        onClick={() => setIsPlaying(true)}
                      >
                        <span className="lecture-watch-page__play-icon" />
                      </button>
                    ) : (
                      <a
                        className="lecture-watch-page__play"
                        href={lecture.lectureUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="강의 영상 재생"
                      >
                        <span className="lecture-watch-page__play-icon" />
                      </a>
                    )}
                  </>
                )}
              </div>

              <div className="lecture-watch-page__top-info">
                {lecture.categoryName && (
                  <span className="lecture-watch-page__category">{lecture.categoryName}</span>
                )}
                <h1 className="lecture-watch-page__title">{lecture.title}</h1>
                <div className="lecture-watch-page__top-meta">
                  {lecture.lectureUrl && (
                    <a
                      className="lecture-watch-page__link"
                      href={lecture.lectureUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      인프런에서 수강하기 ↗
                    </a>
                  )}
                  <div className="lecture-watch-page__stats">
                    <span>♡ 좋아요 {lecture.likeCount ?? 0}</span>
                    <span>조회 {lecture.viewCount ?? 0}</span>
                    <span>노트 {notes.length}개</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lecture-watch-page__tabs">
              <button
                type="button"
                className={activeTab === 'write' ? 'is-active' : ''}
                onClick={() => setActiveTab('write')}
              >
                노트 작성
              </button>
              <button
                type="button"
                className={activeTab === 'others' ? 'is-active' : ''}
                onClick={() => setActiveTab('others')}
              >
                다른 학습자 노트
              </button>
              <button
                type="button"
                className={activeTab === 'comments' ? 'is-active' : ''}
                onClick={() => setActiveTab('comments')}
              >
                댓글
              </button>
            </div>

            {activeTab === 'write' && (
              <form className="lecture-watch-page__note-form" onSubmit={handleSaveNote}>
                <div className="lecture-watch-page__note-titlebar">
                  <input
                    className="lecture-watch-page__note-title"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="제목을 입력하세요"
                  />
                  <button type="submit" className="lecture-watch-page__note-submit" disabled={saving}>
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
                {saveMessage && <p className="lecture-watch-page__note-message">{saveMessage}</p>}

                <div className="lecture-watch-page__note-toolbar">
                  <div className="lecture-watch-page__note-toolbar-group">
                    <label className="lecture-watch-page__image-btn" title="이미지 삽입">
                      이미지
                      <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={saving} hidden />
                    </label>
                    <button type="button" onClick={insertCodeBlock} title="코드블럭 삽입">{'</>'}</button>
                    <button type="button" onClick={() => applyTextStyle('bold')} title="볼드"><strong>B</strong></button>
                    <button type="button" onClick={() => applyTextStyle('underline')} title="밑줄"><u>U</u></button>
                    {/* 노트 상세 작성기와 같은 팔레트로 선택한 글자색을 적용합니다. */}
                    <TextColorPicker value={textColor} onChange={setTextColor} onApply={applyTextColor} />
                  </div>
                </div>

                <div className="lecture-watch-page__note-editor">
                  <RichTextEditor
                    ref={contentRef}
                    value={form.content}
                    onChange={(content) => setForm((prev) => ({ ...prev, content }))}
                  />
                </div>

                <div className="lecture-watch-page__note-tags">
                  <span className="lecture-watch-page__note-tags-label">AI 추천 태그</span>
                  <div className="note-tags">
                    {tags.map((tag) => (
                      <span key={tag.tagId} className="note-tag-chip">
                        {tag.isAiGenerated && <span className="note-tag-chip__ai">AI</span>}
                        {tag.tagName}
                      </span>
                    ))}
                    {myNote ? (
                      <button
                        type="button"
                        className="note-tag-generate"
                        onClick={handleGenerateTags}
                        disabled={tagGenerating}
                      >
                        {tagGenerating ? 'AI 태그 생성 중...' : (tags.length > 0 ? 'AI 태그 다시 생성' : 'AI 태그 생성')}
                      </button>
                    ) : (
                      <span className="lecture-watch-page__note-tags-hint">노트를 먼저 저장하면 AI가 태그를 추천해줘요.</span>
                    )}
                  </div>
                  {tagError && <p className="note-tag-error">{tagError}</p>}
                </div>
              </form>
            )}

            {activeTab === 'others' && (
              <div className="lecture-watch-page__others">
                {othersNotes.length === 0 && <p>아직 다른 학습자의 노트가 없습니다.</p>}
                {othersNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/main/notes/${note.id}`}
                    className="lecture-watch-page__other-note"
                  >
                    <strong>{note.title}</strong>
                    <span className="lecture-watch-page__other-note-author">{note.authorNickname}</span>
                    <span className="lecture-watch-page__other-note-meta">
                      ♡ {note.likeCount ?? 0} · 조회 {note.viewCount ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <section className="comment-panel">
                <h2>댓글</h2>
                <form className="comment-form" onSubmit={handleCreateComment}>
                  {commentForm.parentCommentId && (
                    <div className="reply-target">
                      답글 작성 중
                      <button type="button" onClick={cancelCommentReply}>취소</button>
                    </div>
                  )}
                  <textarea
                    rows="4"
                    value={commentForm.content}
                    onChange={(event) => setCommentForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="댓글 내용"
                  />
                  <button type="submit" disabled={commentSaving}>댓글 등록</button>
                </form>
                {commentMessage && <p className="lecture-watch-page__note-message">{commentMessage}</p>}

                <ul className="comment-list">
                  {comments.map((comment) => (
                    <LectureCommentItem
                      key={comment.id}
                      comment={comment}
                      auth={auth}
                      onReply={selectCommentReplyTarget}
                      onUpdate={handleUpdateComment}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className={`lecture-watch-page__chat${chatDrawerOpen ? '' : ' is-collapsed'}`}>
            {chatDrawerOpen ? (
              <>
                <div className="lecture-watch-page__chat-header">
                  <span className="lecture-watch-page__chat-badge">AI</span>
                  <span className="lecture-watch-page__chat-title">학습용 챗봇</span>
                  <button
                      type="button"
                      className="lecture-watch-page__question-list-toggle"
                      onClick={() => setShowQuestionList((v) => !v)}
                      aria-label={showQuestionList ? '질문 목록 닫기' : '질문 목록 보기'}
                  >
                    <QuestionListIcon />
                  </button>
                  <button
                    type="button"
                    className="lecture-watch-page__chat-collapse"
                    onClick={() => setChatDrawerOpen(false)}
                  >
                    접기 ›
                  </button>
                  {showQuestionList && (
                      <div className="lecture-watch-page__question-list-popover">
                        <ul className="lecture-watch-page__chat-history-list">
                          {askedQuestions.length === 0 && (
                              <li className="lecture-watch-page__chat-history-empty">아직 물어본 질문이 없습니다.</li>
                          )}
                          {(questionListExpanded ? askedQuestions : askedQuestions.slice(0, QUESTION_LIST_PREVIEW_COUNT)).map((question) => (
                              <li key={question.id}>
                                <button
                                    type="button"
                                    className="lecture-watch-page__chat-history-item"
                                    onClick={() => scrollToQuestion(question.id)}
                                >
                                  {question.createdAt && (
                                      <span className="lecture-watch-page__chat-history-date">
                                  {question.createdAt.replace('T', ' ').slice(0, 16)}
                                </span>
                                  )}
                                  <span className="lecture-watch-page__chat-history-text">{question.message}</span>
                                </button>
                              </li>
                          ))}
                        </ul>
                        {askedQuestions.length > QUESTION_LIST_PREVIEW_COUNT && (
                            <button
                                type="button"
                                className="lecture-watch-page__chat-history-more"
                                onClick={() => setQuestionListExpanded((v) => !v)}
                            >
                              {questionListExpanded ? '접기' : `더보기 (${askedQuestions.length - QUESTION_LIST_PREVIEW_COUNT})`}
                            </button>
                        )}
                      </div>
                  )}
                </div>
                <div className="chat-messages">
                  {chatMessages.map((message) => (
                    <div key={message.id} id={`lecture-chat-message-${message.id}`}>
                      <ChatMessage senderRole={message.senderRole} message={message.message} />
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                {chatError && <p className="chat-error">{chatError}</p>}
                <ChatInput sending={chatSending} onSend={handleChatSend} />
              </>
            ) : (
              <button
                type="button"
                className="lecture-watch-page__chat-expand"
                onClick={() => setChatDrawerOpen(true)}
              >
                ‹ AI 챗봇
              </button>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

export default LectureWatchPage;

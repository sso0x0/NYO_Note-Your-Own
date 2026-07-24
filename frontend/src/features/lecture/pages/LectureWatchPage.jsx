import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLecture, isEnrolled as fetchIsEnrolled } from '../api/lecture';
import { getNotesByLecture, createNote, updateNote } from '../../note/api/note';
import { getHistories, sendMessage } from '../../chat/api/chat';
import { useAuth } from '../../../context/AuthContext';
import { createPendingContentImage, uploadPendingContentImages } from '../../../utils/contentImages';
import { getYoutubeVideoId, resolveLectureThumbnail } from '../../../utils/youtubeThumbnail';
import fallbackThumbnail from '../../../assets/images/null.png';
import RichTextEditor from '../../../components/RichTextEditor';
import ChatMessage from '../../chat/ChatMessage';
import ChatInput from '../../chat/ChatInput';
import '../../chat/chat.css';
import './LectureWatchPage.css';

const emptyForm = { title: '', content: '' };

// 유튜브 링크(watch/youtu.be/embed/shorts)에서 embed용 URL을 뽑아낸다. 유튜브가 아니면 null.
// TODO: 추후 영상을 자체 저장 방식으로 바꾸면 이 유튜브 재생 로직 전체를 다시 확인해야 한다.
function getYoutubeEmbedUrl(url) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
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
  const contentRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
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
      const own = (list ?? []).find((note) => note.userId === auth?.userId) ?? null;
      setMyNote(own);
      setForm(own ? { title: own.title, content: own.content } : emptyForm);
      setContentImageFiles([]);
    } catch (err) {
      setSaveMessage(`노트를 불러오지 못했습니다: ${err.message}`);
    }
  }, [id, auth?.userId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    let cancelled = false;
    getHistories({ lectureId })
      .then((res) => {
        if (!cancelled) setChatMessages([...res.content].reverse());
      })
      .catch((err) => {
        if (!cancelled) setChatError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [lectureId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const insertCodeBlock = () => {
    const codeBlock = '\n```\n// 코드를 입력하세요\n```\n';
    setForm((prev) => ({ ...prev, content: `${prev.content}${codeBlock}` }));
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

  const handleSaveNote = async (event) => {
    event.preventDefault();
    if (saving || !form.title.trim() || !form.content.trim()) return;

    setSaving(true);
    setSaveMessage('노트를 저장하는 중입니다.');
    try {
      const uploadedContent = await uploadPendingContentImages(form.content, contentImageFiles, uploadImage);

      if (myNote) {
        // thumbnailUrl을 함께 보내지 않으면 서버가 기존 썸네일을 null로 덮어쓰므로 그대로 유지해서 보낸다.
        await updateNote(myNote.id, {
          lectureId,
          title: form.title,
          content: uploadedContent.savedContent,
          thumbnailUrl: myNote.thumbnailUrl ?? null,
          contentImages: uploadedContent.contentImages,
        });
      } else {
        await createNote({
          lectureId,
          title: form.title,
          content: uploadedContent.savedContent,
          contentImages: uploadedContent.contentImages,
        });
      }
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

  const othersNotes = notes.filter((note) => note.userId !== auth?.userId);
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
            <div className="lecture-watch-page__hero">
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

                  <div className="lecture-watch-page__hero-overlay">
                    <div>
                      {lecture.categoryName && (
                        <span className="lecture-watch-page__category">{lecture.categoryName}</span>
                      )}
                      <h1 className="lecture-watch-page__title">{lecture.title}</h1>
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
                    </div>
                    <div className="lecture-watch-page__stats">
                      <span>좋아요 {lecture.likeCount ?? 0}</span>
                      <span>조회 {lecture.viewCount ?? 0}</span>
                      <span>노트 {notes.length}개</span>
                    </div>
                  </div>
                </>
              )}
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
            </div>

            {activeTab === 'write' && (
              <form className="lecture-watch-page__note-form" onSubmit={handleSaveNote}>
                <input
                  className="lecture-watch-page__note-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="노트 제목을 입력하세요"
                />
                <div className="lecture-watch-page__note-toolbar">
                  <div className="lecture-watch-page__note-toolbar-group">
                    <label className="lecture-watch-page__image-btn">
                      이미지 삽입
                      <input type="file" accept="image/*" onChange={handleContentImageChange} disabled={saving} hidden />
                    </label>
                    <button type="button" onClick={insertCodeBlock}>코드블럭 삽입</button>
                  </div>
                  <button type="submit" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
                </div>
                <RichTextEditor
                  ref={contentRef}
                  value={form.content}
                  onChange={(content) => setForm((prev) => ({ ...prev, content }))}
                />
                {saveMessage && <p className="lecture-watch-page__note-message">{saveMessage}</p>}
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
          </div>

          <aside className="lecture-watch-page__chat">
            <div className="lecture-watch-page__chat-header">학습 챗봇</div>
            <div className="chat-messages">
              {chatMessages.map((message) => (
                <ChatMessage key={message.id} senderRole={message.senderRole} message={message.message} />
              ))}
              <div ref={chatBottomRef} />
            </div>
            {chatError && <p className="chat-error">{chatError}</p>}
            <ChatInput sending={chatSending} onSend={handleChatSend} />
          </aside>
        </div>
      )}
    </section>
  );
}

export default LectureWatchPage;

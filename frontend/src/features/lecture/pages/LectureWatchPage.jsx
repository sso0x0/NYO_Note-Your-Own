import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    getLecture,
    increaseLectureViewCount,
    isEnrolled as fetchIsEnrolled,
    isLectureLiked,
    likeLecture,
    unlikeLecture,
} from '../api/lecture';
import {
    getLectureComments,
    createLectureComment,
    updateLectureComment,
    deleteLectureComment,
} from '../api/lectureComment';
import { getNotesByLecture, createNote, updateNote } from '../../note/api/note';
import { addNoteTag, deleteNoteTag, getNoteTags, generateAiTags } from '../../note/api/tag';
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
// 실험: 뽀모도로를 전역 플로팅 위젯 대신 강의 시청 페이지에 직접 임베드해본다
// (학습용 챗봇 바로 위). WidgetDock에서는 PomodoroWidget을 뺐다.
import Timer from '../../pomodoro/Timer';
import StatsAndHistory from '../../pomodoro/StatsAndHistory';
import NoteCard from '../../note/components/NoteCard';
import '../../pomodoro/pomodoro.css';
import './LectureWatchPage.css';

const emptyForm = { title: '', content: '' };
const QUESTION_LIST_PREVIEW_COUNT = 4;
const OTHER_NOTES_PER_PAGE = 5;
const EMPTY_HEART_IMAGE = '/images/heart.png';
const FILLED_HEART_IMAGE = '/images/hearts.png';

// 현재 페이지를 중심으로 최대 5개의 페이지 번호만 보여준다.
const getPageNumbers = (current, totalPages) => {
    const pageWindow = 5;
    if (totalPages <= pageWindow) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    let start = Math.max(1, current - Math.floor(pageWindow / 2));
    let end = start + pageWindow - 1;
    if (end > totalPages) {
        end = totalPages;
        start = end - pageWindow + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

// 타이머 헤더의 배지 아이콘. 학습용 챗봇 헤더의 "AI" 배지와 시각적 무게를 맞추기 위한
// 단색 아웃라인 시계 아이콘 (뽀모도로 링과 같은 라벤더 톤으로 색을 입힌다).
function ClockBadgeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </svg>
    );
}

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

// 노트 본문(마크다운 이미지 문법)에서 가장 먼저 나오는 이미지 URL을 뽑아낸다.
const findFirstContentImageUrl = (content) => {
    const match = String(content ?? '').match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/);
    return match?.[1] ?? null;
};

// 유튜브 링크(watch/youtu.be/embed/shorts)에서 embed용 URL을 뽑아낸다. 유튜브가 아니면 null.
function getYoutubeEmbedUrl(url) {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

// 댓글 작성 시각을 "YYYY.MM.DD HH:mm" 형태의 한국어 로케일 문자열로 바꾼다.
const formatCommentDate = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

// 삭제되지 않은 댓글 수를 답글까지 재귀적으로 모두 센다.
const countLectureComments = (items) => items.reduce(
    (total, comment) => total
        + (comment.isDeleted ? 0 : 1)
        + (comment.replies?.length ? countLectureComments(comment.replies) : 0),
    0,
);

// 댓글 입력창의 높이를 입력 내용(scrollHeight)에 맞춰 자동으로 늘려준다.
const autoGrowCommentTextarea = (element) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
};

// 강의 댓글 하나(및 답글 목록)를 렌더링한다. 답글 달기/수정/삭제 버튼과 인라인 수정 폼을 포함한다.
function LectureCommentItem({ comment, auth, onReply, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const isOwner = auth && String(comment.userId) === String(auth.userId);
    const canDelete = !comment.isDeleted && (isOwner || auth?.role === 'ADMIN');
    const isEdited = !comment.isDeleted && comment.createdAt && comment.updatedAt
        && comment.createdAt !== comment.updatedAt;
    const isWithdrawnAuthor = comment.authorNickname === '탈퇴한 사용자';

    // 수정한 댓글 내용을 저장하고, 성공하면 수정 모드를 닫는다.
    const saveEdit = async () => {
        const saved = await onUpdate(comment, editContent);
        if (saved) setEditing(false);
    };

    return (
        <li className={`comment-item${comment.isDeleted ? ' comment-item--deleted' : ''}${isWithdrawnAuthor ? ' comment-item--withdrawn' : ''}`}>
            <div className="comment-item__avatar" aria-hidden="true">
                {(comment.authorNickname || '?').charAt(0)}
            </div>
            <div className="comment-body">
                <div className="comment-body__main">
                    <div className="comment-body__header">
                        <span className="comment-body__author">{comment.authorNickname || '알 수 없는 사용자'}</span>
                        {!comment.isDeleted && (
                            <time className="comment-body__date" dateTime={comment.createdAt}>
                                {formatCommentDate(comment.createdAt)}
                            </time>
                        )}
                        {isEdited && <span className="comment-body__edited">(수정됨)</span>}
                    </div>
                    {editing ? (
                        <div className="comment-edit-form">
                            <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows="3" />
                            <button type="button" onClick={saveEdit}>저장</button>
                            <button type="button" onClick={() => setEditing(false)}>취소</button>
                        </div>
                    ) : <p className={comment.isDeleted ? 'comment-body__deleted-text' : undefined}>{comment.content}</p>}
                </div>
                <div className="comment-body__actions">
                    {!comment.isDeleted && <button type="button" className="comment-reply-button" onClick={() => onReply(comment)}>답글</button>}
                    {!comment.isDeleted && isOwner && !editing && <button type="button" onClick={() => setEditing(true)}>수정</button>}
                    {canDelete && <button type="button" className="danger-button" onClick={() => onDelete(comment)}>삭제</button>}
                </div>
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

// 강의 시청 페이지: 영상 재생, 노트 작성/AI 태그, 다른 학습자 노트·댓글, 임베드된 뽀모도로 타이머와
// 학습용 챗봇을 한 화면에서 관리한다. 수강신청을 하지 않았으면 status가 'locked'로 막힌다.
function LectureWatchPage() {
    const { id } = useParams();
    const lectureId = Number(id);
    const { auth } = useAuth();

    const [lecture, setLecture] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | loading | success | error | locked
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('others'); // others | comments
    const [notes, setNotes] = useState([]);
    const [otherNotesPage, setOtherNotesPage] = useState(1);
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
    const [newTagName, setNewTagName] = useState('');
    const [tagSubmitting, setTagSubmitting] = useState(false);
    const [pomodoroRefreshKey, setPomodoroRefreshKey] = useState(0);
    const [showPomodoroHistory, setShowPomodoroHistory] = useState(false);
    const [pomodoroOpen, setPomodoroOpen] = useState(false);

    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatSending, setChatSending] = useState(false);
    const [chatError, setChatError] = useState(null);
    const chatMessagesRef = useRef(null);
    const [showQuestionList, setShowQuestionList] = useState(false);
    const [questionListExpanded, setQuestionListExpanded] = useState(false);

    // 이 강의를 보는 동안 이어서 물어본 질문들이 서버에 하나의 대화(rootQuestionId)로 묶이게 한다 —
    // AI 챗봇 페이지(/main/chat)의 전체 대화 목록에서 이어서 물어본 질문들이 새 항목으로 따로따로
    // 안 뜨고 하나로 묶여 보이게 하기 위함. 강의가 바뀌면 이어가던 대화도 새로 시작한다.
    const rootQuestionIdRef = useRef(null);
    useEffect(() => {
        rootQuestionIdRef.current = null;
    }, [lectureId]);

    const [comments, setComments] = useState([]);
    const [visibleCommentCount, setVisibleCommentCount] = useState(10);
    const [commentForm, setCommentForm] = useState({ content: '', parentCommentId: null });
    const [commentMessage, setCommentMessage] = useState('');
    const [commentSaving, setCommentSaving] = useState(false);

    // 강의 id가 바뀔 때마다 조회수를 올리고 강의/수강신청 여부/좋아요 여부를 함께 불러온다.
    // 수강신청이 되어있지 않으면 status를 'locked'로 만들어 시청 화면을 막는다.
    useEffect(() => {
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus('loading');
        setError(null);
        setIsPlaying(false);

        // 조회수 증가를 먼저 처리한 뒤 상세 정보를 조회해야 갱신된 숫자가 바로 표시된다.
        increaseLectureViewCount(id)
            .catch(() => {})
            .then(() => Promise.all([
                getLecture(id),
                fetchIsEnrolled(id),
                isLectureLiked(id).catch(() => false),
            ]))
            .then(([data, enrolled, likedStatus]) => {
                if (cancelled) return;
                setLecture(data);
                setLiked(Boolean(likedStatus));
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

    // 강의 좋아요를 토글하고, 서버 재조회 없이 화면의 likeCount도 낙관적으로 함께 바꾼다.
    const handleToggleLectureLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        try {
            if (liked) {
                await unlikeLecture(id);
                setLiked(false);
                setLecture((current) => current
                    ? { ...current, likeCount: Math.max(0, (current.likeCount ?? 0) - 1) }
                    : current);
            } else {
                await likeLecture(id);
                setLiked(true);
                setLecture((current) => current
                    ? { ...current, likeCount: (current.likeCount ?? 0) + 1 }
                    : current);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLikeLoading(false);
        }
    };

    // 이 강의의 노트 목록을 불러오고, 그중 내 노트가 있으면 폼을 그 내용으로 채워 수정 모드로 만든다.
    const loadNotes = useCallback(async () => {
        try {
            const list = await getNotesByLecture(id);
            setNotes(list ?? []);
            setOtherNotesPage(1);
            // 로그인 ID의 자료형이 달라도 같은 사용자의 기존 노트를 찾아 수정 모드로 유지합니다.
            const own = (list ?? []).find((note) => String(note.userId) === String(auth?.userId)) ?? null;
            setMyNote(own);
            setForm(own ? { title: own.title, content: own.content } : emptyForm);
            setContentImageFiles([]);
        } catch (err) {
            setSaveMessage(`노트를 불러오지 못했습니다: ${err.message}`);
        }
    }, [id, auth?.userId]);

    // 강의(및 내 계정)가 바뀔 때마다 노트 목록을 다시 불러온다.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadNotes();
    }, [loadNotes]);

    // 노트에 달린 태그 목록을 불러온다 (noteId가 없으면 빈 목록으로 초기화).
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

    // 내 노트가 바뀔 때마다(저장 등으로 id가 바뀌면) 태그 목록을 다시 불러온다.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTagError(null);
        loadTags(myNote?.id);
    }, [myNote?.id, loadTags]);

    // AI에게 지금 노트 내용을 바탕으로 태그를 새로 생성해달라고 요청한다.
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

    // 작성자가 태그명을 직접 입력해 추가. 이미 있는 이름이면 백엔드가 기존 태그에 매핑해준다.
    const handleAddTag = async (event) => {
        event.preventDefault();
        const name = newTagName.trim();
        if (!myNote || !name || tagSubmitting) return;

        setTagSubmitting(true);
        setTagError(null);
        try {
            await addNoteTag(myNote.id, name);
            setNewTagName('');
            await loadTags(myNote.id);
        } catch (err) {
            setTagError(err.message);
        } finally {
            setTagSubmitting(false);
        }
    };

    // AI가 붙였든 직접 추가했든, 작성자 본인이면 태그를 뗄 수 있다.
    const handleDeleteTag = async (tagId) => {
        if (!myNote) return;
        setTagError(null);
        try {
            await deleteNoteTag(myNote.id, tagId);
            await loadTags(myNote.id);
        } catch (err) {
            setTagError(err.message);
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

    // 새 메시지가 쌓일 때마다 챗봇 대화창을 맨 아래로 스크롤한다.
    useEffect(() => {
        // AI 답변이 추가돼도 페이지 전체는 움직이지 않고 챗봇 대화창 내부만 아래로 이동한다.
        const chatContainer = chatMessagesRef.current;
        if (chatMessages.length > 0 && chatContainer) {
            chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        }
    }, [chatMessages]);

    // 질문 목록에서 항목을 누르면 대화창에서 그 질문이 있는 위치로 스크롤해서 보여주고, 팝오버는 닫는다.
    const scrollToQuestion = (questionId) => {
        setShowQuestionList(false);
        const chatContainer = chatMessagesRef.current;
        const questionElement = document.getElementById(`lecture-chat-message-${questionId}`);
        if (chatContainer && questionElement) {
            chatContainer.scrollTo({
                top: questionElement.offsetTop - chatContainer.offsetTop,
                behavior: 'smooth',
            });
        }
    };

    // 이 강의의 댓글 목록을 불러오고, 더보기 노출 개수를 처음 10개로 초기화한다.
    const loadComments = useCallback(async () => {
        try {
            const list = await getLectureComments(lectureId);
            setComments(list ?? []);
            setVisibleCommentCount(10);
        } catch (err) {
            setCommentMessage(`댓글을 불러오지 못했습니다: ${err.message}`);
        }
    }, [lectureId]);

    // 강의가 바뀔 때마다 댓글 목록을 다시 불러온다.
    useEffect(() => {
        loadComments();
    }, [loadComments]);

    // 답글 대상 댓글을 지정하고 입력창을 비운다.
    const selectCommentReplyTarget = (comment) => {
        setCommentForm((prev) => ({ ...prev, parentCommentId: comment.id, content: '' }));
    };

    // 답글 작성을 취소하고 일반 댓글 작성 상태로 되돌린다.
    const cancelCommentReply = () => {
        setCommentForm((prev) => ({ ...prev, parentCommentId: null }));
    };

    // 댓글(또는 답글)을 등록하고 폼을 비운 뒤 목록을 새로고침한다.
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

    // 댓글 내용을 수정하고 목록을 새로고침한다. 성공 여부를 반환해 호출부(수정 폼)가 닫힐지 결정한다.
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

    // 확인 후 댓글을 삭제하고 목록을 새로고침한다.
    const handleDeleteComment = async (comment) => {
        if (!window.confirm('댓글을 삭제할까요?')) return;
        try {
            await deleteLectureComment(comment.id);
            await loadComments();
        } catch (err) {
            setCommentMessage(`댓글 삭제 실패: ${err.message}`);
        }
    };

    // 노트 본문 에디터의 커서 위치에 빈 코드블럭 템플릿을 삽입한다.
    const insertCodeBlock = () => {
        const codeBlock = '\n```\n// 코드를 입력하세요\n```\n';
        contentRef.current?.insertCodeBlock(codeBlock);
    };

    // 노트에 첨부할 이미지 파일을 서버에 업로드하고 저장된 URL 등의 정보를 받아온다.
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

    // 이미지 파일 선택 시 에디터 커서 위치에 미리보기를 넣어둔다 (실제 업로드는 저장 시점에 처리).
    const handleContentImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 파일 선택 시에는 바로 업로드하지 않고 커서 위치에 미리보기만 넣는다. 실제 업로드는 저장할 때 처리한다.
        const pendingImage = createPendingContentImage(file);
        setContentImageFiles((prev) => [...prev, pendingImage]);
        contentRef.current?.insertImage(pendingImage.token, pendingImage.previewUrl);
        event.target.value = '';
    };

    // 선택한 글자에 지정한 색상을 적용한다.
    const applyTextColor = (color) => {
        // 선택한 글자는 에디터에서 즉시 색으로 보이고 저장할 때 본문 색상 코드로 직렬화됩니다.
        contentRef.current?.applyColor(color);
    };

    // 선택한 글자에 볼드/밑줄 등 서식을 적용한다.
    const applyTextStyle = (styleName) => {
        contentRef.current?.applyTextStyle(styleName);
    };

    // 노트를 저장(신규 작성 또는 기존 수정)한다. 대기 중인 이미지들을 먼저 업로드하고,
    // 본문 속 첫 이미지를 대표 썸네일로 사용한다.
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

    // 학습용 챗봇에 질문을 보내고 답변을 대화 목록에 이어붙인다. 같은 강의를 보는 동안은
    // rootQuestionIdRef로 이어서 물어본 질문들을 하나의 대화로 묶는다.
    const handleChatSend = async (message) => {
        setChatError(null);
        setChatSending(true);
        setChatMessages((prev) => [...prev, { id: `pending-${Date.now()}`, senderRole: 'USER', message }]);

        try {
            const answer = await sendMessage({ lectureId, message, rootQuestionId: rootQuestionIdRef.current });
            rootQuestionIdRef.current = answer.rootQuestionId;
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
    const otherNotesTotalPages = Math.max(1, Math.ceil(othersNotes.length / OTHER_NOTES_PER_PAGE));
    const visibleOtherNotes = othersNotes.slice(
        (otherNotesPage - 1) * OTHER_NOTES_PER_PAGE,
        otherNotesPage * OTHER_NOTES_PER_PAGE,
    );
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
                <div className={`lecture-watch-page__content${!pomodoroOpen && !chatDrawerOpen ? ' is-widgets-collapsed' : ''}${pomodoroOpen || chatDrawerOpen ? ' is-tools-open' : ''}${pomodoroOpen ? ' is-timer-open' : ''}${chatDrawerOpen ? ' is-chat-open' : ''}`}>
                        <div className="lecture-watch-page__top">
                            <div className="lecture-watch-page__top-info">
                                {lecture.categoryName && (
                                    <span className="lecture-watch-page__category">{lecture.categoryName}</span>
                                )}
                                <h1 className="lecture-watch-page__title">{lecture.title}</h1>
                                <div className="lecture-watch-page__top-meta">
                                    <div className="lecture-watch-page__stats">
                                        {/* 단순 문구 대신 커뮤니티 상세와 같은 하트 이미지 좋아요 버튼을 사용한다. */}
                                        <button
                                            type="button"
                                            className={`lecture-watch-page__like-btn${liked ? ' is-liked' : ''}`}
                                            onClick={handleToggleLectureLike}
                                            disabled={likeLoading}
                                            aria-label={liked ? '좋아요 취소' : '좋아요'}
                                            aria-pressed={liked}
                                        >
                                            <img src={liked ? FILLED_HEART_IMAGE : EMPTY_HEART_IMAGE} alt="" />
                                            <span>{lecture.likeCount ?? 0}</span>
                                        </button>
                                        <span>조회 {lecture.viewCount ?? 0}</span>
                                        <span>노트 {notes.length}개</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lecture-watch-page__media-row">
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

                            <div className={`lecture-watch-page__pomodoro${pomodoroOpen ? '' : ' is-collapsed'}`}>
                                <div className="lecture-watch-page__pomodoro-content">
                                    <div className="lecture-watch-page__pomodoro-header">
                                        <span className="lecture-watch-page__pomodoro-badge"><ClockBadgeIcon /></span>
                                        <span className="lecture-watch-page__pomodoro-title">타이머</span>
                                        <button
                                            type="button"
                                            className="lecture-watch-page__pomodoro-history-toggle"
                                            onClick={() => setShowPomodoroHistory((v) => !v)}
                                            aria-label={showPomodoroHistory ? '기록 닫기' : '기록 보기'}
                                        >
                                            <QuestionListIcon />
                                        </button>
                                        <button
                                            type="button"
                                            className="lecture-watch-page__pomodoro-collapse"
                                            onClick={() => {
                                                setShowPomodoroHistory(false);
                                                setPomodoroOpen(false);
                                            }}
                                        >
                                            접기 ›
                                        </button>
                                        {showPomodoroHistory && (
                                            <div className="lecture-watch-page__pomodoro-history-popover">
                                                <StatsAndHistory refreshKey={pomodoroRefreshKey} />
                                            </div>
                                        )}
                                    </div>
                                    <Timer
                                        lectureId={lectureId}
                                        noteId={null}
                                        onFinished={({ auto } = {}) => {
                                            setPomodoroRefreshKey((k) => k + 1);
                                            // 시간이 0초가 되어 자동 종료되면 접힌 타이머를 바로 펼쳐 완료 상태를 보여준다.
                                            if (auto) {
                                                setPomodoroOpen(true);
                                            }
                                        }}
                                    />
                                </div>
                                {!pomodoroOpen && (
                                    <button
                                        type="button"
                                        className="lecture-watch-page__pomodoro-expand"
                                        onClick={() => setPomodoroOpen(true)}
                                    >
                                        ‹ 타이머
                                    </button>
                                )}
                            </div>
                            </div>
                        </div>

                    <div className={`lecture-watch-page__layout${!chatDrawerOpen ? ' is-side-collapsed' : ''}`}>
                        <div className="lecture-watch-page__main">
                        <div className="lecture-watch-page__tabs">
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

                        <form className="lecture-watch-page__note-form" onSubmit={handleSaveNote}>
                                <div className="lecture-watch-page__note-titlebar">
                                    <input
                                        className="lecture-watch-page__note-title"
                                        value={form.title}
                                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                        placeholder="제목을 입력하세요"
                                    />
                                    {myNote && (
                                        <Link
                                            to={`/main/notes/${myNote.id}`}
                                            className="lecture-watch-page__note-detail-link"
                                        >
                                            노트 상세 가기
                                        </Link>
                                    )}
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
                                                {myNote && (
                                                    <button
                                                        type="button"
                                                        className="note-tag-chip__remove"
                                                        onClick={() => handleDeleteTag(tag.tagId)}
                                                        aria-label={`'${tag.tagName}' 태그 삭제`}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                      </span>
                                        ))}
                                        {myNote ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="note-tag-generate"
                                                    onClick={handleGenerateTags}
                                                    disabled={tagGenerating}
                                                >
                                                    {tagGenerating ? 'AI 태그 생성 중...' : (tags.length > 0 ? 'AI 태그 다시 생성' : 'AI 태그 생성')}
                                                </button>
                                                {/* 이 태그 추가 영역은 노트 저장용 <form>(위 lecture-watch-page__note-form) 안에 있어
                                                    <form>을 중첩할 수 없다. 그래서 <div>로 감싸고, Enter 입력 시 노트 저장 폼이
                                                    같이 제출되지 않도록 keydown에서 직접 preventDefault + handleAddTag를 호출한다. */}
                                                <div className="note-tag-add">
                                                    <input
                                                        type="text"
                                                        className="note-tag-add__input"
                                                        value={newTagName}
                                                        onChange={(event) => setNewTagName(event.target.value)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter') {
                                                                event.preventDefault();
                                                                handleAddTag(event);
                                                            }
                                                        }}
                                                        placeholder="태그 직접 추가"
                                                        maxLength={50}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="note-tag-add__submit"
                                                        onClick={handleAddTag}
                                                        disabled={tagSubmitting || !newTagName.trim()}
                                                    >
                                                        {tagSubmitting ? '추가 중...' : '+ 추가'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="lecture-watch-page__note-tags-hint">노트를 먼저 저장하면 AI가 태그를 추천해줘요.</span>
                                        )}
                                    </div>
                                    {tagError && <p className="note-tag-error">{tagError}</p>}
                                </div>
                        </form>

                        {activeTab === 'others' && (
                            <div className="lecture-watch-page__others">
                                {othersNotes.length === 0 && <p>아직 다른 학습자의 노트가 없습니다.</p>}
                                {visibleOtherNotes.map((note) => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                                {otherNotesTotalPages > 1 && (
                                    <nav className="lecture-watch-page__pagination" aria-label="다른 학습자 노트 페이지">
                                        <button
                                            type="button"
                                            className="lecture-watch-page__page-btn lecture-watch-page__page-btn--nav"
                                            onClick={() => setOtherNotesPage((page) => Math.max(1, page - 1))}
                                            disabled={otherNotesPage === 1}
                                        >
                                            이전
                                        </button>
                                        {getPageNumbers(otherNotesPage, otherNotesTotalPages).map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                className={`lecture-watch-page__page-btn${page === otherNotesPage ? ' is-active' : ''}`}
                                                aria-current={page === otherNotesPage ? 'page' : undefined}
                                                onClick={() => setOtherNotesPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="lecture-watch-page__page-btn lecture-watch-page__page-btn--nav"
                                            onClick={() => setOtherNotesPage((page) => Math.min(otherNotesTotalPages, page + 1))}
                                            disabled={otherNotesPage === otherNotesTotalPages}
                                        >
                                            다음
                                        </button>
                                    </nav>
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <section className="comment-panel">
                                <h2>
                                    댓글
                                    <span className="comment-panel__count">{countLectureComments(comments)}</span>
                                </h2>
                                <form className="comment-form" onSubmit={handleCreateComment}>
                                    {commentForm.parentCommentId && (
                                        <div className="reply-target">
                                            답글 작성 중
                                            <button type="button" onClick={cancelCommentReply}>취소</button>
                                        </div>
                                    )}
                                    <textarea
                                        rows="1"
                                        value={commentForm.content}
                                        onChange={(event) => setCommentForm((prev) => ({ ...prev, content: event.target.value }))}
                                        onInput={(event) => autoGrowCommentTextarea(event.currentTarget)}
                                        placeholder="댓글 내용"
                                    />
                                    <button type="submit" disabled={commentSaving}>댓글 등록</button>
                                </form>
                                {commentMessage && <p className="lecture-watch-page__note-message">{commentMessage}</p>}

                                <ul className="comment-list">
                                    {comments.slice(0, visibleCommentCount).map((comment) => (
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
                                {comments.length > visibleCommentCount && (
                                    <div className="comment-panel__more-row">
                                        <button
                                            type="button"
                                            className="comment-panel__more"
                                            onClick={() => setVisibleCommentCount((count) => count + 10)}
                                        >
                                            더보기
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    <div className="lecture-watch-page__side">
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
                                <div className="chat-messages" ref={chatMessagesRef}>
                                    {chatMessages.map((message) => (
                                        <div key={message.id} id={`lecture-chat-message-${message.id}`}>
                                            <ChatMessage senderRole={message.senderRole} message={message.message} recommendedLectures={message.recommendedLectures} />
                                        </div>
                                    ))}
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
                </div>
                </div>
            )}
        </section>
    );
}

export default LectureWatchPage;

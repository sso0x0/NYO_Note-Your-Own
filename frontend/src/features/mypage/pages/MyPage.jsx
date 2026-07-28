import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInfo, updateMyProfile, withdraw } from '../api/mypage';
import { getMyNotes, getLikedNotes } from '../../note/api/note';
import { getPostList, getMyComments } from '../../community/api/post';
import { getLectureList, isEnrolled } from '../../lecture/api/lecture';
import { deleteAllHistories, deleteHistories, getHistories } from '../../chat/api/chat';
import { getRecordsByPeriod, getTodayStudyTime, getTotalStudyTime } from '../../pomodoro/api/pomodoro';
import { toLocalDateString } from '../../pomodoro/dateUtil';
import { useAuth } from '../../../context/AuthContext';
import NoteCard from '../../note/components/NoteCard';
import LineChart from '../../../components/charts/LineChart';
import './MyPage.css';

const LIST_SIZE = 8;
const POST_SCAN_SIZE = 50; // 내 글을 찾기 위해 넉넉히 훑어볼 최근 게시글 수
const LECTURE_SCAN_SIZE = 30; // 수강신청 여부를 물어볼 최근 강의 수 (개별 API 호출 방식이라 너무 크게 잡지 않습니다)
const CHAT_HISTORY_SIZE = 10; // 챗봇 대화 기록 한 페이지당 개수
const POMODORO_PERIOD_SIZE = 100; // 기간별 조회 시 한 번에 가져올 기록 수

function defaultPomodoroRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13); // 최근 14일 (관리자 대시보드의 "최근 14일"과 동일한 기본 범위)
    return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

// 이번 주(월요일 시작) 첫날
function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=일 ~ 6=토
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMonday);
    return d;
}

// 이번 달 첫날
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function MyPage() {
    const { logout, updateNickname } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', nickname: '', phone: '', currentPassword: '', newPassword: '' });
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [myNotes, setMyNotes] = useState([]);
    const [likedNotes, setLikedNotes] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [myLectures, setMyLectures] = useState([]);
    const [myComments, setMyComments] = useState([]);

    const [chatHistories, setChatHistories] = useState([]);
    const [chatHistoryPage, setChatHistoryPage] = useState(0);
    const [chatHistoryHasMore, setChatHistoryHasMore] = useState(false);
    const [chatHistoryLoadingMore, setChatHistoryLoadingMore] = useState(false);
    const [chatHistoryError, setChatHistoryError] = useState(null);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedChatPairIds, setSelectedChatPairIds] = useState([]);
    const [chatHistoryDeleting, setChatHistoryDeleting] = useState(false);

    const [pomodoroToday, setPomodoroToday] = useState(0);
    const [pomodoroWeek, setPomodoroWeek] = useState(0);
    const [pomodoroMonth, setPomodoroMonth] = useState(0);
    const [pomodoroTotal, setPomodoroTotal] = useState(0);
    const [pomodoroRange, setPomodoroRange] = useState(defaultPomodoroRange);
    const [pomodoroRecords, setPomodoroRecords] = useState([]);
    const [pomodoroStatus, setPomodoroStatus] = useState('idle'); // idle | loading | success | error
    const [pomodoroError, setPomodoroError] = useState(null);

    // chatHistories는 id 내림차순(최신순)으로 온다. 답변은 항상 질문 바로 다음에 저장되므로
    // id가 더 크고, 내림차순 목록에서는 질문 바로 앞자리에 온다 — 그 관계로 짝을 짓는다.
    const chatPairs = useMemo(() => {
        const pairs = [];
        chatHistories.forEach((entry, index) => {
            if (entry.senderRole !== 'USER') return;
            const prev = chatHistories[index - 1];
            const answer = prev && prev.senderRole === 'ASSISTANT' ? prev : null;
            pairs.push({ question: entry, answer });
        });
        return pairs;
    }, [chatHistories]);

    const selectedChatPair = useMemo(
        () => chatPairs.find((pair) => pair.question.id === selectedChatId) ?? null,
        [chatPairs, selectedChatId]
    );

    const pomodoroChartData = useMemo(() => {
        const grouped = {};
        pomodoroRecords.forEach((record) => {
            const date = record.recordDate;
            grouped[date] = (grouped[date] ?? 0) + (record.focusMinutes ?? 0) / 60;
        });
        return Object.keys(grouped)
            .sort()
            .map((date) => ({ label: date, value: grouped[date] }));
    }, [pomodoroRecords]);
    const fetchPomodoroRecords = useCallback((range) => {
        setPomodoroStatus('loading');
        setPomodoroError(null);

        getRecordsByPeriod({ startDate: range.start, endDate: range.end, size: POMODORO_PERIOD_SIZE })
            .then((page) => {
                setPomodoroRecords(page?.content ?? []);
                setPomodoroStatus('success');
            })
            .catch((err) => {
                setPomodoroError(err.message);
                setPomodoroStatus('error');
            });
    }, []);

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        setError(null);

        Promise.all([
            getMyInfo(),
            getMyNotes({ size: LIST_SIZE }),
            getLikedNotes({ size: LIST_SIZE }),
            getPostList({ size: POST_SCAN_SIZE, sort: 'createdAt' }),
            getLectureList({ size: LECTURE_SCAN_SIZE }),
            getHistories({ size: CHAT_HISTORY_SIZE }),
            getTodayStudyTime(),
            getTotalStudyTime(),
            getRecordsByPeriod({ startDate: pomodoroRange.start, endDate: pomodoroRange.end, size: POMODORO_PERIOD_SIZE }).catch(() => ({ content: [] })),
            getMyComments({ size: LIST_SIZE }).catch(() => ({ content: [] })),
        ])
            .then(async ([me, mine, liked, posts, lectures, chatHistoryPage0, todayStudyTime, totalStudyTime, initialPomodoroRecords, comments]) => {
                if (cancelled) return;
                setProfile(me);
                setForm({ name: me.name ?? '', nickname: me.nickname ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '' });
                setMyNotes(mine?.content ?? []);
                setLikedNotes(liked?.content ?? []);
                setChatHistories(chatHistoryPage0?.content ?? []);
                setChatHistoryHasMore(!(chatHistoryPage0?.last ?? true));
                setPomodoroToday(todayStudyTime?.totalFocusMinutes ?? 0);
                setPomodoroTotal(totalStudyTime?.totalFocusMinutes ?? 0);
                setPomodoroRecords(initialPomodoroRecords?.content ?? []);
                setPomodoroStatus('success');
                setMyComments(comments?.content ?? []);

                // 백엔드에 "내 글만" 조회 API가 없어 프론트에서 닉네임으로 걸러냅니다.
                // 최근 POST_SCAN_SIZE개 안에서만 찾으므로 오래된 글은 누락될 수 있습니다.
                const mineOnly = (posts?.content ?? []).filter(
                    (post) => post.authorNickname === me.nickname
                );
                setMyPosts(mineOnly.slice(0, LIST_SIZE));

                // TODO: 수강신청 목록 API(예: getMyEnrolledLectures)가 생기면 아래 임시 로직을 그걸로 교체하세요.
                const lectureList = lectures?.content ?? [];
                const enrolledFlags = await Promise.all(
                    lectureList.map((lecture) => isEnrolled(lecture.id).catch(() => false))
                );
                const enrolledOnly = lectureList.filter((_, index) => enrolledFlags[index]);
                if (!cancelled) setMyLectures(enrolledOnly.slice(0, LIST_SIZE));

                setStatus('success');
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.message);
                setStatus('error');
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleStartEdit = () => {
        setSaveError(null);
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setForm({
            name: profile.name ?? '',
            nickname: profile.nickname ?? '',
            phone: profile.phone ?? '',
            currentPassword: '',
            newPassword: '',
        });
        setSaveError(null);
        setEditing(false);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);

        try {
            const updated = await updateMyProfile(form);
            setProfile(updated);
            updateNickname(updated.nickname);
            setForm({ name: updated.name ?? '', nickname: updated.nickname ?? '', phone: updated.phone ?? '', currentPassword: '', newPassword: '' });
            setEditing(false);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm('정말로 탈퇴하시겠습니까? 작성한 노트는 유지되지만 작성자 표시가 "탈퇴한 사용자"로 바뀝니다.')) {
            return;
        }

        try {
            await withdraw();
            logout();
            navigate('/login', { replace: true });
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePomodoroFilterSubmit = (e) => {
        e.preventDefault();
        fetchPomodoroRecords(pomodoroRange);
    };

    const toggleChatPairSelected = (questionId) => {
        setSelectedChatPairIds((prev) =>
            prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
        );
    };

    const toggleAllChatPairsSelected = () => {
        setSelectedChatPairIds((prev) =>
            prev.length === chatPairs.length ? [] : chatPairs.map((pair) => pair.question.id)
        );
    };

    const handleDeleteSelectedChatHistory = async () => {
        if (selectedChatPairIds.length === 0) return;
        if (!window.confirm('선택한 대화를 삭제하시겠습니까?')) return;

        const idsToDelete = chatPairs
            .filter((pair) => selectedChatPairIds.includes(pair.question.id))
            .flatMap((pair) => (pair.answer ? [pair.question.id, pair.answer.id] : [pair.question.id]));

        setChatHistoryDeleting(true);
        try {
            await deleteHistories(idsToDelete);
            setChatHistories((prev) => prev.filter((entry) => !idsToDelete.includes(entry.id)));
            if (selectedChatPairIds.includes(selectedChatId)) {
                setSelectedChatId(null);
            }
            setSelectedChatPairIds([]);
        } catch (err) {
            alert(err.message);
        } finally {
            setChatHistoryDeleting(false);
        }
    };

    const handleDeleteAllChatHistory = async () => {
        if (!window.confirm('전체 대화 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;

        setChatHistoryDeleting(true);
        try {
            await deleteAllHistories();
            setChatHistories([]);
            setSelectedChatId(null);
            setSelectedChatPairIds([]);
            setChatHistoryHasMore(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setChatHistoryDeleting(false);
        }
    };

    const handleLoadMoreChatHistory = () => {
        setChatHistoryLoadingMore(true);
        setChatHistoryError(null);

        const nextPage = chatHistoryPage + 1;
        getHistories({ size: CHAT_HISTORY_SIZE, page: nextPage })
            .then((page) => {
                setChatHistories((prev) => [...prev, ...(page?.content ?? [])]);
                setChatHistoryPage(nextPage);
                setChatHistoryHasMore(!(page?.last ?? true));
            })
            .catch((err) => {
                setChatHistoryError(err.message);
            })
            .finally(() => {
                setChatHistoryLoadingMore(false);
            });
    };

    const isSocialAccount = profile?.oauthProvider && profile.oauthProvider !== 'NONE';

    return (
        <section className="mypage">
            <h2>마이페이지</h2>

            {status === 'loading' && <p>불러오는 중...</p>}
            {status === 'error' && <p role="alert">불러오지 못했습니다: {error}</p>}

            {status === 'success' && profile && (
                <>
                    <div className="mypage__profile">
                        <div className="mypage__profile-header">
                            <h3>내 정보</h3>
                            {!editing && (
                                <button type="button" onClick={handleStartEdit}>정보 수정</button>
                            )}
                        </div>

                        {!editing ? (
                            <dl className="mypage__profile-view">
                                <dt>아이디</dt>
                                <dd>{profile.loginId}</dd>
                                <dt>이름</dt>
                                <dd>{profile.name}</dd>
                                <dt>닉네임</dt>
                                <dd>{profile.nickname}</dd>
                                <dt>이메일</dt>
                                <dd>{profile.email}</dd>
                                <dt>전화번호</dt>
                                <dd>{profile.phone || '-'}</dd>
                            </dl>
                        ) : (
                            <form className="mypage__profile-form" onSubmit={handleSaveProfile}>
                                {saveError && <p className="mypage__error" role="alert">{saveError}</p>}

                                <dl className="mypage__profile-view mypage__profile-view--readonly">
                                    <dt>아이디</dt>
                                    <dd>{profile.loginId}</dd>
                                    <dt>이름</dt>
                                    <dd>{profile.name}</dd>
                                </dl>

                                <label>
                                    닉네임
                                    <input name="nickname" value={form.nickname} onChange={handleFormChange} required />
                                </label>
                                <label>
                                    전화번호
                                    <input name="phone" value={form.phone} onChange={handleFormChange} placeholder="010-1234-5678" />
                                </label>

                                {!isSocialAccount && (
                                    <>
                                        <label>
                                            현재 비밀번호
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={form.currentPassword}
                                                onChange={handleFormChange}
                                                placeholder="비밀번호를 바꿀 때만 입력"
                                            />
                                        </label>
                                        <label>
                                            새 비밀번호
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={form.newPassword}
                                                onChange={handleFormChange}
                                                placeholder="바꾸지 않으면 비워두세요"
                                            />
                                        </label>
                                    </>
                                )}

                                <div className="mypage__profile-actions">
                                    <button type="submit" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
                                    <button type="button" onClick={handleCancelEdit} disabled={saving}>취소</button>
                                </div>
                            </form>
                        )}
                    </div>

                    <section className="mypage__section">
                        <h3>뽀모도로 학습 기록</h3>
                        <div className="mypage__pomodoro-summary">
                            <div className="mypage__pomodoro-stat">
                                <span className="mypage__pomodoro-stat-label">오늘 학습</span>
                                <span className="mypage__pomodoro-stat-value">{pomodoroToday}분</span>
                            </div>
                            <div className="mypage__pomodoro-stat">
                                <span className="mypage__pomodoro-stat-label">이번주 학습</span>
                                <span className="mypage__pomodoro-stat-value">{pomodoroWeek}분</span>
                            </div>
                            <div className="mypage__pomodoro-stat">
                                <span className="mypage__pomodoro-stat-label">이번달 학습</span>
                                <span className="mypage__pomodoro-stat-value">{pomodoroMonth}분</span>
                            </div>
                            <div className="mypage__pomodoro-stat">
                                <span className="mypage__pomodoro-stat-label">전체 누적</span>
                                <span className="mypage__pomodoro-stat-value">{pomodoroTotal}분</span>
                            </div>
                        </div>

                        <form className="mypage__pomodoro-filter" onSubmit={handlePomodoroFilterSubmit}>
                            <label>
                                시작일
                                <input
                                    type="date"
                                    value={pomodoroRange.start}
                                    max={pomodoroRange.end}
                                    onChange={(e) => setPomodoroRange((prev) => ({ ...prev, start: e.target.value }))}
                                />
                            </label>
                            <label>
                                종료일
                                <input
                                    type="date"
                                    value={pomodoroRange.end}
                                    min={pomodoroRange.start}
                                    onChange={(e) => setPomodoroRange((prev) => ({ ...prev, end: e.target.value }))}
                                />
                            </label>
                            <button type="submit" disabled={pomodoroStatus === 'loading'}>조회</button>
                        </form>

                        {pomodoroError && <p role="alert">불러오지 못했습니다: {pomodoroError}</p>}

                        {pomodoroStatus === 'loading' ? (
                            <p>불러오는 중...</p>
                        ) : pomodoroRecords.length === 0 ? (
                            <p>선택한 기간에 학습 기록이 없습니다.</p>
                        ) : (
                            <>
                                <LineChart
                                    data={pomodoroChartData}
                                    color="var(--accent)"
                                    valueLabel="집중 시간(h)"
                                    formatValue={(hours) => `${Math.round(hours * 60)}분`}
                                />
                                <ul className="mypage__pomodoro-list">
                                    {pomodoroRecords.map((record) => (
                                        <li key={record.id} className="mypage__pomodoro-item">
                                            <span className="mypage__pomodoro-item-date">{record.recordDate}</span>
                                            <span className="mypage__pomodoro-item-detail">
                                                집중 {record.focusMinutes}분
                                                {!record.endedAt && ' (진행 중)'}
                                            </span>
                                            <span className="mypage__pomodoro-item-link">
                                                {record.lectureId
                                                    ? `강의 #${record.lectureId}`
                                                    : record.noteId
                                                        ? `노트 #${record.noteId}`
                                                        : '연결된 강의/노트 없음'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>

                    <section className="mypage__section">
                        <h3>내가 수강신청한 강의</h3>
                        {myLectures.length === 0 ? (
                            <p>수강신청한 강의가 없습니다.</p>
                        ) : (
                            <ul className="mypage__post-list">
                                {myLectures.map((lecture) => (
                                    <li key={lecture.id} className="mypage__post-item">
                                        <Link to={`/main/lectures/${lecture.id}`} className="mypage__post-link">
                      <span className="mypage__post-title">
                        {lecture.isPopular && <span className="mypage__post-badge">인기</span>}
                          {lecture.title}
                      </span>
                                            <span className="mypage__post-meta">
                        {lecture.instructor && `${lecture.instructor} · `}
                                                조회 {lecture.viewCount ?? 0} · 좋아요 {lecture.likeCount ?? 0}
                      </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="mypage__section">
                        <h3>내가 작성한 게시글</h3>
                        {myPosts.length === 0 ? (
                            <p>작성한 게시글이 없습니다.</p>
                        ) : (
                            <ul className="mypage__post-list">
                                {myPosts.map((post) => (
                                    <li key={post.id} className="mypage__post-item">
                                        <Link to={`/main/community/${post.id}`} className="mypage__post-link">
                      <span className="mypage__post-title">
                        {post.notice && <span className="mypage__post-badge">공지</span>}
                          {post.title}
                      </span>
                                            <span className="mypage__post-meta">
                        조회 {post.viewCount ?? 0} · 좋아요 {post.likeCount ?? 0}
                                                {post.createdAt && ` · ${post.createdAt.slice(0, 10)}`}
                      </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* 💡 추가: 내가 작성한 댓글 */}
                    <section className="mypage__section">
                        <h3>내가 작성한 댓글</h3>
                        {myComments.length === 0 ? (
                            <p>작성한 댓글이 없습니다.</p>
                        ) : (
                            <ul className="mypage__post-list">
                                {myComments.map((comment) => (
                                    <li key={comment.id} className="mypage__post-item">
                                        <Link
                                            to={comment.postId ? `/main/community/${comment.postId}` : `/main/lectures/${comment.lectureId}`}
                                            className="mypage__post-link"
                                        >
                                            <span className="mypage__post-title">{comment.content}</span>
                                            <span className="mypage__post-meta">
                                                {comment.postId ? '커뮤니티' : '강의'}
                                                {comment.createdAt && ` · ${comment.createdAt.replace('T', ' ').slice(0, 16)}`}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="mypage__section">
                        <h3>내가 작성한 노트</h3>
                        {myNotes.length === 0 ? (
                            <p>작성한 노트가 없습니다.</p>
                        ) : (
                            <div className="mypage__grid">
                                {myNotes.map((note) => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="mypage__section">
                        <h3>내가 좋아요한 노트</h3>
                        {likedNotes.length === 0 ? (
                            <p>좋아요한 노트가 없습니다.</p>
                        ) : (
                            <div className="mypage__grid">
                                {likedNotes.map((note) => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="mypage__section">
                        <h3>챗봇 대화 기록</h3>
                        {chatHistoryError && <p role="alert">불러오지 못했습니다: {chatHistoryError}</p>}
                        {chatPairs.length === 0 ? (
                            <p>아직 챗봇과 나눈 대화가 없습니다.</p>
                        ) : (
                            <>
                                <div className="mypage__chat-history-header">
                                    <label className="mypage__chat-select-all">
                                        <input
                                            type="checkbox"
                                            checked={chatPairs.length > 0 && selectedChatPairIds.length === chatPairs.length}
                                            disabled={chatHistoryDeleting}
                                            onChange={toggleAllChatPairsSelected}
                                        />
                                        전체 선택
                                    </label>
                                    <div className="mypage__chat-history-actions">
                                        <button
                                            type="button"
                                            className="mypage__chat-select-delete-btn"
                                            disabled={selectedChatPairIds.length === 0 || chatHistoryDeleting}
                                            onClick={handleDeleteSelectedChatHistory}
                                        >
                                            선택 삭제{selectedChatPairIds.length > 0 ? ` (${selectedChatPairIds.length})` : ''}
                                        </button>
                                        <button
                                            type="button"
                                            className="mypage__chat-delete-all-btn"
                                            disabled={chatHistories.length === 0 || chatHistoryDeleting}
                                            onClick={handleDeleteAllChatHistory}
                                        >
                                            전체 삭제
                                        </button>
                                    </div>
                                </div>

                                <div className="mypage__chat-layout">
                                    <ul className="mypage__chat-question-list">
                                        {chatPairs.map((pair) => (
                                            <li key={pair.question.id} className="mypage__chat-question-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedChatPairIds.includes(pair.question.id)}
                                                    disabled={chatHistoryDeleting}
                                                    onChange={() => toggleChatPairSelected(pair.question.id)}
                                                />
                                                <button
                                                    type="button"
                                                    className={
                                                        'mypage__chat-question-btn' +
                                                        (pair.question.id === selectedChatId ? ' mypage__chat-question-btn--active' : '')
                                                    }
                                                    onClick={() => setSelectedChatId(pair.question.id)}
                                                >
                                                    <span className="mypage__chat-question-text">{pair.question.message}</span>
                                                    <span className="mypage__chat-question-meta">
                                                        {pair.question.lectureId && `강의 #${pair.question.lectureId} · `}
                                                        {pair.question.createdAt && pair.question.createdAt.replace('T', ' ').slice(0, 16)}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mypage__chat-detail">
                                        {selectedChatPair ? (
                                            <>
                                                <div className="mypage__chat-item">
                                                    <div className="mypage__chat-item-header">
                                                        <span className="mypage__chat-role mypage__chat-role--user">나</span>
                                                    </div>
                                                    <p className="mypage__chat-message">{selectedChatPair.question.message}</p>
                                                </div>
                                                <div className="mypage__chat-item">
                                                    <div className="mypage__chat-item-header">
                                                        <span className="mypage__chat-role mypage__chat-role--assistant">AI</span>
                                                    </div>
                                                    {selectedChatPair.answer ? (
                                                        <p className="mypage__chat-message">{selectedChatPair.answer.message}</p>
                                                    ) : (
                                                        <p className="mypage__chat-message mypage__chat-message--pending">아직 답변이 없습니다.</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <p>왼쪽 목록에서 질문을 선택해주세요.</p>
                                        )}
                                    </div>
                                </div>
                                {chatHistoryHasMore && (
                                    <button
                                        type="button"
                                        className="mypage__chat-load-more"
                                        onClick={handleLoadMoreChatHistory}
                                        disabled={chatHistoryLoadingMore || chatHistoryDeleting}
                                    >
                                        {chatHistoryLoadingMore ? '불러오는 중...' : '더 보기'}
                                    </button>
                                )}
                            </>
                        )}
                    </section>

                    <div className="mypage__danger-zone">
                        <button type="button" className="mypage__withdraw-btn" onClick={handleWithdraw}>
                            회원 탈퇴
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}

export default MyPage;
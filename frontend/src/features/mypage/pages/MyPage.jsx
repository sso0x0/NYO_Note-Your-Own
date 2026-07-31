import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInfo, updateMyProfile, withdraw } from '../api/mypage';
import { getMyNotes, getLikedNotes } from '../../note/api/note';
import { getPostList, getMyComments } from '../../community/api/post';
import { getLectureList, isEnrolled, getLecture } from '../../lecture/api/lecture';
import { deleteAllHistories, deleteHistories, getHistories } from '../../chat/api/chat';
import { getRecordsByPeriod, getTodayStudyTime, getTotalStudyTime } from '../../pomodoro/api/pomodoro';
import { toLocalDateString } from '../../pomodoro/dateUtil';
import { useAuth } from '../../../context/AuthContext';
import NoteCard from '../../note/components/NoteCard';
import LectureCard from '../../lecture/components/LectureCard';
import { SmileIcon } from '../../chat/ChatMessage';
import LineChart from '../../../components/charts/LineChart';
import nyoLogo from '../../../assets/images/nyo_logo.png';
import eyeOpenIcon from '../../../assets/images/eye.png';
import eyeCloseIcon from '../../../assets/images/eye_close.png';
import './MyPage.css';

// 회원가입 페이지와 동일한 눈 모양 아이콘 컴포넌트 적용
function EyeIcon({ open }) {
    return <img src={open ? eyeOpenIcon : eyeCloseIcon} alt="" width="20" height="20" />;
}

const TABS = [
    { id: 'pomodoro', label: '학습 기록' },
    { id: 'lectures', label: '수강 강의' },
    { id: 'posts', label: '게시글' },
    { id: 'comments', label: '댓글' },
    { id: 'notes', label: '작성 노트' },
    { id: 'likedNotes', label: '좋아요 노트' },
];

const LIST_SIZE = 8;          // 노트/게시글/댓글 목록 초기 조회 개수
const POST_SCAN_SIZE = 50;    // 전체 게시글 중 내가 쓴 글만 걸러내기 위해 넉넉히 가져오는 개수
const LECTURE_SCAN_SIZE = 30; // 전체 강의 중 내가 수강신청한 것만 걸러내기 위해 넉넉히 가져오는 개수
const POMODORO_PERIOD_SIZE = 100;
const PAGE_SIZE = 5;          // 탭 안에서 클라이언트 사이드 페이징 단위
const CHAT_HISTORY_SIZE = 8; // 필요한 값으로 조정

// 이미 불러온 배열을 프론트에서 PAGE_SIZE 단위로 잘라 보여주는 클라이언트 사이드 페이징 헬퍼
function paginate(items, page) {
    return items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
}

// 탭 콘텐츠 하단에 붙는 공용 이전/다음 페이지 버튼
function Pager({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    return (
        <div className="mypage__pager">
            <button type="button" onClick={() => onChange(page - 1)} disabled={page === 0}>
                이전
            </button>
            <span className="mypage__pager-status">{page + 1} / {totalPages}</span>
            <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>
                다음
            </button>
        </div>
    );
}

// 뽀모도로 차트 기본 조회 기간: 오늘 포함 최근 14일
function defaultPomodoroRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13);
    return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

// 해당 날짜가 속한 주의 월요일을 반환 (일요일은 그 전주로 취급)
function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMonday);
    return d;
}

// 해당 날짜가 속한 달의 1일을 반환
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// 마이페이지: 내 정보 조회/수정, 회원 탈퇴, 그리고 학습기록·수강강의·게시글·댓글·노트·좋아요 노트를
// 탭으로 묶어 한 화면에서 보여준다. 탭별 데이터는 최초 마운트 시 한 번에 병렬로 불러온다.
function MyPage() {
    const { logout, updateNickname } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | loading | success | error (전체 초기 데이터 로딩 상태)
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    // 내 정보 수정 폼
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', nickname: '', phone: '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);

    // 탭별로 보여줄 목록 데이터 (전부 최초 로딩 시 한 번에 가져와서 클라이언트에서 페이징)
    const [myNotes, setMyNotes] = useState([]);
    const [likedNotes, setLikedNotes] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [myLectures, setMyLectures] = useState([]);
    const [myComments, setMyComments] = useState([]);

    // 위 목록들의 클라이언트 사이드 페이지 번호 (paginate 헬퍼와 함께 사용)
    const [notesPage, setNotesPage] = useState(0);
    const [likedNotesPage, setLikedNotesPage] = useState(0);
    const [lecturesPage, setLecturesPage] = useState(0);
    const [postsPage, setPostsPage] = useState(0);
    const [commentsPage, setCommentsPage] = useState(0);

    // AI 챗봇 대화 기록 - 서버 페이징(무한 스크롤 방식 "더 보기")을 사용하고, 질문/답변 쌍 선택 삭제도 지원
    const [chatHistories, setChatHistories] = useState([]);
    const [chatHistoryPage, setChatHistoryPage] = useState(0);
    const [chatHistoryHasMore, setChatHistoryHasMore] = useState(false);
    const [chatHistoryLoadingMore, setChatHistoryLoadingMore] = useState(false);
    const [chatHistoryError, setChatHistoryError] = useState(null);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedChatPairIds, setSelectedChatPairIds] = useState([]);
    const [chatHistoryDeleting, setChatHistoryDeleting] = useState(false);
    // 대화 중 언급된 lectureId -> 강의 제목 캐시 (매번 다시 조회하지 않도록)
    const [lectureTitleMap, setLectureTitleMap] = useState({});

    // 뽀모도로(학습 타이머) 통계/기록
    const [pomodoroToday, setPomodoroToday] = useState(0);
    const [pomodoroWeek, setPomodoroWeek] = useState(0);
    const [pomodoroMonth, setPomodoroMonth] = useState(0);
    const [pomodoroTotal, setPomodoroTotal] = useState(0);
    const [pomodoroRange, setPomodoroRange] = useState(defaultPomodoroRange);
    const [pomodoroRecords, setPomodoroRecords] = useState([]);
    const [pomodoroPage, setPomodoroPage] = useState(0);
    const [pomodoroStatus, setPomodoroStatus] = useState('idle');
    const [pomodoroError, setPomodoroError] = useState(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
    // 정보수정 폼에서 각 입력란을 한 번이라도 건드렸는지(blur) 추적 - 건드린 필드만 경고 문구를 보여줌
    const [touched, setTouched] = useState({
        nickname: false,
        phone: false,
        currentPassword: false,
        newPassword: false,
        newPasswordConfirm: false,
    });
    const [saveSuccess, setSaveSuccess] = useState(false);

    // 저장 성공 메시지를 3초 뒤 자동으로 숨김
    useEffect(() => {
        if (!saveSuccess) return;
        const timer = setTimeout(() => setSaveSuccess(false), 3000);
        return () => clearTimeout(timer);
    }, [saveSuccess]);

    // 대화 기록(chatHistories)은 시간순 flat 배열로 오므로, USER 메시지 기준으로
    // 바로 앞 ASSISTANT 메시지를 답변으로 짝지어 질문/답변 쌍 목록을 만든다.
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

    // 현재 상세보기로 선택된 질문/답변 쌍
    const selectedChatPair = useMemo(
        () => chatPairs.find((pair) => pair.question.id === selectedChatId) ?? null,
        [chatPairs, selectedChatId]
    );

    // 선택돼 있던 대화가 삭제 등으로 목록에서 사라지면 첫 번째 대화로 선택을 되돌림
    useEffect(() => {
        if (chatPairs.length === 0) return;
        const stillExists = chatPairs.some((pair) => pair.question.id === selectedChatId);
        if (!stillExists) setSelectedChatId(chatPairs[0].question.id);
    }, [chatPairs, selectedChatId]);

    // 대화에서 언급된 강의 ID 중 아직 제목을 모르는 것만 골라 한 번에 조회 후 캐시에 채워 넣는다
    useEffect(() => {
        const missingIds = [...new Set(
            chatPairs.map((pair) => pair.question.lectureId).filter((id) => id != null)
        )].filter((id) => !(id in lectureTitleMap));

        if (missingIds.length === 0) return;

        let cancelled = false;
        Promise.all(missingIds.map((id) => getLecture(id).catch(() => null))).then((lectures) => {
            if (cancelled) return;
            setLectureTitleMap((prev) => {
                const next = { ...prev };
                missingIds.forEach((id, index) => {
                    next[id] = lectures[index]?.title ?? null;
                });
                return next;
            });
        });

        return () => {
            cancelled = true;
        };
    }, [chatPairs, lectureTitleMap]);

    // 날짜별 집중 시간(분) 합계를 시간 단위로 환산해 라인 차트용 데이터로 변환
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

    // 날짜 필터(pomodoroRange)를 바꿔 조회할 때 재사용하는 뽀모도로 기록 조회 함수
    const fetchPomodoroRecords = useCallback((range) => {
        setPomodoroStatus('loading');
        setPomodoroError(null);

        getRecordsByPeriod({ startDate: range.start, endDate: range.end, size: POMODORO_PERIOD_SIZE })
            .then((page) => {
                setPomodoroRecords(page?.content ?? []);
                setPomodoroPage(0);
                setPomodoroStatus('success');
            })
            .catch((err) => {
                setPomodoroError(err.message);
                setPomodoroStatus('error');
            });
    }, []);

    // 최초 마운트 시 마이페이지에 필요한 데이터를 한 번에 병렬로 불러온다.
    // (posts/lectures는 "전체 목록"만 API로 제공되므로 넉넉히 가져온 뒤 클라이언트에서 본인 것만 필터링한다)
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
                setForm({ name: me.name ?? '', nickname: me.nickname ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
                setMyNotes(mine?.content ?? []);
                setLikedNotes(liked?.content ?? []);
                setChatHistories(chatHistoryPage0?.content ?? []);
                setChatHistoryHasMore(!(chatHistoryPage0?.last ?? true));
                setPomodoroToday(todayStudyTime?.totalFocusMinutes ?? 0);
                setPomodoroTotal(totalStudyTime?.totalFocusMinutes ?? 0);
                setPomodoroRecords(initialPomodoroRecords?.content ?? []);
                setPomodoroStatus('success');
                setMyComments(comments?.content ?? []);

                // 게시글 목록 API는 작성자 필터를 지원하지 않아, 최근 글 중에서 내 닉네임과 일치하는 것만 골라낸다
                const mineOnly = (posts?.content ?? []).filter(
                    (post) => post.authorNickname === me.nickname
                );
                setMyPosts(mineOnly.slice(0, LIST_SIZE));

                // 마찬가지로 강의 목록도 수강 여부 필터가 없어, 각 강의별로 수강 여부를 개별 조회해서 걸러낸다
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
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 정보 수정 모드 진입: 이전 저장 결과/에러 상태를 초기화
    const handleStartEdit = () => {
        setSaveError(null);
        setSaveSuccess(false);
        setTouched({ nickname: false, phone: false, currentPassword: false, newPassword: false, newPasswordConfirm: false });
        setEditing(true);
    };

    // 수정 취소: 입력값을 서버에서 받아온 원본 profile 값으로 되돌린다
    const handleCancelEdit = () => {
        setForm({
            name: profile.name ?? '',
            nickname: profile.nickname ?? '',
            phone: profile.phone ?? '',
            currentPassword: '',
            newPassword: '',
            newPasswordConfirm: ''
        });
        setSaveError(null);
        setTouched({ nickname: false, phone: false, currentPassword: false, newPassword: false, newPasswordConfirm: false });
        setEditing(false);
    };

    // 정보 수정 폼 제출. 닉네임이 바뀌면 헤더 등에서 쓰는 AuthContext의 닉네임도 함께 갱신한다.
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);

        try {
            const updated = await updateMyProfile(form);
            setProfile(updated);
            updateNickname(updated.nickname);
            setForm({ name: updated.name ?? '', nickname: updated.nickname ?? '', phone: updated.phone ?? '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
            setEditing(false);
            setSaveSuccess(true);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // 회원 탈퇴: 확인창 통과 시 탈퇴 API 호출 후 로그아웃 처리하며 로그인 페이지로 이동
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

    // 날짜 필터 폼 제출 시 해당 기간의 뽀모도로 기록을 다시 조회
    const handlePomodoroFilterSubmit = (e) => {
        e.preventDefault();
        fetchPomodoroRecords(pomodoroRange);
    };

    // 대화 삭제용 체크박스 선택 토글 (질문 단위로 선택하며, 삭제 시 연결된 답변도 함께 지운다)
    const toggleChatPairSelected = (questionId) => {
        setSelectedChatPairIds((prev) =>
            prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
        );
    };

    // 전체 선택/해제 토글
    const toggleAllChatPairsSelected = () => {
        setSelectedChatPairIds((prev) =>
            prev.length === chatPairs.length ? [] : chatPairs.map((pair) => pair.question.id)
        );
    };

    // 삭제된 id들을 로컬 state에서도 제거해 서버 재조회 없이 화면을 갱신
    const removeChatHistoryEntries = (deletedIds) => {
        const deletedSet = new Set(deletedIds);
        setChatHistories((prev) => prev.filter((entry) => !deletedSet.has(entry.id)));
        setSelectedChatPairIds((prev) => prev.filter((id) => !deletedSet.has(id)));
    };

    // 체크된 질문/답변 쌍만 삭제
    const handleDeleteSelectedChatHistory = async () => {
        if (selectedChatPairIds.length === 0) return;
        if (!window.confirm(`선택한 ${selectedChatPairIds.length}개 질문(답변 포함)을 삭제할까요?`)) return;

        setChatHistoryDeleting(true);
        setChatHistoryError(null);
        try {
            const idsToDelete = chatPairs
                .filter((pair) => selectedChatPairIds.includes(pair.question.id))
                .flatMap((pair) => (pair.answer ? [pair.question.id, pair.answer.id] : [pair.question.id]));
            await deleteHistories(idsToDelete);
            removeChatHistoryEntries(idsToDelete);
        } catch (err) {
            setChatHistoryError(err.message);
        } finally {
            setChatHistoryDeleting(false);
        }
    };

    // 전체 대화 기록 삭제
    const handleDeleteAllChatHistory = async () => {
        if (chatHistories.length === 0) return;
        if (!window.confirm('전체 대화 기록을 삭제할까요? 되돌릴 수 없어요.')) return;

        setChatHistoryDeleting(true);
        setChatHistoryError(null);
        try {
            await deleteAllHistories();
            setChatHistories([]);
            setChatHistoryPage(0);
            setChatHistoryHasMore(false);
            setSelectedChatPairIds([]);
            setSelectedChatId(null);
        } catch (err) {
            setChatHistoryError(err.message);
        } finally {
            setChatHistoryDeleting(false);
        }
    };

    // 대화 기록 "더 보기" - 다음 페이지를 이어서 조회해 기존 목록 뒤에 append
    const handleLoadMoreChatHistory = async () => {
        setChatHistoryLoadingMore(true);
        setChatHistoryError(null);
        try {
            const nextPage = chatHistoryPage + 1;
            const res = await getHistories({ page: nextPage, size: CHAT_HISTORY_SIZE });
            setChatHistories((prev) => [...prev, ...(res?.content ?? [])]);
            setChatHistoryPage(nextPage);
            setChatHistoryHasMore(!(res?.last ?? true));
        } catch (err) {
            setChatHistoryError(err.message);
        } finally {
            setChatHistoryLoadingMore(false);
        }
    };

    // 소셜(구글 등) 로그인 계정은 비밀번호가 없으므로 정보수정 폼에서 비밀번호 변경 영역 자체를 숨긴다
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
                            <>
                                {saveSuccess && (
                                    <p className="mypage__success" role="status">수정되었습니다.</p>
                                )}
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
                            </>
                        ) : (
                            <form className="mypage__profile-form" onSubmit={handleSaveProfile} noValidate>
                                {saveError && <p className="mypage__error" role="alert">{saveError}</p>}

                                <dl className="mypage__profile-view mypage__profile-view--readonly">
                                    <dt>아이디</dt>
                                    <dd>{profile.loginId}</dd>
                                    <dt>이름</dt>
                                    <dd>{profile.name}</dd>
                                </dl>

                                <div className="mypage__input-group">
                                    <label htmlFor="nickname">닉네임</label>
                                    <input
                                        id="nickname"
                                        name="nickname"
                                        value={form.nickname}
                                        onChange={handleFormChange}
                                        onBlur={() => setTouched((prev) => ({ ...prev, nickname: true }))}
                                        className={touched.nickname && !form.nickname ? 'input-error' : ''}
                                    />
                                    {touched.nickname && !form.nickname && (
                                        <span className="mypage__warning-text">닉네임을 입력해 주세요.</span>
                                    )}
                                </div>

                                <div className="mypage__input-group">
                                    <label htmlFor="phone">전화번호</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                                        placeholder="010-1234-5678"
                                        className={touched.phone && !form.phone ? 'input-error' : ''}
                                    />
                                    {touched.phone && !form.phone && (
                                        <span className="mypage__warning-text">전화번호를 입력해 주세요.</span>
                                    )}
                                </div>

                                {!isSocialAccount && (
                                    <>
                                        <div className="mypage__input-group">
                                            <label htmlFor="currentPassword">현재 비밀번호</label>
                                            <div className="mypage__password-wrapper">
                                                <input
                                                    id="currentPassword"
                                                    name="currentPassword"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={form.currentPassword}
                                                    onChange={handleFormChange}
                                                    onBlur={() => setTouched((prev) => ({ ...prev, currentPassword: true }))}
                                                    className={touched.currentPassword && !form.currentPassword ? 'input-error' : ''}
                                                />
                                                <button
                                                    type="button"
                                                    className="mypage__eye-btn"
                                                    onClick={() => setShowCurrentPassword((v) => !v)}
                                                    aria-label={showCurrentPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                                    aria-pressed={showCurrentPassword}
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon open={showCurrentPassword} />
                                                </button>
                                            </div>
                                            {touched.currentPassword && !form.currentPassword && (
                                                <span className="mypage__warning-text">현재 비밀번호를 입력해 주세요.</span>
                                            )}
                                        </div>

                                        <div className="mypage__input-group">
                                            <label htmlFor="newPassword">새 비밀번호</label>
                                            <div className="mypage__password-wrapper">
                                                <input
                                                    id="newPassword"
                                                    name="newPassword"
                                                    type={showNewPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={form.newPassword}
                                                    onChange={handleFormChange}
                                                    onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                                                    className={touched.newPassword && !form.newPassword ? 'input-error' : ''}
                                                />
                                                <button
                                                    type="button"
                                                    className="mypage__eye-btn"
                                                    onClick={() => setShowNewPassword((v) => !v)}
                                                    aria-label={showNewPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                                    aria-pressed={showNewPassword}
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon open={showNewPassword} />
                                                </button>
                                            </div>
                                            {touched.newPassword && !form.newPassword && (
                                                <span className="mypage__warning-text">새 비밀번호를 입력해 주세요.</span>
                                            )}
                                        </div>

                                        <div className="mypage__input-group">
                                            <label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
                                            <div className="mypage__password-wrapper">
                                                <input
                                                    id="newPasswordConfirm"
                                                    name="newPasswordConfirm"
                                                    type={showNewPasswordConfirm ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={form.newPasswordConfirm}
                                                    onChange={handleFormChange}
                                                    onBlur={() => setTouched((prev) => ({ ...prev, newPasswordConfirm: true }))}
                                                    className={
                                                        touched.newPasswordConfirm &&
                                                        (!form.newPasswordConfirm || form.newPassword !== form.newPasswordConfirm)
                                                            ? 'input-error' : ''
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="mypage__eye-btn"
                                                    onClick={() => setShowNewPasswordConfirm((v) => !v)}
                                                    aria-label={showNewPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                                                    aria-pressed={showNewPasswordConfirm}
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon open={showNewPasswordConfirm} />
                                                </button>
                                            </div>
                                            {touched.newPasswordConfirm && !form.newPasswordConfirm && (
                                                <span className="mypage__warning-text">비밀번호 확인을 입력해 주세요.</span>
                                            )}
                                            {touched.newPasswordConfirm && form.newPasswordConfirm && form.newPassword !== form.newPasswordConfirm && (
                                                <span className="mypage__warning-text">비밀번호가 일치하지 않습니다.</span>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="mypage__profile-actions">
                                    <button type="submit" disabled={saving}>{saving ? '저장 중...' : '수정'}</button>
                                    <button type="button" onClick={handleCancelEdit} disabled={saving}>취소</button>
                                </div>
                            </form>
                        )}
                    </div>

                    <nav className="mypage__tabs" role="tablist" aria-label="마이페이지 메뉴">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={
                                    'mypage__tab-btn' + (activeTab === tab.id ? ' mypage__tab-btn--active' : '')
                                }
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* 선택된 탭에 해당하는 섹션만 렌더링 (탭 전환 시 데이터는 이미 다 불러온 상태라 재요청 없음) */}
                    <div className="mypage__panel">
                        {activeTab === 'pomodoro' && (
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
                                            {paginate(pomodoroRecords, pomodoroPage).map((record) => (
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
                                        <Pager
                                            page={pomodoroPage}
                                            totalPages={Math.ceil(pomodoroRecords.length / PAGE_SIZE)}
                                            onChange={setPomodoroPage}
                                        />
                                    </>
                                )}
                            </section>
                        )}

                        {activeTab === 'lectures' && (
                            <section className="mypage__section">
                                <h3>내가 수강신청한 강의</h3>
                                {myLectures.length === 0 ? (
                                    <p>수강신청한 강의가 없습니다.</p>
                                ) : (
                                    <>
                                        <div className="mypage__lecture-list">
                                            {paginate(myLectures, lecturesPage).map((lecture) => (
                                                <LectureCard key={lecture.id} lecture={lecture} />
                                            ))}
                                        </div>
                                        <Pager
                                            page={lecturesPage}
                                            totalPages={Math.ceil(myLectures.length / PAGE_SIZE)}
                                            onChange={setLecturesPage}
                                        />
                                    </>
                                )}
                            </section>
                        )}

                        {activeTab === 'posts' && (
                            <section className="mypage__section">
                                <h3>내가 작성한 게시글</h3>
                                {myPosts.length === 0 ? (
                                    <p>작성한 게시글이 없습니다.</p>
                                ) : (
                                    <>
                                        <ul className="mypage__post-list">
                                            {paginate(myPosts, postsPage).map((post) => (
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
                                        <Pager
                                            page={postsPage}
                                            totalPages={Math.ceil(myPosts.length / PAGE_SIZE)}
                                            onChange={setPostsPage}
                                        />
                                    </>
                                )}
                            </section>
                        )}

                        {activeTab === 'comments' && (
                            <section className="mypage__section">
                                <h3>내가 작성한 댓글</h3>
                                {myComments.length === 0 ? (
                                    <p>작성한 댓글이 없습니다.</p>
                                ) : (
                                    <>
                                        <ul className="mypage__post-list">
                                            {paginate(myComments, commentsPage).map((comment) => (
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
                                        <Pager
                                            page={commentsPage}
                                            totalPages={Math.ceil(myComments.length / PAGE_SIZE)}
                                            onChange={setCommentsPage}
                                        />
                                    </>
                                )}
                            </section>
                        )}

                        {activeTab === 'notes' && (
                            <section className="mypage__section">
                                <h3>내가 작성한 노트</h3>
                                {myNotes.length === 0 ? (
                                    <p>작성한 노트가 없습니다.</p>
                                ) : (
                                    <>
                                        <div className="mypage__note-list">
                                            {paginate(myNotes, notesPage).map((note) => (
                                                <NoteCard key={note.id} note={note} />
                                            ))}
                                        </div>
                                        <Pager
                                            page={notesPage}
                                            totalPages={Math.ceil(myNotes.length / PAGE_SIZE)}
                                            onChange={setNotesPage}
                                        />
                                    </>
                                )}
                            </section>
                        )}

                        {activeTab === 'likedNotes' && (
                            <section className="mypage__section">
                                <h3>내가 좋아요한 노트</h3>
                                {likedNotes.length === 0 ? (
                                    <p>좋아요한 노트가 없습니다.</p>
                                ) : (
                                    <>
                                        <div className="mypage__note-list">
                                            {paginate(likedNotes, likedNotesPage).map((note) => (
                                                <NoteCard key={note.id} note={note} />
                                            ))}
                                        </div>
                                        <Pager
                                            page={likedNotesPage}
                                            totalPages={Math.ceil(likedNotes.length / PAGE_SIZE)}
                                            onChange={setLikedNotesPage}
                                        />
                                    </>
                                )}
                            </section>
                        )}

                    </div>

                    <div className="mypage__danger-zone">
                        <button
                            type="button"
                            className="mypage__instructor-apply-btn"
                            onClick={() => navigate('/main/instructor/apply')}
                        >
                            강사 신청
                        </button>
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

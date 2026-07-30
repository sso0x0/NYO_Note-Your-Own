import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInfo, updateMyProfile, withdraw } from '../api/mypage';
import { getMyNotes, getLikedNotes } from '../../note/api/note';
import { getPostList, getMyComments } from '../../community/api/post';
import { getLectureList, isEnrolled } from '../../lecture/api/lecture';
import { getRecordsByPeriod, getTodayStudyTime, getTotalStudyTime } from '../../pomodoro/api/pomodoro';
import { toLocalDateString } from '../../pomodoro/dateUtil';
import { useAuth } from '../../../context/AuthContext';
import NoteCard from '../../note/components/NoteCard';
import LectureCard from '../../lecture/components/LectureCard';
import LineChart from '../../../components/charts/LineChart';
import './MyPage.css';

const TABS = [
    { id: 'pomodoro', label: '학습 기록' },
    { id: 'lectures', label: '수강 강의' },
    { id: 'posts', label: '게시글' },
    { id: 'comments', label: '댓글' },
    { id: 'notes', label: '작성 노트' },
    { id: 'likedNotes', label: '좋아요 노트' },
];

const LIST_SIZE = 8;
const POST_SCAN_SIZE = 50; // 내 글을 찾기 위해 넉넉히 훑어볼 최근 게시글 수
const LECTURE_SCAN_SIZE = 30; // 수강신청 여부를 물어볼 최근 강의 수 (개별 API 호출 방식이라 너무 크게 잡지 않습니다)
const POMODORO_PERIOD_SIZE = 100; // 기간별 조회 시 한 번에 가져올 기록 수
const PAGE_SIZE = 5; // 노트/강의/게시글/댓글 목록을 한 페이지에 보여줄 개수

function paginate(items, page) {
    return items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
}

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
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', nickname: '', phone: '', currentPassword: '', newPassword: '' });
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [myNotes, setMyNotes] = useState([]);
    const [likedNotes, setLikedNotes] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [myLectures, setMyLectures] = useState([]);
    const [myComments, setMyComments] = useState([]);

    const [notesPage, setNotesPage] = useState(0);
    const [likedNotesPage, setLikedNotesPage] = useState(0);
    const [lecturesPage, setLecturesPage] = useState(0);
    const [postsPage, setPostsPage] = useState(0);
    const [commentsPage, setCommentsPage] = useState(0);

    const [pomodoroToday, setPomodoroToday] = useState(0);
    const [pomodoroWeek, setPomodoroWeek] = useState(0);
    const [pomodoroMonth, setPomodoroMonth] = useState(0);
    const [pomodoroTotal, setPomodoroTotal] = useState(0);
    const [pomodoroRange, setPomodoroRange] = useState(defaultPomodoroRange);
    const [pomodoroRecords, setPomodoroRecords] = useState([]);
    const [pomodoroPage, setPomodoroPage] = useState(0);
    const [pomodoroStatus, setPomodoroStatus] = useState('idle'); // idle | loading | success | error
    const [pomodoroError, setPomodoroError] = useState(null);

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
                setPomodoroPage(0);
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
            getTodayStudyTime(),
            getTotalStudyTime(),
            getRecordsByPeriod({ startDate: pomodoroRange.start, endDate: pomodoroRange.end, size: POMODORO_PERIOD_SIZE }).catch(() => ({ content: [] })),
            getMyComments({ size: LIST_SIZE }).catch(() => ({ content: [] })),
        ])
            .then(async ([me, mine, liked, posts, lectures, todayStudyTime, totalStudyTime, initialPomodoroRecords, comments]) => {
                if (cancelled) return;
                setProfile(me);
                setForm({ name: me.name ?? '', nickname: me.nickname ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '' });
                setMyNotes(mine?.content ?? []);
                setLikedNotes(liked?.content ?? []);
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
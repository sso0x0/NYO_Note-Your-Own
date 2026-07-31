import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInfo, updateMyProfile, withdraw } from '../api/mypage';
import { getMyNotes, getLikedNotes } from '../../note/api/note';
import { getPostList, getMyComments } from '../../community/api/post';
import { getLectureList, isEnrolled, createMyLecture, getMyLectures } from '../../lecture/api/lecture';
import { getCategoryList } from '../../lecture/api/category';
import { getMyInstructorApplications } from '../../instructor/api/instructorApplication';
import { getRecordsByPeriod, getTodayStudyTime, getTotalStudyTime } from '../../pomodoro/api/pomodoro';
import { toLocalDateString } from '../../pomodoro/dateUtil';
import { useAuth } from '../../../context/AuthContext';
import NoteCard from '../../note/components/NoteCard';
import LectureCard from '../../lecture/components/LectureCard';
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
    { id: 'instructorApply', label: '강사 신청 현황' },
];

const INSTRUCTOR_STATUS_LABEL = {
    PENDING: '심사 대기중',
    APPROVED: '승인 완료',
    REJECTED: '반려됨',
};

const LECTURE_MANAGE_TABS = [
    { id: 'apply', label: '강의 등록 신청' },
    { id: 'myLectures', label: '등록 신청한 강의' },
    { id: 'status', label: '강사 신청 현황' },
];

const LIST_SIZE = 8;
const POST_SCAN_SIZE = 50;
const LECTURE_SCAN_SIZE = 30;
const POMODORO_PERIOD_SIZE = 100;
const PAGE_SIZE = 5;

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
    start.setDate(end.getDate() - 13);
    return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMonday);
    return d;
}

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
    const [form, setForm] = useState({ name: '', nickname: '', phone: '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [myNotes, setMyNotes] = useState([]);
    const [likedNotes, setLikedNotes] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [myLectures, setMyLectures] = useState([]);
    const [myComments, setMyComments] = useState([]);
    const [instructorApplications, setInstructorApplications] = useState([]);
    const [lectureCategories, setLectureCategories] = useState([]);
    const [myLectureApplications, setMyLectureApplications] = useState([]);

    const [notesPage, setNotesPage] = useState(0);
    const [likedNotesPage, setLikedNotesPage] = useState(0);
    const [lecturesPage, setLecturesPage] = useState(0);
    const [postsPage, setPostsPage] = useState(0);
    const [commentsPage, setCommentsPage] = useState(0);
    const [instructorApplyPage, setInstructorApplyPage] = useState(0);
    const [lectureApplyPage, setLectureApplyPage] = useState(0);
    const [lectureManageTab, setLectureManageTab] = useState('apply');

    const [lectureForm, setLectureForm] = useState({
        categoryId: '', title: '', description: '', lectureUrl: '', reviewUrl: '', instructor: '', capacity: '',
    });
    const [lectureFieldErrors, setLectureFieldErrors] = useState({});
    const [lectureFormError, setLectureFormError] = useState(null);
    const [lectureSubmitting, setLectureSubmitting] = useState(false);

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
            getMyInstructorApplications({ size: LIST_SIZE }).catch(() => ({ content: [] })),
            getCategoryList().catch(() => []),
            getMyLectures({ size: LIST_SIZE }).catch(() => ({ content: [] })),
        ])
            .then(async ([me, mine, liked, posts, lectures, todayStudyTime, totalStudyTime, initialPomodoroRecords, comments, instructorApplicationList, categoryList, myLectureApplicationList]) => {
                if (cancelled) return;
                setProfile(me);
                setForm({ name: me.name ?? '', nickname: me.nickname ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
                setMyNotes(mine?.content ?? []);
                setLikedNotes(liked?.content ?? []);
                setPomodoroToday(todayStudyTime?.totalFocusMinutes ?? 0);
                setPomodoroTotal(totalStudyTime?.totalFocusMinutes ?? 0);
                setPomodoroRecords(initialPomodoroRecords?.content ?? []);
                setPomodoroStatus('success');
                setMyComments(comments?.content ?? []);
                setInstructorApplications(instructorApplicationList?.content ?? []);
                setLectureCategories(categoryList ?? []);
                setMyLectureApplications(myLectureApplicationList?.content ?? []);

                const mineOnly = (posts?.content ?? []).filter(
                    (post) => post.authorNickname === me.nickname
                );
                setMyPosts(mineOnly.slice(0, LIST_SIZE));

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
            newPasswordConfirm: ''
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
            setForm({ name: updated.name ?? '', nickname: updated.nickname ?? '', phone: updated.phone ?? '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
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
    const isInstructor = profile?.role === 'INSTRUCTOR';
    const latestInstructorApplicationStatus = instructorApplications[0]?.status;
    const canApplyAsInstructor =
        !isInstructor && (instructorApplications.length === 0 || latestInstructorApplicationStatus === 'REJECTED');

    const renderInstructorApplicationList = () =>
        instructorApplications.length === 0 ? (
            <p>강사 신청 내역이 없습니다.</p>
        ) : (
            <>
                <ul className="mypage__application-list">
                    {paginate(instructorApplications, instructorApplyPage).map((app) => {
                        const statusKey = app.status.toLowerCase();
                        return (
                            <li
                                key={app.id}
                                className={`mypage__application-card mypage__application-card--${statusKey}`}
                            >
                                <div className="mypage__application-head">
                                    <span className={`mypage__status-badge mypage__status-badge--${statusKey}`}>
                                        {INSTRUCTOR_STATUS_LABEL[app.status] ?? app.status}
                                    </span>
                                    <span className="mypage__application-category">{app.categoryName}</span>
                                    <span className="mypage__application-date">
                                        {app.createdAt?.slice(0, 10)} 신청
                                    </span>
                                </div>
                                <dl className="mypage__application-detail">
                                    <dt>경력 연차</dt>
                                    <dd>{app.careerYears != null ? `${app.careerYears}년` : '-'}</dd>
                                    <dt>소속/직함</dt>
                                    <dd>{app.company || '-'}</dd>
                                    <dt>경력 및 소개</dt>
                                    <dd className="mypage__application-detail-text">{app.bio || '-'}</dd>
                                    <dt>신청 동기</dt>
                                    <dd className="mypage__application-detail-text">{app.motivation || '-'}</dd>
                                    {app.curriculum && (
                                        <>
                                            <dt>강의 계획 소개</dt>
                                            <dd className="mypage__application-detail-text">{app.curriculum}</dd>
                                        </>
                                    )}
                                    {app.portfolioUrl && (
                                        <>
                                            <dt>포트폴리오</dt>
                                            <dd>
                                                <a href={app.portfolioUrl} target="_blank" rel="noreferrer">
                                                    {app.portfolioUrl}
                                                </a>
                                            </dd>
                                        </>
                                    )}
                                    {app.attachmentUrl && (
                                        <>
                                            <dt>첨부파일</dt>
                                            <dd>
                                                <a href={app.attachmentUrl} target="_blank" rel="noreferrer">
                                                    {app.attachmentName || '첨부파일 보기'}
                                                </a>
                                            </dd>
                                        </>
                                    )}
                                    {app.status !== 'PENDING' && (
                                        <>
                                            <dt>{app.status === 'APPROVED' ? '승인일' : '반려일'}</dt>
                                            <dd>{app.reviewedAt?.slice(0, 10) ?? '-'}</dd>
                                        </>
                                    )}
                                    {app.status === 'REJECTED' && (
                                        <>
                                            <dt>반려 사유</dt>
                                            <dd className="mypage__application-detail-text mypage__application-reject-reason">
                                                {app.rejectReason || '-'}
                                            </dd>
                                        </>
                                    )}
                                </dl>
                            </li>
                        );
                    })}
                </ul>
                <Pager
                    page={instructorApplyPage}
                    totalPages={Math.ceil(instructorApplications.length / PAGE_SIZE)}
                    onChange={setInstructorApplyPage}
                />
            </>
        );

    const renderLectureApplyForm = () => (
        <form className="mypage__lecture-form" onSubmit={handleLectureSubmit} noValidate>
            {lectureFormError && <p className="mypage__error" role="alert">{lectureFormError}</p>}
            <p className="mypage__lecture-form-notice">
                현재는 유튜브 링크만 강의 URL로 첨부할 수 있습니다. 썸네일은 해당 링크에서 자동으로 추출되며, 다른 영상 플랫폼 지원은 추후 추가될 예정입니다.
            </p>

            <div className="mypage__lecture-form-grid">
                <label>
                    카테고리
                    <select
                        name="categoryId"
                        value={lectureForm.categoryId}
                        onChange={handleLectureFormChange}
                        className={lectureFieldErrors.categoryId ? 'input-error' : ''}
                    >
                        <option value="">선택</option>
                        {lectureCategories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    {lectureFieldErrors.categoryId && (
                        <span className="mypage__warning-text">{lectureFieldErrors.categoryId}</span>
                    )}
                </label>

                <label>
                    강의명
                    <input
                        name="title"
                        value={lectureForm.title}
                        onChange={handleLectureFormChange}
                        maxLength={200}
                        className={lectureFieldErrors.title ? 'input-error' : ''}
                    />
                    {lectureFieldErrors.title && (
                        <span className="mypage__warning-text">{lectureFieldErrors.title}</span>
                    )}
                </label>

                <label>
                    강사명
                    <input
                        name="instructor"
                        value={lectureForm.instructor}
                        onChange={handleLectureFormChange}
                        maxLength={100}
                        placeholder="예: 홍길동"
                        className={lectureFieldErrors.instructor ? 'input-error' : ''}
                    />
                    {lectureFieldErrors.instructor && (
                        <span className="mypage__warning-text">{lectureFieldErrors.instructor}</span>
                    )}
                </label>

                <label>
                    수강 정원 (선택, 미입력 시 무제한)
                    <input
                        type="number"
                        name="capacity"
                        min={1}
                        value={lectureForm.capacity}
                        onChange={handleLectureFormChange}
                    />
                </label>

                <label>
                    강의 URL
                    <input
                        name="lectureUrl"
                        value={lectureForm.lectureUrl}
                        onChange={handleLectureFormChange}
                        placeholder="https://..."
                        className={lectureFieldErrors.lectureUrl ? 'input-error' : ''}
                    />
                    {lectureFieldErrors.lectureUrl && (
                        <span className="mypage__warning-text">{lectureFieldErrors.lectureUrl}</span>
                    )}
                </label>

                <label>
                    복습용 URL (선택)
                    <input
                        name="reviewUrl"
                        value={lectureForm.reviewUrl}
                        onChange={handleLectureFormChange}
                        placeholder="https://..."
                        className={lectureFieldErrors.reviewUrl ? 'input-error' : ''}
                    />
                    {lectureFieldErrors.reviewUrl && (
                        <span className="mypage__warning-text">{lectureFieldErrors.reviewUrl}</span>
                    )}
                </label>

                <label className="mypage__lecture-form-full">
                    강의 설명
                    <textarea
                        name="description"
                        value={lectureForm.description}
                        onChange={handleLectureFormChange}
                        rows={6}
                        maxLength={5000}
                        className={lectureFieldErrors.description ? 'input-error' : ''}
                    />
                    {lectureFieldErrors.description && (
                        <span className="mypage__warning-text">{lectureFieldErrors.description}</span>
                    )}
                </label>
            </div>

            <p className="mypage__lecture-form-hint">
                신청한 강의는 관리자 승인 후 강의 목록에 공개됩니다.
            </p>

            <button type="submit" disabled={lectureSubmitting}>
                {lectureSubmitting ? '신청 중...' : '강의 등록 신청'}
            </button>
        </form>
    );

    const renderMyLectureList = () =>
        myLectureApplications.length === 0 ? (
            <p>등록 신청한 강의가 없습니다.</p>
        ) : (
            <>
                <ul className="mypage__application-list">
                    {paginate(myLectureApplications, lectureApplyPage).map((lecture) => {
                        const statusKey = lecture.status.toLowerCase();
                        const cardBody = (
                            <>
                                <div className="mypage__application-head">
                                    <span className={`mypage__status-badge mypage__status-badge--${statusKey}`}>
                                        {INSTRUCTOR_STATUS_LABEL[lecture.status] ?? lecture.status}
                                    </span>
                                    <span className="mypage__application-category">{lecture.title}</span>
                                    <span className="mypage__application-date">
                                        {lecture.createdAt?.slice(0, 10)} 신청
                                    </span>
                                </div>
                                <dl className="mypage__application-detail">
                                    <dt>카테고리</dt>
                                    <dd>{lecture.categoryName}</dd>
                                    <dt>강사명</dt>
                                    <dd>{lecture.instructor || '-'}</dd>
                                    <dt>수강 정원</dt>
                                    <dd>{lecture.capacity != null ? `${lecture.capacity}명` : '무제한'}</dd>
                                    <dt>강의 설명</dt>
                                    <dd className="mypage__application-detail-text">{lecture.description || '-'}</dd>
                                    {lecture.lectureUrl && (
                                        <>
                                            <dt>강의 URL</dt>
                                            <dd className="mypage__application-detail-text">{lecture.lectureUrl}</dd>
                                        </>
                                    )}
                                    {lecture.reviewUrl && (
                                        <>
                                            <dt>복습용 URL</dt>
                                            <dd className="mypage__application-detail-text">{lecture.reviewUrl}</dd>
                                        </>
                                    )}
                                    {lecture.status === 'REJECTED' && (
                                        <>
                                            <dt>반려 사유</dt>
                                            <dd className="mypage__application-detail-text mypage__application-reject-reason">
                                                {lecture.rejectReason || '-'}
                                            </dd>
                                        </>
                                    )}
                                </dl>
                            </>
                        );

                        return (
                            <li
                                key={lecture.id}
                                className={`mypage__application-card mypage__application-card--${statusKey}`}
                            >
                                {lecture.status === 'APPROVED' ? (
                                    <Link to={`/main/lectures/${lecture.id}`} className="mypage__application-card-link">
                                        {cardBody}
                                    </Link>
                                ) : (
                                    <div className="mypage__application-card-link mypage__application-card-link--static">
                                        {cardBody}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <Pager
                    page={lectureApplyPage}
                    totalPages={Math.ceil(myLectureApplications.length / PAGE_SIZE)}
                    onChange={setLectureApplyPage}
                />
            </>
        );

    const handleLectureFormChange = (e) => {
        const { name, value } = e.target;
        setLectureForm((prev) => ({ ...prev, [name]: value }));
        setLectureFieldErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    };

    const validateLectureForm = () => {
        const errors = {};
        if (!lectureForm.categoryId) errors.categoryId = '카테고리를 선택해 주세요.';
        if (!lectureForm.title.trim()) errors.title = '강의명을 입력해 주세요.';
        if (!lectureForm.instructor.trim()) errors.instructor = '강사명을 입력해 주세요.';
        if (!lectureForm.lectureUrl.trim()) errors.lectureUrl = '강의 URL을 입력해 주세요.';
        if (!lectureForm.description.trim()) errors.description = '강의 설명을 입력해 주세요.';
        return errors;
    };

    const handleLectureSubmit = async (e) => {
        e.preventDefault();
        const errors = validateLectureForm();
        setLectureFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setLectureSubmitting(true);
        setLectureFormError(null);

        try {
            const created = await createMyLecture({
                categoryId: Number(lectureForm.categoryId),
                title: lectureForm.title,
                description: lectureForm.description || undefined,
                lectureUrl: lectureForm.lectureUrl || undefined,
                reviewUrl: lectureForm.reviewUrl || undefined,
                instructor: lectureForm.instructor || undefined,
                capacity: lectureForm.capacity === '' ? undefined : Number(lectureForm.capacity),
            });
            setMyLectureApplications((prev) => [created, ...prev]);
            setLectureApplyPage(0);
            setLectureForm({ categoryId: '', title: '', description: '', lectureUrl: '', reviewUrl: '', instructor: '', capacity: '' });
            alert('강의 등록 신청이 완료되었습니다.');
        } catch (err) {
            setLectureFormError(err.message);
        } finally {
            setLectureSubmitting(false);
        }
    };

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
                                        className={!form.nickname ? 'input-error' : ''}
                                    />
                                    {!form.nickname && <span className="mypage__warning-text">닉네임을 입력해 주세요.</span>}
                                </div>

                                <div className="mypage__input-group">
                                    <label htmlFor="phone">전화번호 (선택)</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        placeholder="010-1234-5678"
                                    />
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
                                                    className={!form.currentPassword ? 'input-error' : ''}
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
                                            {!form.currentPassword && <span className="mypage__warning-text">현재 비밀번호를 입력해 주세요.</span>}
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
                                                    className={!form.newPassword ? 'input-error' : ''}
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
                                            {!form.newPassword && <span className="mypage__warning-text">새 비밀번호를 입력해 주세요.</span>}
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
                                                    className={
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
                                            {!form.newPasswordConfirm && <span className="mypage__warning-text">비밀번호 확인을 입력해 주세요.</span>}
                                            {form.newPasswordConfirm && form.newPassword !== form.newPasswordConfirm && (
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
                        {TABS.filter((tab) => tab.id !== 'instructorApply' || instructorApplications.length > 0).map((tab) => {
                            const label = tab.id === 'instructorApply' && isInstructor ? '강의 관리' : tab.label;
                            return (
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
                                    {label}
                                </button>
                            );
                        })}
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

                        {activeTab === 'instructorApply' && (
                            <section className="mypage__section">
                                {!isInstructor ? (
                                    <>
                                        <h3>강사 신청 현황</h3>
                                        {renderInstructorApplicationList()}
                                    </>
                                ) : (
                                    <>
                                        <h3>강의 관리</h3>
                                        <nav className="mypage__subtabs" role="tablist" aria-label="강의 관리 메뉴">
                                            {LECTURE_MANAGE_TABS.map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={lectureManageTab === tab.id}
                                                    className={
                                                        'mypage__subtab-btn' +
                                                        (lectureManageTab === tab.id ? ' mypage__subtab-btn--active' : '')
                                                    }
                                                    onClick={() => setLectureManageTab(tab.id)}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </nav>

                                        {lectureManageTab === 'status' && renderInstructorApplicationList()}
                                        {lectureManageTab === 'apply' && renderLectureApplyForm()}
                                        {lectureManageTab === 'myLectures' && renderMyLectureList()}
                                    </>
                                )}
                            </section>
                        )}

                    </div>

                    <div className="mypage__danger-zone">
                        {canApplyAsInstructor && (
                            <button
                                type="button"
                                className="mypage__instructor-apply-btn"
                                onClick={() => navigate('/main/instructor/apply')}
                            >
                                강사 신청
                            </button>
                        )}
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
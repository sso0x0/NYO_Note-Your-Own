import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInfo, updateMyProfile, sendPhoneVerificationCode, verifyPhoneVerificationCode, withdraw } from '../api/mypage';
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

// 회원가입 페이지(SignupPage)의 이메일/전화번호 형식 검사와 동일한 정규식
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^01[0-9]-?\d{3,4}-?\d{4}$/;
// 영문 대소문자 + 숫자 + 특수문자를 모두 포함해야 함
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/;

const LIST_SIZE = 8;
const POST_SCAN_SIZE = 50;
const LECTURE_SCAN_SIZE = 30;
const POMODORO_PERIOD_SIZE = 100;
const PAGE_SIZE = 5;

// 전체 목록에서 현재 페이지에 해당하는 부분만 잘라낸다 (클라이언트 사이드 페이지네이션).
function paginate(items, page) {
    return items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
}

// 이전/다음 버튼과 현재 페이지 표시를 담당하는 공통 페이지네이션 UI.
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

// 뽀모도로 기록 조회의 기본 기간(오늘로부터 최근 14일)을 계산한다.
function defaultPomodoroRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13);
    return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

// 주어진 날짜가 속한 주의 월요일(주 시작일)을 구한다.
function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMonday);
    return d;
}

// 주어진 날짜가 속한 달의 1일을 구한다.
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// 마이페이지: 프로필 조회/수정, 뽀모도로 학습 기록, 게시글/댓글/노트/강의 신청 현황을 탭별로 보여준다.
function MyPage() {
    const { logout, updateNickname } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', nickname: '', email: '', phone: '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [saveError, setSaveError] = useState(null);
    const [currentPasswordError, setCurrentPasswordError] = useState(null);
    const [saving, setSaving] = useState(false);

    // 전화번호 변경 인증 (비밀번호 찾기와 동일한 SMS 인증코드 방식). verifiedPhone은 인증에 성공한 번호 값을 들고 있다가
    // form.phone과 비교해서, 인증 후 번호를 또 고치면 인증 상태가 자동으로 풀리게 한다.
    const [verifiedPhone, setVerifiedPhone] = useState(null);
    const [phoneCode, setPhoneCode] = useState('');
    const [phoneCodeSent, setPhoneCodeSent] = useState(false);
    const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
    const [verifyingPhoneCode, setVerifyingPhoneCode] = useState(false);
    const [phoneCodeError, setPhoneCodeError] = useState(null);
    const [phoneCodeInfo, setPhoneCodeInfo] = useState(null);

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

    // 뽀모도로 기록을 날짜별로 합산해 집중 시간(시간 단위) 추이 차트 데이터로 변환한다.
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

    // 지정한 기간의 뽀모도로 기록을 다시 조회해 목록과 차트를 갱신한다.
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

    // 마이페이지 진입 시 프로필, 노트, 강의, 게시글, 댓글, 강사 신청, 뽀모도로 기록 등
    // 화면에 필요한 데이터를 한 번에 병렬로 조회한다.
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
                setForm({ name: me.name ?? '', nickname: me.nickname ?? '', email: me.email ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
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

    const isSocialAccount = profile?.oauthProvider && profile.oauthProvider !== 'NONE';
    const nicknameChanged = !!profile && form.nickname !== profile.nickname;
    const emailChanged = !!profile && form.email !== profile.email;
    const phoneChanged = !!profile && form.phone !== (profile.phone ?? '');
    const phoneVerified = phoneChanged && verifiedPhone === form.phone;
    // 닉네임/이메일/전화번호/새 비밀번호 중 하나라도 바뀌어야 현재 비밀번호 입력란이 나타난다.
    const anyChanged = nicknameChanged || emailChanged || phoneChanged || !!form.newPassword;

    // 필드별 실시간 검증 규칙. 회원가입 페이지(SignupPage)의 validators와 동일한 패턴이다.
    const profileValidators = {
        nickname: (value) => {
            if (!value.trim()) return '닉네임을 입력해 주세요.';
            if (value.trim().length < 2) return '닉네임은 2자 이상 입력해 주세요.';
            return '';
        },
        email: (value) => {
            if (!value.trim()) return '이메일을 입력해 주세요.';
            if (!EMAIL_PATTERN.test(value)) return '올바른 이메일 형식이 아닙니다.';
            return '';
        },
        phone: (value) => {
            if (!value.trim()) return '휴대폰 번호를 입력해 주세요';
            if (!PHONE_PATTERN.test(value)) return '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
            return '';
        },
        // 소셜 로그인 회원이거나, 아무 값도 안 바꿨으면 이 검사 자체가 필요 없다.
        currentPassword: (value) => {
            if (isSocialAccount || !anyChanged) return '';
            if (!value) return '현재 비밀번호를 입력해 주세요.';
            return '';
        },
        newPassword: (value) => {
            if (!value) return ''; // 선택 항목
            if (value.length < 8 || value.length > 72) return '비밀번호는 8자 이상 입력해 주세요.';
            if (!PASSWORD_PATTERN.test(value)) return '비밀번호는 영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
            return '';
        },
        newPasswordConfirm: (value, nextForm) => {
            if (!nextForm.newPassword) return ''; // 새 비밀번호를 안 바꾸면 확인도 필요 없음
            if (!value) return '비밀번호 확인을 입력해 주세요.';
            if (value !== nextForm.newPassword) return '비밀번호가 일치하지 않습니다.';
            return '';
        },
    };

    // 주어진 필드 이름에 해당하는 검증 함수를 찾아 실행한다.
    const runValidator = (name, nextForm) => profileValidators[name](nextForm[name], nextForm);

    // 전화번호 인증 관련 상태(발송 여부, 인증된 번호, 입력한 코드 등)를 모두 초기화한다.
    const resetPhoneVerification = () => {
        setPhoneCodeSent(false);
        setVerifiedPhone(null);
        setPhoneCode('');
        setPhoneCodeError(null);
        setPhoneCodeInfo(null);
    };

    // 입력값을 폼 상태에 반영하고, 이미 터치된 필드는 즉시 재검증한다.
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        const nextForm = { ...form, [name]: value };
        setForm(nextForm);

        if (name === 'currentPassword') setCurrentPasswordError(null);
        // 번호를 다시 고치면 이전에 받았거나 확인한 인증코드는 더 이상 유효하지 않다.
        if (name === 'phone') resetPhoneVerification();

        setFieldErrors((prev) => {
            const next = { ...prev };
            if (touched[name]) next[name] = runValidator(name, nextForm);
            // 새 비밀번호를 바꾸면 이미 입력해둔 비밀번호 확인도 다시 검사한다.
            if (name === 'newPassword' && touched.newPasswordConfirm) {
                next.newPasswordConfirm = runValidator('newPasswordConfirm', nextForm);
            }
            return next;
        });
    };

    // 필드에서 포커스가 벗어나면 해당 필드를 touched로 표시하고 검증 결과를 반영한다.
    const handleFieldBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setFieldErrors((prev) => ({ ...prev, [name]: runValidator(name, form) }));
    };

    // 모든 필드를 한 번에 검증하고 touched로 표시한 뒤, 유효 여부를 반환한다.
    const validateAll = () => {
        const names = Object.keys(profileValidators);
        const nextErrors = {};
        names.forEach((name) => {
            nextErrors[name] = runValidator(name, form);
        });
        setFieldErrors(nextErrors);
        setTouched((prev) => ({ ...prev, ...Object.fromEntries(names.map((name) => [name, true])) }));
        return Object.values(nextErrors).every((msg) => !msg);
    };

    // 프로필 수정 폼을 열면서 이전 에러/터치 상태와 전화번호 인증 상태를 초기화한다.
    const handleStartEdit = () => {
        setSaveError(null);
        setCurrentPasswordError(null);
        setFieldErrors({});
        setTouched({});
        resetPhoneVerification();
        setEditing(true);
    };

    // 수정 폼을 닫고 폼 값과 에러 상태를 서버에서 받아온 원래 프로필 값으로 되돌린다.
    const handleCancelEdit = () => {
        setForm({
            name: profile.name ?? '',
            nickname: profile.nickname ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
            currentPassword: '',
            newPassword: '',
            newPasswordConfirm: ''
        });
        setFieldErrors({});
        setTouched({});
        setSaveError(null);
        setCurrentPasswordError(null);
        resetPhoneVerification();
        setEditing(false);
    };

    // 1단계: 지금 입력된(바뀐) 전화번호로 SMS 인증코드 발송
    const handleSendPhoneCode = async () => {
        setPhoneCodeError(null);
        setPhoneCodeInfo(null);

        const phoneError = profileValidators.phone(form.phone);
        if (phoneError) {
            setFieldErrors((prev) => ({ ...prev, phone: phoneError }));
            setTouched((prev) => ({ ...prev, phone: true }));
            return;
        }

        setSendingPhoneCode(true);
        try {
            await sendPhoneVerificationCode(form.phone);
            setPhoneCodeSent(true);
            setVerifiedPhone(null);
            setPhoneCode('');
            setPhoneCodeInfo('인증코드를 문자로 보냈어요. 5분 이내에 입력해 주세요.');
        } catch (err) {
            setPhoneCodeError(err.message);
        } finally {
            setSendingPhoneCode(false);
        }
    };

    // 2단계: 발송된 인증코드가 맞는지 저장 전에 미리 확인
    const handleVerifyPhoneCode = async () => {
        setPhoneCodeError(null);
        setPhoneCodeInfo(null);

        if (!phoneCode.trim()) {
            setPhoneCodeError('인증코드를 입력해 주세요.');
            return;
        }

        setVerifyingPhoneCode(true);
        try {
            await verifyPhoneVerificationCode(form.phone, phoneCode);
            setVerifiedPhone(form.phone);
            setPhoneCodeInfo('인증코드가 확인되었습니다.');
        } catch (err) {
            setPhoneCodeError(err.message);
        } finally {
            setVerifyingPhoneCode(false);
        }
    };

    // 폼을 검증하고(전화번호가 바뀌었으면 인증 완료 여부도 확인) 프로필을 서버에 저장한다.
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaveError(null);
        setCurrentPasswordError(null);

        if (!validateAll()) return;

        if (phoneChanged && !phoneVerified) {
            setSaveError('전화번호 인증을 먼저 완료해 주세요.');
            return;
        }

        setSaving(true);
        try {
            // eslint-disable-next-line no-unused-vars
            const { newPasswordConfirm, ...rest } = form;
            const payload = phoneChanged ? { ...rest, phoneVerificationCode: phoneCode } : rest;

            const updated = await updateMyProfile(payload);
            setProfile(updated);
            updateNickname(updated.nickname);
            setForm({ name: updated.name ?? '', nickname: updated.nickname ?? '', email: updated.email ?? '', phone: updated.phone ?? '', currentPassword: '', newPassword: '', newPasswordConfirm: '' });
            setFieldErrors({});
            setTouched({});
            resetPhoneVerification();
            setEditing(false);
            alert('수정되었습니다.');
        } catch (err) {
            // 현재 비밀번호 불일치는 상단 배너 대신, 로그인/회원가입 페이지와 동일하게
            // 해당 입력란 바로 아래에 필드 단위 경고로 보여준다.
            if (err.message === '현재 비밀번호가 일치하지 않습니다.') {
                setCurrentPasswordError(err.message);
                setTouched((prev) => ({ ...prev, currentPassword: true }));
            } else {
                setSaveError(err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    // 확인 후 회원 탈퇴를 처리하고 로그아웃하여 로그인 페이지로 이동시킨다.
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

    // 선택한 기간으로 뽀모도로 기록을 다시 조회한다.
    const handlePomodoroFilterSubmit = (e) => {
        e.preventDefault();
        fetchPomodoroRecords(pomodoroRange);
    };

    const isInstructor = profile?.role === 'INSTRUCTOR';
    const latestInstructorApplicationStatus = instructorApplications[0]?.status;
    const canApplyAsInstructor =
        !isInstructor && (instructorApplications.length === 0 || latestInstructorApplicationStatus === 'REJECTED');

    // 강사 신청 이력을 카드 목록 + 페이지네이션으로 렌더링한다.
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

    // 강사가 새 강의 등록을 신청하는 입력 폼을 렌더링한다.
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

    // 내가 등록 신청한 강의 목록을 카드 형태로 렌더링한다 (승인된 강의는 상세로 이동 가능).
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

    // 강의 등록 신청 폼의 입력값을 반영하고 해당 필드의 에러를 지운다.
    const handleLectureFormChange = (e) => {
        const { name, value } = e.target;
        setLectureForm((prev) => ({ ...prev, [name]: value }));
        setLectureFieldErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    };

    // 강의 등록 신청 폼의 필수 입력 항목이 비어있는지 검사한다.
    const validateLectureForm = () => {
        const errors = {};
        if (!lectureForm.categoryId) errors.categoryId = '카테고리를 선택해 주세요.';
        if (!lectureForm.title.trim()) errors.title = '강의명을 입력해 주세요.';
        if (!lectureForm.instructor.trim()) errors.instructor = '강사명을 입력해 주세요.';
        if (!lectureForm.lectureUrl.trim()) errors.lectureUrl = '강의 URL을 입력해 주세요.';
        if (!lectureForm.description.trim()) errors.description = '강의 설명을 입력해 주세요.';
        return errors;
    };

    // 폼을 검증한 뒤 강의 등록을 신청하고, 성공하면 신청 목록 맨 앞에 추가한다.
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
            <nav className="mypage__crumbs" aria-label="현재 위치">
                <Link to="/main">메인</Link>
                <span>/</span>
                <span className="is-current">마이페이지</span>
            </nav>
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
                                        minLength={2}
                                        value={form.nickname}
                                        onChange={handleFormChange}
                                        onBlur={handleFieldBlur}
                                        className={fieldErrors.nickname ? 'input-error' : ''}
                                        aria-invalid={!!fieldErrors.nickname}
                                    />
                                    {fieldErrors.nickname && <span className="mypage__warning-text">{fieldErrors.nickname}</span>}
                                </div>

                                <div className="mypage__input-group">
                                    <label htmlFor="email">이메일</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={form.email}
                                        onChange={handleFormChange}
                                        onBlur={handleFieldBlur}
                                        className={fieldErrors.email ? 'input-error' : ''}
                                        aria-invalid={!!fieldErrors.email}
                                    />
                                    {fieldErrors.email && <span className="mypage__warning-text">{fieldErrors.email}</span>}
                                </div>

                                <div className="mypage__input-group">
                                    <label htmlFor="phone">전화번호</label>
                                    <div className="mypage__code-row">
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="010-1234-5678"
                                            autoComplete="tel"
                                            value={form.phone}
                                            onChange={handleFormChange}
                                            onBlur={handleFieldBlur}
                                            className={fieldErrors.phone ? 'input-error' : ''}
                                            aria-invalid={!!fieldErrors.phone}
                                        />
                                        <button
                                            type="button"
                                            className="mypage__code-btn"
                                            onClick={handleSendPhoneCode}
                                            disabled={!phoneChanged || sendingPhoneCode}
                                        >
                                            {sendingPhoneCode ? '발송 중...' : phoneCodeSent ? '재발송' : '인증코드 받기'}
                                        </button>
                                    </div>
                                    {fieldErrors.phone && <span className="mypage__warning-text">{fieldErrors.phone}</span>}
                                    {!fieldErrors.phone && phoneChanged && !phoneVerified && (
                                        <span className="mypage__hint-text">번호를 바꾸려면 인증코드 확인이 필요해요.</span>
                                    )}

                                    {phoneChanged && phoneCodeSent && (
                                        <div className="mypage__code-row mypage__code-row--verify">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="인증코드 6자리"
                                                value={phoneCode}
                                                onChange={(e) => {
                                                    setPhoneCode(e.target.value);
                                                    if (verifiedPhone) setVerifiedPhone(null);
                                                }}
                                                disabled={phoneVerified}
                                            />
                                            <button
                                                type="button"
                                                className="mypage__code-btn"
                                                onClick={handleVerifyPhoneCode}
                                                disabled={verifyingPhoneCode || phoneVerified}
                                            >
                                                {verifyingPhoneCode ? '확인 중...' : phoneVerified ? '확인됨' : '인증확인'}
                                            </button>
                                        </div>
                                    )}
                                    {phoneCodeError && <span className="mypage__warning-text">{phoneCodeError}</span>}
                                    {!phoneCodeError && phoneCodeInfo && <span className="mypage__success-text">{phoneCodeInfo}</span>}
                                </div>

                                {!isSocialAccount && (
                                    <>
                                        <div className="mypage__input-group">
                                            <label htmlFor="newPassword">새 비밀번호 (선택)</label>
                                            <div className="mypage__password-wrapper">
                                                <input
                                                    id="newPassword"
                                                    name="newPassword"
                                                    type={showNewPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    minLength={8}
                                                    maxLength={72}
                                                    value={form.newPassword}
                                                    onChange={handleFormChange}
                                                    onBlur={handleFieldBlur}
                                                    className={fieldErrors.newPassword ? 'input-error' : ''}
                                                    aria-invalid={!!fieldErrors.newPassword}
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
                                            {fieldErrors.newPassword && <span className="mypage__warning-text">{fieldErrors.newPassword}</span>}
                                        </div>

                                        {form.newPassword && (
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
                                                        onBlur={handleFieldBlur}
                                                        className={fieldErrors.newPasswordConfirm ? 'input-error' : ''}
                                                        aria-invalid={!!fieldErrors.newPasswordConfirm}
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
                                                {fieldErrors.newPasswordConfirm && <span className="mypage__warning-text">{fieldErrors.newPasswordConfirm}</span>}
                                            </div>
                                        )}

                                        {/* 닉네임/이메일/전화번호/새 비밀번호 중 하나라도 바뀌었을 때만, 맨 마지막에 현재 비밀번호 확인란이 나타난다 */}
                                        {anyChanged && (
                                            <div className="mypage__input-group mypage__input-group--emphasis">
                                                <span className="mypage__hint-text">닉네임/이메일/전화번호/비밀번호 중 무엇을 바꾸든 현재 비밀번호 확인이 필요해요.</span>
                                                <label htmlFor="currentPassword">현재 비밀번호</label>
                                                <div className="mypage__password-wrapper">
                                                    <input
                                                        id="currentPassword"
                                                        name="currentPassword"
                                                        type={showCurrentPassword ? "text" : "password"}

                                                        value={form.currentPassword}
                                                        onChange={handleFormChange}
                                                        onBlur={handleFieldBlur}
                                                        className={(fieldErrors.currentPassword || currentPasswordError) ? 'input-error' : ''}
                                                        aria-invalid={!!(fieldErrors.currentPassword || currentPasswordError)}
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
                                                {fieldErrors.currentPassword && (
                                                    <span className="mypage__warning-text">{fieldErrors.currentPassword}</span>
                                                )}
                                                {!fieldErrors.currentPassword && currentPasswordError && (
                                                    <span className="mypage__warning-text">{currentPasswordError}</span>
                                                )}
                                            </div>
                                        )}
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
                                        <div className="mypage__list-header mypage__list-header--posts" aria-hidden="true">
                                            <span>번호</span>
                                            <span>제목</span>
                                            <span>작성자</span>
                                            <span>조회수</span>
                                            <span>좋아요</span>
                                            <span>작성일자</span>
                                        </div>
                                        <ul className="mypage__post-list mypage__post-list--posts">
                                            {paginate(myPosts, postsPage).map((post, index) => (
                                                <li key={post.id} className="mypage__post-item">
                                                    <Link to={`/main/community/${post.id}`} className="mypage__post-link">
                                                        <span className="mypage__post-col mypage__post-col--no">
                                                            {postsPage * PAGE_SIZE + index + 1}
                                                        </span>
                                                        <span className="mypage__post-col mypage__post-col--title">
                          <span className="mypage__post-title">
                            {post.notice && <span className="mypage__post-badge">공지</span>}
                              {post.title}
                          </span>
                                                        </span>
                                                        <span className="mypage__post-col mypage__post-col--author">
                                                            {post.authorNickname || '알 수 없는 사용자'}
                                                        </span>
                                                        <span className="mypage__post-col mypage__post-col--views">{post.viewCount ?? 0}</span>
                                                        <span className="mypage__post-col mypage__post-col--likes">{post.likeCount ?? 0}</span>
                                                        <span className="mypage__post-col mypage__post-col--date">
                                                            {post.createdAt ? post.createdAt.slice(0, 10) : ''}
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
                                        <div className="mypage__list-header mypage__list-header--comments" aria-hidden="true">
                                            <span>번호</span>
                                            <span>내용</span>
                                            <span>구분</span>
                                            <span>작성일자</span>
                                        </div>
                                        <ul className="mypage__post-list mypage__post-list--comments">
                                            {paginate(myComments, commentsPage).map((comment, index) => (
                                                <li key={comment.id} className="mypage__post-item">
                                                    <Link
                                                        to={comment.postId ? `/main/community/${comment.postId}` : `/main/lectures/${comment.lectureId}`}
                                                        className="mypage__post-link"
                                                    >
                                                        <span className="mypage__post-col mypage__post-col--no">
                                                            {commentsPage * PAGE_SIZE + index + 1}
                                                        </span>
                                                        <span className="mypage__post-col mypage__post-col--title">
                                                            <span className="mypage__post-title">{comment.content}</span>
                                                        </span>
                                                        <span className="mypage__post-col mypage__post-col--author">
                                                            {comment.postId ? '커뮤니티' : '강의'}
                                                        </span>
                                                        <span className="mypage__post-col mypage__post-col--date">
                                                            {comment.createdAt ? comment.createdAt.replace('T', ' ').slice(0, 16) : ''}
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
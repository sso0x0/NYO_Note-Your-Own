import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { createInstructorApplication, getMyInstructorApplications } from '../api/instructorApplication';
import { getCategoryList } from '../../lecture/api/category';
import './InstructorApplyPage.css';

function InstructorApplyPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [bio, setBio] = useState('');
  const [careerYears, setCareerYears] = useState('');
  const [company, setCompany] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [motivation, setMotivation] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [attachment, setAttachment] = useState(null); // { url, name }
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [latestApplication, setLatestApplication] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 회원가입 폼과 같은 방식: 필수 항목만 건드린(touched) 뒤부터 실시간 재검사하고,
  // 제출 시 한 번에 전부 검사해서 빨간 테두리 + 안내 문구로 보여준다.
  const validateField = (name, value) => {
    switch (name) {
      case 'categoryId':
        return value ? '' : '전문 분야를 선택해 주세요.';
      case 'bio':
        return value.trim() ? '' : '경력 및 소개를 입력해 주세요.';
      case 'motivation':
        return value.trim() ? '' : '신청 동기를 입력해 주세요.';
      case 'privacyConsent':
        return value ? '' : '개인정보 수집·이용에 동의해야 신청할 수 있습니다.';
      case 'attachment':
        return value ? '' : '증빙 파일을 첨부해 주세요.';
      default:
        return '';
    }
  };

  const markTouched = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const revalidateIfTouched = (name, value) => {
    if (touched[name]) setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const nextErrors = {
      categoryId: validateField('categoryId', categoryId),
      bio: validateField('bio', bio),
      motivation: validateField('motivation', motivation),
      privacyConsent: validateField('privacyConsent', privacyConsent),
      attachment: validateField('attachment', attachment),
    };
    setFieldErrors(nextErrors);
    setTouched({ categoryId: true, bio: true, motivation: true, privacyConsent: true, attachment: true });
    return Object.values(nextErrors).every((msg) => !msg);
  };

  useEffect(() => {
    let cancelled = false;

    // 이미 대기/승인 상태인 신청이 있으면 폼 대신 그 상태를 보여줘야 하므로 카테고리 목록과 함께 불러온다.
    Promise.all([getCategoryList(), getMyInstructorApplications({ size: 1 })])
      .then(([categoryList, myApplications]) => {
        if (cancelled) return;
        setCategories(categoryList ?? []);
        setLatestApplication(myApplications?.content?.[0] ?? null);
        setStatus('ready');
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

  const handleAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // 이력서/자격증 등 증빙 파일도 기존 노트·게시글 이미지와 같은 GCS 업로드 API를 그대로 재사용한다.
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `파일 업로드 실패 (HTTP ${res.status})`);
      }

      const uploaded = { url: data.imageUrl, name: data.originalName ?? file.name };
      setAttachment(uploaded);
      markTouched('attachment', uploaded);
    } catch (err) {
      setUploadError(err.message);
      markTouched('attachment', attachment);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    markTouched('attachment', null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await createInstructorApplication({
        categoryId: Number(categoryId),
        bio,
        portfolioUrl: portfolioUrl || undefined,
        careerYears: careerYears === '' ? undefined : Number(careerYears),
        company: company || undefined,
        curriculum: curriculum || undefined,
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        motivation,
        privacyConsent,
      });
      navigate('/main/mypage');
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="instructor-apply-page">
      <nav className="instructor-apply-page__crumbs" aria-label="현재 위치">
        <Link to="/main">메인</Link>
        <span>/</span>
        <Link to="/main/mypage">마이페이지</Link>
        <span>/</span>
        <span className="is-current">강사 신청</span>
      </nav>
      <h2>강사 신청</h2>
      <button
        type="button"
        className="instructor-apply-page__back"
        onClick={() => navigate('/main/mypage')}
      >
        ← 마이페이지
      </button>

      <div className="instructor-apply-page__card">
        {status === 'loading' && <p>불러오는 중...</p>}

        {status === 'error' && <p role="alert">불러오지 못했습니다: {error}</p>}

        {status === 'ready' && latestApplication?.status === 'PENDING' && (
          <div className="instructor-apply-page__status-card instructor-apply-page__status-card--pending">
            <div className="instructor-apply-page__status-head">
              <span className="instructor-apply-page__status-badge instructor-apply-page__status-badge--pending">
                심사 대기중
              </span>
              <p className="instructor-apply-page__status-msg">
                이미 심사 대기 중인 신청이 있습니다. 관리자 승인을 기다려 주세요.
              </p>
            </div>
            <dl className="instructor-apply-page__summary">
              <dt>전문 분야</dt>
              <dd>{latestApplication.categoryName}</dd>
              <dt>경력 연차</dt>
              <dd>{latestApplication.careerYears != null ? `${latestApplication.careerYears}년` : '-'}</dd>
              <dt>소속/직함</dt>
              <dd>{latestApplication.company || '-'}</dd>
              {latestApplication.attachmentUrl && (
                <>
                  <dt>첨부파일</dt>
                  <dd>
                    <a href={latestApplication.attachmentUrl} target="_blank" rel="noreferrer">
                      {latestApplication.attachmentName || '첨부파일 보기'}
                    </a>
                  </dd>
                </>
              )}
              <dt>신청일</dt>
              <dd>{latestApplication.createdAt?.slice(0, 10)}</dd>
            </dl>
          </div>
        )}

        {status === 'ready' && latestApplication?.status === 'APPROVED' && (
          <div className="instructor-apply-page__status-card instructor-apply-page__status-card--approved">
            <div className="instructor-apply-page__status-head">
              <span className="instructor-apply-page__status-badge instructor-apply-page__status-badge--approved">
                승인 완료
              </span>
              <p className="instructor-apply-page__status-msg">이미 강사로 승인된 계정입니다.</p>
            </div>
            <dl className="instructor-apply-page__summary">
              <dt>전문 분야</dt>
              <dd>{latestApplication.categoryName}</dd>
              <dt>경력 연차</dt>
              <dd>{latestApplication.careerYears != null ? `${latestApplication.careerYears}년` : '-'}</dd>
              <dt>소속/직함</dt>
              <dd>{latestApplication.company || '-'}</dd>
              <dt>경력 및 소개</dt>
              <dd className="instructor-apply-page__summary-text">{latestApplication.bio || '-'}</dd>
              <dt>신청 동기</dt>
              <dd className="instructor-apply-page__summary-text">{latestApplication.motivation || '-'}</dd>
              {latestApplication.attachmentUrl && (
                <>
                  <dt>첨부파일</dt>
                  <dd>
                    <a href={latestApplication.attachmentUrl} target="_blank" rel="noreferrer">
                      {latestApplication.attachmentName || '첨부파일 보기'}
                    </a>
                  </dd>
                </>
              )}
              <dt>신청일</dt>
              <dd>{latestApplication.createdAt?.slice(0, 10)}</dd>
              <dt>승인일</dt>
              <dd>{latestApplication.reviewedAt?.slice(0, 10) ?? '-'}</dd>
            </dl>
          </div>
        )}

        {status === 'ready' && latestApplication?.status !== 'PENDING' && latestApplication?.status !== 'APPROVED' && (
          <>
            {latestApplication?.status === 'REJECTED' && (
              <div className="instructor-apply-page__status-card instructor-apply-page__status-card--rejected">
                <div className="instructor-apply-page__status-head">
                  <span className="instructor-apply-page__status-badge instructor-apply-page__status-badge--rejected">
                    반려됨
                  </span>
                  <p className="instructor-apply-page__status-msg">
                    이전 신청이 반려되었습니다. 아래 이전 신청 내용을 참고해 보완한 뒤 다시 신청해 주세요.
                  </p>
                </div>
                <dl className="instructor-apply-page__summary">
                  <dt>전문 분야</dt>
                  <dd>{latestApplication.categoryName}</dd>
                  <dt>경력 연차</dt>
                  <dd>{latestApplication.careerYears != null ? `${latestApplication.careerYears}년` : '-'}</dd>
                  <dt>소속/직함</dt>
                  <dd>{latestApplication.company || '-'}</dd>
                  <dt>경력 및 소개</dt>
                  <dd className="instructor-apply-page__summary-text">{latestApplication.bio || '-'}</dd>
                  <dt>신청 동기</dt>
                  <dd className="instructor-apply-page__summary-text">{latestApplication.motivation || '-'}</dd>
                  <dt>신청일</dt>
                  <dd>{latestApplication.createdAt?.slice(0, 10)}</dd>
                  <dt>반려일</dt>
                  <dd>{latestApplication.reviewedAt?.slice(0, 10) ?? '-'}</dd>
                  <dt>반려 사유</dt>
                  <dd className="instructor-apply-page__summary-text instructor-apply-page__reject-reason">
                    {latestApplication.rejectReason || '-'}
                  </dd>
                </dl>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <label>
                전문 분야
                <select
                  value={categoryId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategoryId(value);
                    revalidateIfTouched('categoryId', value);
                  }}
                  onBlur={() => markTouched('categoryId', categoryId)}
                  className={fieldErrors.categoryId ? 'is-invalid' : undefined}
                >
                  <option value="">선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId && <p className="instructor-apply-page__field-error">{fieldErrors.categoryId}</p>}
              </label>

              <div className="instructor-apply-page__row">
                <label>
                  경력 연차 (선택)
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={careerYears}
                    onChange={(e) => setCareerYears(e.target.value)}
                    placeholder="예: 3"
                  />
                </label>

                <label>
                  현재 소속/직함 (선택)
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    maxLength={100}
                    placeholder="예: OO회사 백엔드 개발자"
                  />
                </label>
              </div>

              <label>
                경력 및 소개
                <textarea
                  value={bio}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBio(value);
                    revalidateIfTouched('bio', value);
                  }}
                  onBlur={() => markTouched('bio', bio)}
                  rows={6}
                  maxLength={4000}
                  placeholder="강의 가능한 분야의 경력, 이력을 소개해주세요."
                  className={fieldErrors.bio ? 'is-invalid' : undefined}
                />
                {fieldErrors.bio && <p className="instructor-apply-page__field-error">{fieldErrors.bio}</p>}
              </label>

              <label>
                신청 동기
                <textarea
                  value={motivation}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMotivation(value);
                    revalidateIfTouched('motivation', value);
                  }}
                  onBlur={() => markTouched('motivation', motivation)}
                  rows={4}
                  maxLength={2000}
                  placeholder="강사가 되고 싶은 이유, 가르치고 싶은 대상을 알려주세요."
                  className={fieldErrors.motivation ? 'is-invalid' : undefined}
                />
                {fieldErrors.motivation && <p className="instructor-apply-page__field-error">{fieldErrors.motivation}</p>}
              </label>

              <label>
                강의 계획 소개 (선택)
                <textarea
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  rows={6}
                  maxLength={4000}
                  placeholder="어떤 주제로, 어떤 커리큘럼의 강의를 만들고 싶은지 소개해주세요."
                />
              </label>

              <label>
                포트폴리오 링크 (선택)
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="블로그, GitHub, 이력서 링크 등"
                />
              </label>

              <label>
                증빙 파일 첨부 (이력서/자격증 등 · 이미지 또는 PDF)
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  onChange={handleAttachmentChange}
                  disabled={uploading}
                  className={fieldErrors.attachment ? 'is-invalid' : undefined}
                />
                {fieldErrors.attachment && <p className="instructor-apply-page__field-error">{fieldErrors.attachment}</p>}
              </label>

              {uploading && <p className="instructor-apply-page__hint">파일 업로드 중...</p>}
              {uploadError && (
                <p role="alert" className="instructor-apply-page__error">
                  {uploadError}
                </p>
              )}
              {attachment && !uploading && (
                <p className="instructor-apply-page__hint">
                  첨부됨: {attachment.name}{' '}
                  <button type="button" className="instructor-apply-page__remove-btn" onClick={handleRemoveAttachment}>
                    제거
                  </button>
                </p>
              )}

              <label className={'instructor-apply-page__consent' + (fieldErrors.privacyConsent ? ' is-invalid' : '')}>
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => {
                    const value = e.target.checked;
                    setPrivacyConsent(value);
                    markTouched('privacyConsent', value);
                  }}
                />
                (필수) 개인정보 수집·이용에 동의합니다. 제출한 경력·연락처·첨부파일은 강사 심사 목적으로만 사용됩니다.
              </label>
              {fieldErrors.privacyConsent && <p className="instructor-apply-page__field-error">{fieldErrors.privacyConsent}</p>}

              {submitError && (
                <p role="alert" className="instructor-apply-page__error">
                  {submitError}
                </p>
              )}

              <button type="submit" disabled={submitting || uploading || categories.length === 0}>
                {submitting ? '제출 중...' : '신청하기'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default InstructorApplyPage;

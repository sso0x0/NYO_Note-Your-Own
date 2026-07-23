import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyInfo, updateMyProfile, withdraw } from '../api/mypage';
import { getMyNotes, getLikedNotes } from '../../note/api/note';
import { useAuth } from '../../../context/AuthContext';
import NoteCard from '../../note/components/NoteCard';
import './MyPage.css';

const LIST_SIZE = 8;

function MyPage() {
  const { logout, updateNickname } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', phone: '', currentPassword: '', newPassword: '' });
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [myNotes, setMyNotes] = useState([]);
  const [likedNotes, setLikedNotes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    Promise.all([getMyInfo(), getMyNotes({ size: LIST_SIZE }), getLikedNotes({ size: LIST_SIZE })])
      .then(([me, mine, liked]) => {
        if (cancelled) return;
        setProfile(me);
        setForm({ name: me.name ?? '', nickname: me.nickname ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '' });
        setMyNotes(mine?.content ?? []);
        setLikedNotes(liked?.content ?? []);
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

                <label>
                  이름
                  <input name="name" value={form.name} onChange={handleFormChange} required />
                </label>
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

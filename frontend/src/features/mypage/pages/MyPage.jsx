import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyInfo, updateMyProfile, withdraw } from '../api/mypage';
import { getMyNotes, getLikedNotes } from '../../note/api/note';
import { getMyPosts } from '../../community/api/post'; // ← 경로/함수명 프로젝트에 맞게 수정
import { useAuth } from '../../../context/AuthContext';
import NoteCard from '../../note/components/NoteCard';
import PostCard from '../../community/components/PostCard'; // ← 게시판 카드 컴포넌트 경로 확인 필요
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
  const [myPosts, setMyPosts] = useState([]); // ← 추가

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);

    Promise.all([
      getMyInfo(),
      getMyNotes({ size: LIST_SIZE }),
      getLikedNotes({ size: LIST_SIZE }),
      getMyPosts({ size: LIST_SIZE }), // ← 추가
    ])
        .then(([me, mine, liked, posts]) => {
          if (cancelled) return;
          setProfile(me);
          setForm({ name: me.name ?? '', nickname: me.nickname ?? '', phone: me.phone ?? '', currentPassword: '', newPassword: '' });
          setMyNotes(mine?.content ?? []);
          setLikedNotes(liked?.content ?? []);
          setMyPosts(posts?.content ?? []); // ← 추가
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

  // ... handleFormChange, handleStartEdit, handleCancelEdit, handleSaveProfile, handleWithdraw 동일 ...

  return (
      <section className="mypage">
        <h2>마이페이지</h2>

        {status === 'loading' && <p>불러오는 중...</p>}
        {status === 'error' && <p role="alert">불러오지 못했습니다: {error}</p>}

        {status === 'success' && profile && (
            <>
              {/* 프로필 카드는 동일 */}

              <section className="mypage__section">
                <h3>내가 작성한 게시글</h3>
                {myPosts.length === 0 ? (
                    <p>작성한 게시글이 없습니다.</p>
                ) : (
                    <ul className="mypage__post-list">
                      {myPosts.map((post) => (
                          <li key={post.id} className="mypage__post-item">
                            <a href={`/community/${post.id}`} className="mypage__post-link">
                              <span className="mypage__post-title">{post.title}</span>
                              <span className="mypage__post-meta">
                        {post.createdAt} · 조회 {post.viewCount} · 댓글 {post.commentCount}
                      </span>
                            </a>
                          </li>
                      ))}
                    </ul>
                )}
              </section>

              <section className="mypage__section">
                <h3>내가 작성한 노트</h3>
                {/* 기존 동일 */}
              </section>

              <section className="mypage__section">
                <h3>내가 좋아요한 노트</h3>
                {/* 기존 동일 */}
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
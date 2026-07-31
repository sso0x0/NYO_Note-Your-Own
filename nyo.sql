-- ============================================================

-- 테이블 수: 총 17개

-- 1. users : 회원 정보
-- 2. user_sanctions : 관리자 제재 이력 (정지/탈퇴 처리)
-- 3. categories : 카테고리 (프론트/백/CS/빅데이터, 계층형 지원)
-- 4. lectures : 강의(녹화본) 정보 - 관리자만 등록
-- 5. notes : 노트 (강의별 필수, 작성자만 수정/삭제 가능)
-- 6. note_histories : 노트 수정 이력
-- 7. tags : 해시태그 마스터 (AI 자동 태깅 대상)
-- 8. note_tags : 노트-태그 매핑 (AI 추천 여부 포함)
-- 9. posts : 커뮤니티 게시글
-- 10. comments : 댓글 / 대댓글 (self-reference)
-- 11. likes : 노트/게시글/강의 공용 좋아요 (폴리모픽)
-- 12. view_logs : 조회수 중복 방지 로그 (노트/게시글/강의 공용)
-- 13. pomodoro_records : 뽀모도로 학습 타이머 기록
-- 14. chat_histories : LLM+RAG 학습 챗봇 대화 내역
-- 15. images : 노트/게시글 공용 첨부 이미지 (폴리모픽)
-- 16. reports: 노트/게시글/댓글 신고
-- 17. instructor_applications : 강사 등록 신청 (승인 전 심사용)

-- ============================================================

SELECT * FROM users;
SELECT * FROM user_sanctions;
SELECT * FROM categories;
SELECT * FROM lectures;
SELECT * FROM notes;
SELECT * FROM note_histories;
SELECT * FROM tags;
SELECT * FROM note_tags;
SELECT * FROM posts;
SELECT * FROM comments;
SELECT * FROM likes;
SELECT * FROM view_logs;
SELECT * FROM pomodoro_records;
SELECT * FROM chat_histories;
SELECT * FROM images;
SELECT * FROM reports;
SELECT * FROM instructor_applications;

-- ------------------------------------------------------------
-- 1. users : 회원 정보
-- ------------------------------------------------------------
CREATE TABLE users (
                       id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 회원 고유 PK
                       login_id        VARCHAR2(50)     NOT NULL, -- 로그인 아이디
                       password        VARCHAR2(255)    NULL,     -- 비밀번호
                       name            VARCHAR2(50)     NOT NULL, -- 사용자 본명
                       nickname        VARCHAR2(50)     NOT NULL, -- 닉네임
                       email           VARCHAR2(100)    NOT NULL, -- 이메일
                       phone           VARCHAR2(20)     NOT NULL, -- 전화번호
                       role            VARCHAR2(10)     DEFAULT 'USER' NOT NULL, -- 사용자/관리자 구분
                       status          VARCHAR2(15)     DEFAULT 'ACTIVE' NOT NULL, -- 정상/정지/탈퇴 구분
                       oauth_provider  VARCHAR2(15)     NULL, -- 소셜 로그인 제공
                       oauth_id        VARCHAR2(255)    NULL, -- 소셜 로그인 API 고유 ID값
                       withdrawn_at    DATE             NULL, -- 탈퇴한 날짜 일시 기록
                       created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 회원 가입일
                       updated_at      DATE             DEFAULT SYSDATE NOT NULL, -- 프로필 수정일

                       CONSTRAINT uk_users_login_id UNIQUE (login_id), -- 로그인 아이디 중복 가입 방지
                       CONSTRAINT uk_users_email UNIQUE (email), -- 이메일 중복 가입 방지
                       CONSTRAINT uk_users_nickname UNIQUE (nickname), -- 닉네임 중복 방지
                       CONSTRAINT uk_users_oauth UNIQUE (oauth_provider, oauth_id), -- 동일 소셜 계정 중복 가입 방지

                       CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN', 'INSTRUCTOR')), -- role 허용 값 제한
                       CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN')), -- status 허용 값 제한
                       CONSTRAINT chk_users_oauth CHECK (oauth_provider IN ('NONE', 'GOOGLE')) -- oauth_provider 허용 값 제한
);
CREATE INDEX idx_users_login_status ON users(login_id, status); -- 로그인 시 아이디+상태 조합 조회 최적화

COMMENT ON TABLE users IS '회원';
COMMENT ON COLUMN users.id IS '회원 고유 PK';
COMMENT ON COLUMN users.login_id IS '로그인 아이디';
COMMENT ON COLUMN users.password IS '비밀번호';
COMMENT ON COLUMN users.name IS '사용자 본명';
COMMENT ON COLUMN users.nickname IS '닉네임';
COMMENT ON COLUMN users.email IS '이메일';
COMMENT ON COLUMN users.phone IS '전화번호';
COMMENT ON COLUMN users.role IS '사용자/관리자 구분';
COMMENT ON COLUMN users.status IS '정상/정지/탈퇴 구분';
COMMENT ON COLUMN users.oauth_provider IS '소셜 로그인 제공';
COMMENT ON COLUMN users.oauth_id IS '소셜 로그인 API 고유 ID값';
COMMENT ON COLUMN users.withdrawn_at IS '탈퇴한 날짜 일시 기록';
COMMENT ON COLUMN users.created_at IS '회원 가입일';
COMMENT ON COLUMN users.updated_at IS '프로필 수정일';

-- ------------------------------------------------------------
-- 2. user_sanctions : 관리자 제재 이력
-- ------------------------------------------------------------
CREATE TABLE user_sanctions (
                                id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 제재 이력 PK
                                user_id         NUMBER(20) 		 NOT NULL, -- 제재 대상 회원 FK
                                admin_id        NUMBER(20) 		 NOT NULL, -- 제재를 처리한 관리자 FK
                                type            VARCHAR2(15) 	 NOT NULL, -- 경고/정지/강제 탈퇴
                                reason          VARCHAR2(500)    NOT NULL, -- 제재 처리 사유
                                start_at        DATE             DEFAULT SYSDATE NOT NULL, -- 제재 적용 시작일
                                end_at          DATE             NULL,     -- 정지 해제 예정일
                                created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 레코드 생성일
                                CONSTRAINT fk_sanction_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE, -- 제재 대상 회원 FK (회원 삭제 시 이력도 같이 삭제)
                                CONSTRAINT fk_sanction_admin FOREIGN KEY (admin_id) REFERENCES users(id), -- 제재 처리한 관리자 FK
                                CONSTRAINT chk_sanction_type CHECK (type IN ('WARNING', 'SUSPENSION', 'WITHDRAWAL')) -- type 허용 값 제한
);
CREATE INDEX idx_sanction_user ON user_sanctions(user_id); -- 회원별 제재 이력 조회 최적화
CREATE INDEX idx_sanction_end_date ON user_sanctions(end_at); -- 정지 해제 예정일 기준 배치 조회 최적화

COMMENT ON TABLE user_sanctions IS '회원 제재 이력';
COMMENT ON COLUMN user_sanctions.id IS '제재 이력 PK';
COMMENT ON COLUMN user_sanctions.user_id IS '제재 대상 회원 FK';
COMMENT ON COLUMN user_sanctions.admin_id IS '제재를 처리한 관리자 FK';
COMMENT ON COLUMN user_sanctions.type IS '경고/정지/강제 탈퇴';
COMMENT ON COLUMN user_sanctions.reason IS '제재 처리 사유';
COMMENT ON COLUMN user_sanctions.start_at IS '제재 적용 시작일';
COMMENT ON COLUMN user_sanctions.end_at IS '정지 해제 예정일';
COMMENT ON COLUMN user_sanctions.created_at IS '레코드 생성일';

-- ------------------------------------------------------------
-- 3. categories : 카테고리 (프론트/백/CS/빅데이터, 계층형 지원)
-- ------------------------------------------------------------
CREATE TABLE categories (
                            id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 카테고리 PK
                            name            VARCHAR2(100)    NOT NULL, -- 카테고리명
                            CONSTRAINT uk_category_name UNIQUE (name) -- 카테고리명 중복 방지
);
COMMENT ON TABLE categories IS '강의 카테고리';
COMMENT ON COLUMN categories.id IS '카테고리 PK';
COMMENT ON COLUMN categories.name IS '카테고리명';

-- ------------------------------------------------------------
-- 4. lectures : 강의(녹화본) 정보 - 관리자만 등록
-- ------------------------------------------------------------
CREATE TABLE lectures (
                          id                  NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 강의 PK
                          category_id         NUMBER(20) 		 NOT NULL, -- 소속 카테고리 FK
                          created_by          NUMBER(20) 		 NOT NULL, -- 등록한 관리자 FK
                          title               VARCHAR2(200)    NOT NULL, -- 강의명
                          description         CLOB             NOT NULL, -- 강의 설명
                          lecture_url         VARCHAR2(1000)   NOT NULL, -- 강의 링크
                          thumbnail_url 		VARCHAR2(1000) 	 NOT NULL, -- 강의 대표 썸네일 이미지 URL
                          review_url			VARCHAR2(1000) 	 NULL,	   -- 복습용 자료 URL (선택)
                          instructor          VARCHAR2(100)    NOT NULL, -- 강사명
                          capacity            NUMBER(10)       NULL,     -- 수강 정원 (NULL이면 무제한)
                          current_enrolled    NUMBER(10)       DEFAULT 0 NOT NULL, -- 현재 등록 인원
                          view_count          NUMBER(20)       DEFAULT 0 NOT NULL, -- 캐시된 조회수
                          like_count          NUMBER(20)       DEFAULT 0 NOT NULL, -- 캐시된 좋아요수
                          is_popular          NUMBER(1)        DEFAULT 0 NOT NULL, -- 인기 강의 여부 (0=FALSE)
                          is_deleted          NUMBER(1)        DEFAULT 0 NOT NULL, -- 관리자 삭제 여부 (0=FALSE)
                          status 				VARCHAR2(15) 	 DEFAULT 'APPROVED' NOT NULL, -- 심사 상태 (PENDING/APPROVED/REJECTED)
                          reject_reason 		CLOB,		     -- 반려 사유
                          reviewed_at 		TIMESTAMP,		 -- 심사(승인/반려) 처리 시각
                          created_at          DATE             DEFAULT SYSDATE NOT NULL, -- 등록일
                          updated_at          DATE             DEFAULT SYSDATE NOT NULL, -- 수정일
                          CONSTRAINT fk_lecture_category FOREIGN KEY (category_id) REFERENCES categories(id), -- 소속 카테고리 FK
                          CONSTRAINT fk_lecture_admin    FOREIGN KEY (created_by)  REFERENCES users(id), -- 등록한 관리자 FK
                          CONSTRAINT chk_lecture_popular  CHECK (is_popular IN (0, 1)), -- is_popular 값 제한 (0/1)
                          CONSTRAINT chk_lecture_deleted  CHECK (is_deleted IN (0, 1)) -- is_deleted 값 제한 (0/1)
);
CREATE INDEX idx_lecture_category ON lectures(category_id); -- 카테고리별 강의 목록 조회 최적화

COMMENT ON TABLE lectures IS '강의(녹화본)';
COMMENT ON COLUMN lectures.id IS '강의 PK';
COMMENT ON COLUMN lectures.category_id IS '소속 카테고리 FK';
COMMENT ON COLUMN lectures.created_by IS '등록한 관리자 FK';
COMMENT ON COLUMN lectures.title IS '강의명';
COMMENT ON COLUMN lectures.description IS '강의 설명';
COMMENT ON COLUMN lectures.lecture_url IS '강의 링크';
COMMENT ON COLUMN lectures.thumbnail_url IS '강의 대표 썸네일 이미지 URL';
COMMENT ON COLUMN lectures.review_url IS '복습용 자료 URL (선택)';
COMMENT ON COLUMN lectures.instructor IS '강사명';
COMMENT ON COLUMN lectures.capacity IS '수강 정원';
COMMENT ON COLUMN lectures.current_enrolled IS '현재 등록 인원';
COMMENT ON COLUMN lectures.view_count IS '캐시된 조회수';
COMMENT ON COLUMN lectures.like_count IS '캐시된 좋아요수';
COMMENT ON COLUMN lectures.is_popular IS '인기 강의 여부';
COMMENT ON COLUMN lectures.is_deleted IS '관리자 삭제 여부';
COMMENT ON COLUMN lectures.status IS '심사 상태 (PENDING/APPROVED/REJECTED). 관리자 등록은 즉시 APPROVED, 강사 등록 신청은 PENDING부터 시작';
COMMENT ON COLUMN lectures.reject_reason IS '반려 사유 (REJECTED 상태일 때만 값이 있음)';
COMMENT ON COLUMN lectures.reviewed_at IS '심사(승인/반려) 처리 시각';
COMMENT ON COLUMN lectures.created_at IS '등록일';
COMMENT ON COLUMN lectures.updated_at IS '수정일';

-- ------------------------------------------------------------
-- 5. notes : 노트 (강의별 필수, 작성자만 수정/삭제 가능)
-- ------------------------------------------------------------
CREATE TABLE notes (
                       id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 노트 PK
                       lecture_id      NUMBER(20) 		 NOT NULL, -- 소속 강의 FK
                       user_id         NUMBER(20) 		 NOT NULL, -- 작성자 FK
                       title           VARCHAR2(200)    NOT NULL, -- 노트 제목
                       content         CLOB             NOT NULL, -- 이미지/코드블록 포함 본문(마크다운 등)
                       thumbnail_url   VARCHAR2(1000)   NULL,     -- 노트 대표 썸네일 이미지 URL
                       view_count      NUMBER(20)       DEFAULT 0 NOT NULL, -- 캐시된 조회수
                       like_count      NUMBER(20)       DEFAULT 0 NOT NULL, -- 캐시된 좋아요수
                       is_deleted      NUMBER(1)        DEFAULT 0 NOT NULL, -- 작성자 삭제 여부 (0=FALSE, 1=TRUE)
                       created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 최초 작성일
                       updated_at      DATE             DEFAULT SYSDATE NOT NULL, -- 최종 수정일
                       CONSTRAINT fk_note_lecture FOREIGN KEY (lecture_id) REFERENCES lectures(id), -- 소속 강의 FK
                       CONSTRAINT fk_note_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE, -- 작성자 FK (회원 삭제 시 노트도 같이 삭제)
                       CONSTRAINT chk_note_deleted CHECK (is_deleted IN (0, 1)) -- is_deleted 값 제한 (0/1)
);
CREATE INDEX idx_note_lecture_latest ON notes(lecture_id, created_at DESC); -- 강의별 최신순 노트 목록 조회 최적화
CREATE INDEX idx_note_lecture_like ON notes(lecture_id, like_count DESC); -- 강의별 좋아요순 노트 목록 조회 최적화
CREATE INDEX idx_note_lecture_view ON notes(lecture_id, view_count DESC); -- 강의별 조회수순 노트 목록 조회 최적화

COMMENT ON TABLE notes IS '학습 노트';
COMMENT ON COLUMN notes.id IS '노트 PK';
COMMENT ON COLUMN notes.lecture_id IS '소속 강의 FK';
COMMENT ON COLUMN notes.user_id IS '작성자 FK';
COMMENT ON COLUMN notes.title IS '노트 제목';
COMMENT ON COLUMN notes.content IS '본문';
COMMENT ON COLUMN notes.thumbnail_url IS '노트 대표 썸네일 이미지 URL';
COMMENT ON COLUMN notes.view_count IS '캐시된 조회수';
COMMENT ON COLUMN notes.like_count IS '캐시된 좋아요수';
COMMENT ON COLUMN notes.is_deleted IS '작성자 삭제 여부';
COMMENT ON COLUMN notes.created_at IS '최초 작성일';
COMMENT ON COLUMN notes.updated_at IS '최종 수정일';

-- ------------------------------------------------------------
-- 6. note_histories : 노트 수정 이력
-- ------------------------------------------------------------
CREATE TABLE note_histories (
                                id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 수정 이력 PK
                                note_id         NUMBER(20) 		 NOT NULL, -- 대상 노트 FK
                                editor_id       NUMBER(20) 		 NOT NULL, -- 수정한 사용자 FK
                                prev_title      VARCHAR2(200)    NOT NULL, -- 수정 전 제목 스냅샷
                                prev_content    CLOB             NOT NULL, -- 수정 전 본문 스냅샷
                                edited_at       DATE             DEFAULT SYSDATE NOT NULL, -- 수정이 발생한 시각
                                CONSTRAINT fk_history_note   FOREIGN KEY (note_id)   REFERENCES notes(id) ON DELETE CASCADE, -- 대상 노트 FK (노트 삭제 시 이력도 같이 삭제)
                                CONSTRAINT fk_history_editor FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE -- 수정한 사용자 FK (회원 삭제 시 이력도 같이 삭제)
);
CREATE INDEX idx_history_note ON note_histories(note_id); -- 노트별 수정 이력 조회 최적화

COMMENT ON TABLE note_histories IS '노트 수정 이력';
COMMENT ON COLUMN note_histories.id IS '수정 이력 PK';
COMMENT ON COLUMN note_histories.note_id IS '대상 노트 FK';
COMMENT ON COLUMN note_histories.editor_id IS '수정한 사용자 FK';
COMMENT ON COLUMN note_histories.prev_title IS '수정 전 제목 스냅샷';
COMMENT ON COLUMN note_histories.prev_content IS '수정 전 본문 스냅샷';
COMMENT ON COLUMN note_histories.edited_at IS '수정이 발생한 시각';

-- ------------------------------------------------------------
-- 7. tags : 해시태그 마스터 (AI 자동 태깅 대상)
-- ------------------------------------------------------------
CREATE TABLE tags (
                      id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 태그 PK
                      name            VARCHAR2(50)     NOT NULL, -- 태그명
                      created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 생성일
                      CONSTRAINT uk_tag_name UNIQUE (name) -- 태그명 중복 방지
);
COMMENT ON TABLE tags IS '해시태그 마스터';
COMMENT ON COLUMN tags.id IS '태그 PK';
COMMENT ON COLUMN tags.name IS '태그명';
COMMENT ON COLUMN tags.created_at IS '생성일';

-- ------------------------------------------------------------
-- 8. note_tags : 노트-태그 매핑 (AI 추천 여부 포함)
-- ------------------------------------------------------------
CREATE TABLE note_tags (
                           note_id         NUMBER(20) 		 NOT NULL, -- 노트 FK
                           tag_id          NUMBER(20) 		 NOT NULL, -- 태그 FK
                           is_ai_generated NUMBER(1)        DEFAULT 0 NOT NULL, -- AI 자동 태깅 여부 (0=FALSE, 1=TRUE)
                           created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 매핑 생성일
                           CONSTRAINT pk_note_tags PRIMARY KEY (note_id, tag_id), -- 노트+태그 복합 PK (중복 매핑 방지)
                           CONSTRAINT fk_notetag_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE, -- 노트 FK (노트 삭제 시 매핑도 같이 삭제)
                           CONSTRAINT fk_notetag_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id) ON DELETE CASCADE, -- 태그 FK (태그 삭제 시 매핑도 같이 삭제)
                           CONSTRAINT chk_notetag_ai  CHECK (is_ai_generated IN (0, 1)) -- is_ai_generated 값 제한 (0/1)
);
COMMENT ON TABLE note_tags IS '노트-태그 매핑';
COMMENT ON COLUMN note_tags.note_id IS '노트 FK';
COMMENT ON COLUMN note_tags.tag_id IS '태그 FK';
COMMENT ON COLUMN note_tags.is_ai_generated IS 'AI 자동 태깅으로 생성된 태그인지 여부';
COMMENT ON COLUMN note_tags.created_at IS '매핑 생성일';

-- ------------------------------------------------------------
-- 9. posts : 커뮤니티 게시글
-- ------------------------------------------------------------
CREATE TABLE posts (
                       id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 게시글 PK
                       user_id         NUMBER(20) 		 NOT NULL, -- 작성자 FK
                       title           VARCHAR2(200)    NOT NULL, -- 게시글 제목
                       content         CLOB             NOT NULL, -- 게시글 본문
                       thumbnail_url   VARCHAR2(1000)   NULL,     -- 게시글 대표 썸네일 이미지 URL
                       view_count      NUMBER(20)       DEFAULT 0 NOT NULL, -- 캐시된 조회수
                       like_count      NUMBER(20)       DEFAULT 0 NOT NULL, -- 캐시된 좋아요수
                       is_notice 		NUMBER(1,0) 	 DEFAULT 0 NOT NULL, -- 공지글 여부 (0=FALSE, 1=TRUE)
                       is_deleted      NUMBER(1)        DEFAULT 0 NOT NULL, -- 삭제 여부 (0=FALSE, 1=TRUE)
                       created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 작성일
                       updated_at      DATE             DEFAULT SYSDATE NOT NULL, -- 수정일
                       CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 작성자 FK (회원 삭제 시 게시글도 같이 삭제)
                       CONSTRAINT chk_post_deleted CHECK (is_deleted IN (0, 1)) -- is_deleted 값 제한 (0/1)
);
CREATE INDEX idx_post_created ON posts(created_at DESC); -- 최신순 게시글 목록 조회 최적화
CREATE INDEX idx_post_like ON posts(like_count DESC); -- 좋아요순 게시글 목록 조회 최적화

COMMENT ON TABLE posts IS '커뮤니티 게시글';
COMMENT ON COLUMN posts.id IS '게시글 PK';
COMMENT ON COLUMN posts.user_id IS '작성자 FK';
COMMENT ON COLUMN posts.title IS '게시글 제목';
COMMENT ON COLUMN posts.content IS '게시글 본문';
COMMENT ON COLUMN posts.thumbnail_url IS '게시글 대표 썸네일 이미지 URL';
COMMENT ON COLUMN posts.view_count IS '캐시된 조회수';
COMMENT ON COLUMN posts.like_count IS '캐시된 좋아요수';
COMMENT ON COLUMN posts.is_notice IS '공지글 여부';
COMMENT ON COLUMN posts.is_deleted IS '삭제 여부';
COMMENT ON COLUMN posts.created_at IS '작성일';
COMMENT ON COLUMN posts.updated_at IS '수정일';

-- ------------------------------------------------------------
-- 10. comments : 댓글 / 대댓글 (self-reference)
-- ------------------------------------------------------------
CREATE TABLE comments (
                          id                  NUMBER(20) 	GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 댓글 PK
                          post_id             NUMBER(20) 	NULL, 	  -- 소속 게시글 FK
                          lecture_id 			NUMBER(20) 	NULL,     -- 소속 강의 FK (게시글 댓글이면 NULL)
                          user_id             NUMBER(20) 	NOT NULL, -- 작성자 FK
                          parent_comment_id   NUMBER(20) 	NULL,     -- 상위 댓글 FK (NULL=최상위 댓글)
                          content             CLOB       	NOT NULL, -- 댓글 내용
                          is_deleted          NUMBER(1)  	DEFAULT 0 NOT NULL, -- 삭제 여부 (0=FALSE, 1=TRUE)
                          created_at          DATE       	DEFAULT SYSDATE NOT NULL, -- 작성일
                          updated_at          DATE       	DEFAULT SYSDATE NOT NULL, -- 수정일
                          CONSTRAINT fk_comment_post   FOREIGN KEY (post_id)  REFERENCES posts(id) ON DELETE CASCADE, -- 소속 게시글 FK (게시글 삭제 시 댓글도 같이 삭제)
                          CONSTRAINT fk_comment_user   FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE, -- 작성자 FK (회원 삭제 시 댓글도 같이 삭제)
                          CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE, -- 상위 댓글 FK (부모 삭제 시 대댓글도 같이 삭제)
                          CONSTRAINT fk_comment_lecture FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE, -- 소속 강의 FK (강의 삭제 시 댓글도 같이 삭제)
                          CONSTRAINT chk_comment_deleted CHECK (is_deleted IN (0, 1)), -- is_deleted 값 제한 (0/1)
                          CONSTRAINT chk_comment_target CHECK ((post_id IS NOT NULL AND lecture_id IS NULL) OR (post_id IS NULL AND lecture_id IS NOT NULL))
    -- post_id/lecture_id 중 정확히 하나만 채워지도록 강제
);
CREATE INDEX idx_comment_post ON comments(post_id); -- 게시글별 댓글 조회 최적화
CREATE INDEX idx_comment_parent ON comments(parent_comment_id); -- 대댓글(자식 댓글) 조회 최적화
CREATE INDEX idx_comment_lecture ON comments(lecture_id); -- 강의별 댓글 조회 최적화

COMMENT ON TABLE comments IS '댓글/대댓글';
COMMENT ON COLUMN comments.id IS '댓글 PK';
COMMENT ON COLUMN comments.post_id IS '소속 게시글 FK (강의 댓글이면 NULL)';
COMMENT ON COLUMN comments.lecture_id IS '소속 강의 FK (게시글 댓글이면 NULL)';
COMMENT ON COLUMN comments.user_id IS '작성자 FK';
COMMENT ON COLUMN comments.parent_comment_id IS '상위 댓글 FK';
COMMENT ON COLUMN comments.content IS '댓글 내용';
COMMENT ON COLUMN comments.is_deleted IS '삭제 여부';
COMMENT ON COLUMN comments.created_at IS '작성일';
COMMENT ON COLUMN comments.updated_at IS '수정일';

-- ------------------------------------------------------------
-- 11. likes : 노트/게시글/강의 공용 좋아요 (폴리모픽)
-- ------------------------------------------------------------
CREATE TABLE likes (
                       id              NUMBER(20) 		GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 좋아요 PK
                       user_id         NUMBER(20) 		NOT NULL, -- 좋아요를 누른 회원 FK
                       target_type     VARCHAR2(10) 	NOT NULL, -- 좋아요 대상 종류 ('NOTE', 'POST', 'LECTURE')
                       target_id       NUMBER(20) 		NOT NULL, -- 대상 PK
                       created_at      DATE       		DEFAULT SYSDATE NOT NULL, -- 좋아요 누른 시각
                       CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 좋아요를 누른 회원 FK (회원 삭제 시 좋아요도 같이 삭제)
                       CONSTRAINT uk_like_target UNIQUE (user_id, target_type, target_id), -- 동일 대상 중복 좋아요 방지
                       CONSTRAINT chk_like_type CHECK (target_type IN ('NOTE', 'POST', 'LECTURE', 'ENROLL')) -- target_type 허용 값 제한
);
CREATE INDEX idx_like_target ON likes(target_type, target_id); -- 대상별 좋아요 수 집계/조회 최적화

COMMENT ON TABLE likes IS '좋아요 (노트/게시글/강의 공용) 및 강의 수강신청 겸용';
COMMENT ON COLUMN likes.id IS '좋아요 PK';
COMMENT ON COLUMN likes.user_id IS '좋아요를 누른 회원 FK';
COMMENT ON COLUMN likes.target_type IS '좋아요 대상 종류';
COMMENT ON COLUMN likes.target_id IS '대상 PK';
COMMENT ON COLUMN likes.created_at IS '좋아요 누른 시각';

-- ------------------------------------------------------------
-- 12. view_logs : 조회수 중복 방지 로그 (노트/게시글/강의 공용)
-- ------------------------------------------------------------
CREATE TABLE view_logs (
                           id              NUMBER(20) 		GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 조회 로그 PK
                           user_id         NUMBER(20) 		NULL, -- 조회한 회원 FK (비로그인은 NULL)
                           target_type     VARCHAR2(10) 	NOT NULL, -- 조회 대상 종류 ('NOTE', 'POST', 'LECTURE')
                           target_id       NUMBER(20) 		NOT NULL, -- 대상 PK
                           viewed_date     DATE       		NOT NULL, -- 조회한 날짜
                           created_at      DATE       		DEFAULT SYSDATE NOT NULL, -- 로그 생성 시각
                           CONSTRAINT fk_viewlog_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL, -- 조회한 회원 FK (회원 삭제 시 user_id만 NULL 처리, 로그는 유지)
                           CONSTRAINT chk_viewlog_type CHECK (target_type IN ('NOTE', 'POST', 'LECTURE')) -- target_type 허용 값 제한
);
CREATE INDEX idx_viewlog_target ON view_logs(target_type, target_id); -- 대상별 조회 로그 조회(중복 방지 체크) 최적화

COMMENT ON TABLE view_logs IS '조회수 중복 방지 로그';
COMMENT ON COLUMN view_logs.id IS '조회 로그 PK';
COMMENT ON COLUMN view_logs.user_id IS '조회한 회원 FK';
COMMENT ON COLUMN view_logs.target_type IS '조회 대상 종류';
COMMENT ON COLUMN view_logs.target_id IS '대상 PK';
COMMENT ON COLUMN view_logs.viewed_date IS '조회한 날짜';
COMMENT ON COLUMN view_logs.created_at IS '로그 생성 시각';

SELECT * FROM view_logs;

-- ------------------------------------------------------------
-- 13. pomodoro_records : 뽀모도로 학습 타이머 기록
-- ------------------------------------------------------------
CREATE TABLE pomodoro_records (
                                  id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 타이머 기록 PK
                                  user_id         NUMBER(20) 		 NOT NULL, -- 기록 주체 회원 FK
                                  lecture_id      NUMBER(20) 		 NULL, -- 강의 FK
                                  note_id         NUMBER(20) 		 NULL, -- 노트 FK
                                  focus_minutes   NUMBER(10)       DEFAULT 25 NOT NULL, -- 집중 시간(분)
                                  break_minutes   NUMBER(10)       DEFAULT 5 NOT NULL,  -- 휴식 시간(분)
                                  started_at      DATE             NOT NULL, -- 타이머 시작 시각
                                  ended_at        DATE             NULL,     -- 타이머 종료 시각
                                  record_date     DATE             NOT NULL, -- 통계 집계용 날짜
                                  created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 레코드 생성 시각
                                  CONSTRAINT fk_pomodoro_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE, -- 기록 주체 회원 FK (회원 삭제 시 기록도 같이 삭제)
                                  CONSTRAINT fk_pomodoro_lecture FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE SET NULL, -- 강의 FK (강의 삭제 시 lecture_id만 NULL 처리)
                                  CONSTRAINT fk_pomodoro_note    FOREIGN KEY (note_id)    REFERENCES notes(id) ON DELETE SET NULL -- 노트 FK (노트 삭제 시 note_id만 NULL 처리)
);
CREATE INDEX idx_pomodoro_user_date ON pomodoro_records(user_id, record_date); -- 회원별 날짜별 뽀모도로 기록 조회 최적화

COMMENT ON TABLE pomodoro_records IS '뽀모도로 학습 타이머 기록';
COMMENT ON COLUMN pomodoro_records.id IS '타이머 기록 PK';
COMMENT ON COLUMN pomodoro_records.user_id IS '기록 주체 회원 FK';
COMMENT ON COLUMN pomodoro_records.lecture_id IS '강의 FK';
COMMENT ON COLUMN pomodoro_records.note_id IS '노트 FK';
COMMENT ON COLUMN pomodoro_records.focus_minutes IS '집중 시간(분)';
COMMENT ON COLUMN pomodoro_records.break_minutes IS '휴식 시간(분)';
COMMENT ON COLUMN pomodoro_records.started_at IS '타이머 시작 시각';
COMMENT ON COLUMN pomodoro_records.ended_at IS '타이머 종료 시각';
COMMENT ON COLUMN pomodoro_records.record_date IS '통계 집계용 날짜';
COMMENT ON COLUMN pomodoro_records.created_at IS '레코드 생성 시각';

-- ------------------------------------------------------------
-- 14. chat_histories : LLM+RAG 학습 챗봇 대화 내역
-- ------------------------------------------------------------
CREATE TABLE chat_histories (
                                id              NUMBER(20) 		GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 챗봇 대화 PK
                                user_id         NUMBER(20) 		NOT NULL, -- 질문한/답변받는 회원 FK
                                lecture_id      NUMBER(20) 		NULL,     -- 질문의 맥락이 된 관련 강의 FK (선택)
                                root_question_id NUMBER(20) 	NULL,     -- 어떤 질문이 다른 대화를 이어서 한건지 표시
                                sender_role     VARCHAR2(15) 	NOT NULL, -- 발신자 구분 ('USER', 'ASSISTANT')
                                message         CLOB       		NOT NULL, -- 질문 및 답변 내용 (텍스트/마크다운)
                                created_at      DATE       		DEFAULT SYSDATE NOT NULL, -- 대화 발생 시각
                                recommended_lecture_ids VARCHAR2(200), -- AI가 추천한 강의 ID 목록 (콤마 구분 문자열)
                                CONSTRAINT fk_chat_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE, -- 질문한/답변받는 회원 FK (회원 삭제 시 대화 내역도 같이 삭제)
                                CONSTRAINT fk_chat_lecture FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE SET NULL, -- 관련 강의 FK (강의 삭제 시 lecture_id만 NULL 처리)
                                CONSTRAINT chk_chat_role   CHECK (sender_role IN ('USER', 'ASSISTANT')) -- sender_role 허용 값 제한
);
-- 사용자별, 강의별 대화 내역 조회가 빈번할 것이므로 복합 인덱스 추가
CREATE INDEX idx_chat_user_lecture ON chat_histories(user_id, lecture_id, created_at); -- 회원별/강의별 대화 내역 조회 최적화

COMMENT ON TABLE chat_histories IS '챗봇 대화 내역';
COMMENT ON COLUMN chat_histories.id IS '챗봇 대화 PK';
COMMENT ON COLUMN chat_histories.user_id IS '질문한/답변받는 회원 FK';
COMMENT ON COLUMN chat_histories.lecture_id IS '질문의 맥락이 된 관련 강의 FK';
COMMENT ON COLUMN chat_histories.root_question_id IS '어떤 질문이 다른 대화를 이어서 한건지 표시';
COMMENT ON COLUMN chat_histories.sender_role IS '발신자 구분';
COMMENT ON COLUMN chat_histories.message IS '질문 및 답변 내용';
COMMENT ON COLUMN chat_histories.created_at IS '대화 발생 시각';
COMMENT ON COLUMN chat_histories.recommended_lecture_ids IS 'AI가 추천한 강의 ID 목록';

-- ------------------------------------------------------------
-- 15. images : 노트/게시글 공용 첨부 이미지 (폴리모픽)
-- ------------------------------------------------------------
CREATE TABLE images (
                        id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 이미지 PK
                        note_id         NUMBER(20)       NULL,     -- 소속 노트 FK (게시글 이미지면 NULL)
                        post_id         NUMBER(20)       NULL, 	   -- 소속 게시글 FK (노트 이미지면 NULL)
                        image_url       VARCHAR2(1000)   NOT NULL, -- 이미지 저장 URL
                        original_name   VARCHAR2(255)    NULL,     -- 업로드 원본 파일명
                        file_size       NUMBER(20)       NULL,     -- 파일 크기(byte)
                        display_order   NUMBER(5)        DEFAULT 0 NOT NULL, -- 노출 순서
                        created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 업로드 시각
                        CONSTRAINT fk_image_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE, -- 소속 노트 FK (노트 삭제 시 이미지도 같이 삭제)
                        CONSTRAINT fk_image_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, -- 소속 게시글 FK (게시글 삭제 시 이미지도 같이 삭제)
    -- 둘 중 정확히 하나만 채워지도록 강제
                        CONSTRAINT chk_image_target CHECK (
                            (note_id IS NOT NULL AND post_id IS NULL) OR
                            (note_id IS NULL AND post_id IS NOT NULL)
                            )
);
CREATE INDEX idx_image_note ON images(note_id); -- 노트별 첨부 이미지 조회 최적화
CREATE INDEX idx_image_post ON images(post_id); -- 게시글별 첨부 이미지 조회 최적화

COMMENT ON TABLE images IS '노트/게시글 공용 첨부 이미지';
COMMENT ON COLUMN images.id IS '이미지 PK';
COMMENT ON COLUMN images.note_id IS '소속 노트 FK';
COMMENT ON COLUMN images.post_id IS '소속 게시글 FK';
COMMENT ON COLUMN images.image_url IS '이미지 저장 URL';
COMMENT ON COLUMN images.original_name IS '업로드 원본 파일명';
COMMENT ON COLUMN images.file_size IS '파일 크기(byte)';
COMMENT ON COLUMN images.display_order IS '노출 순서';
COMMENT ON COLUMN images.created_at IS '업로드 시각';

-- ------------------------------------------------------------
-- 16. reports : 노트/게시글/댓글 신고
-- ------------------------------------------------------------

CREATE TABLE reports (
                         id 				NUMBER 			GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 신고 고유 번호 PK
                         reporter_id 	NUMBER 			NOT NULL, -- 신고한 사용자 ID
                         target_type 	VARCHAR2(20) 	NOT NULL, -- 신고 대상 종류(NOTE, POST, COMMENT)
                         target_id 		NUMBER 			NOT NULL, -- 신고 대상의 고유 ID
                         reason 			VARCHAR2(1000) 	NOT NULL, -- 사용자가 입력한 신고 사유
                         status 			VARCHAR2(20) 	DEFAULT 'PENDING' NOT NULL, -- 관리자 확인 상태(PENDING, REVIEWED)
                         created_at 		TIMESTAMP 		DEFAULT CURRENT_TIMESTAMP NOT NULL, -- 신고 접수 일시
                         updated_at 		TIMESTAMP 		DEFAULT CURRENT_TIMESTAMP NOT NULL, -- 신고 상태 수정 일시
                         CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id), -- 신고한 사용자 FK
                         CONSTRAINT ck_reports_target_type CHECK (target_type IN ('NOTE', 'POST', 'COMMENT')), -- target_type 허용 값 제한
                         CONSTRAINT ck_reports_status CHECK (status IN ('PENDING', 'REVIEWED')), -- status 허용 값 제한
                         CONSTRAINT uk_reports_reporter_target UNIQUE (reporter_id, target_type, target_id) -- 동일 사용자의 동일 대상 중복 신고 방지
);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC); -- 최신순 신고 목록 조회 최적화
CREATE INDEX idx_reports_target ON reports(target_type, target_id); -- 대상별 신고 내역 조회 최적화

COMMENT ON TABLE reports IS '노트, 게시글, 댓글 신고 이력';
COMMENT ON COLUMN reports.id IS '신고 고유 번호 PK';
COMMENT ON COLUMN reports.reporter_id IS '신고한 사용자 ID';
COMMENT ON COLUMN reports.target_type IS '신고 대상 종류(NOTE, POST, COMMENT)';
COMMENT ON COLUMN reports.target_id IS '신고 대상의 고유 ID';
COMMENT ON COLUMN reports.reason IS '사용자가 입력한 신고 사유';
COMMENT ON COLUMN reports.status IS '관리자 확인 상태(PENDING, REVIEWED)';
COMMENT ON COLUMN reports.created_at IS '신고 접수 일시';
COMMENT ON COLUMN reports.updated_at IS '신고 상태 수정 일시';

-- ------------------------------------------------------------
-- 17. instructor_applications : 강사 등록 신청 (승인 전 심사용)
-- ------------------------------------------------------------
CREATE TABLE instructor_applications (
                                         id              NUMBER(20) 		 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 신청 PK
                                         user_id         NUMBER(20) 		 NOT NULL, -- 신청한 회원 FK
                                         category_id     NUMBER(20) 		 NOT NULL, -- 신청 전문 분야(카테고리) FK
                                         bio             CLOB             NOT NULL, -- 경력/소개
                                         portfolio_url   VARCHAR2(1000)   NULL,     -- 포트폴리오/깃허브 등 증빙 링크
                                         career_years    NUMBER(3)        NULL,     -- 경력 연차
                                         company         VARCHAR2(100)    NULL,     -- 현재 소속/직함
                                         curriculum      CLOB             NULL,     -- 강의하고 싶은 내용/커리큘럼 소개
                                         attachment_url  VARCHAR2(1000)   NOT NULL, -- 첨부파일(이력서/자격증 등) URL (GCS)
                                         attachment_name VARCHAR2(255)    NULL,     -- 첨부파일 원본 파일명
                                         motivation      CLOB             NOT NULL, -- 신청 동기
                                         privacy_consent NUMBER(1)        DEFAULT 0 NOT NULL, -- 개인정보 수집·이용 동의 여부 (0=FALSE, 1=TRUE)
                                         status          VARCHAR2(15)     DEFAULT 'PENDING' NOT NULL, -- 심사 상태
                                         reviewed_by     NUMBER(20)       NULL,     -- 승인/반려 처리한 관리자 FK
                                         reviewed_at     DATE             NULL,     -- 심사 처리 시각
                                         created_at      DATE             DEFAULT SYSDATE NOT NULL, -- 신청 접수일
                                         updated_at      DATE             DEFAULT SYSDATE NOT NULL, -- 레코드 수정일 (BaseEntity 공통 필드)
                                         reject_reason   CLOB,            -- 반려 사유
                                         CONSTRAINT fk_instapp_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE, -- 신청한 회원 FK (회원 삭제 시 신청 내역도 같이 삭제)
                                         CONSTRAINT fk_instapp_category FOREIGN KEY (category_id) REFERENCES categories(id), -- 신청 전문 분야(카테고리) FK
                                         CONSTRAINT fk_instapp_admin    FOREIGN KEY (reviewed_by) REFERENCES users(id), -- 승인/반려 처리한 관리자 FK
                                         CONSTRAINT chk_instapp_status  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')), -- status 허용 값 제한
                                         CONSTRAINT chk_instapp_consent CHECK (privacy_consent IN (0, 1)) -- privacy_consent 값 제한 (0/1)
);
CREATE INDEX idx_instapp_status ON instructor_applications(status); -- 심사 상태별 신청 목록 조회 최적화
CREATE INDEX idx_instapp_user ON instructor_applications(user_id); -- 회원별 신청 이력 조회 최적화

COMMENT ON TABLE instructor_applications IS '강사 등록 신청 및 심사 이력';
COMMENT ON COLUMN instructor_applications.id IS '신청 PK';
COMMENT ON COLUMN instructor_applications.user_id IS '신청한 회원 FK';
COMMENT ON COLUMN instructor_applications.category_id IS '신청 전문 분야(카테고리) FK';
COMMENT ON COLUMN instructor_applications.bio IS '경력/소개';
COMMENT ON COLUMN instructor_applications.portfolio_url IS '포트폴리오/깃허브 등 증빙 링크';
COMMENT ON COLUMN instructor_applications.career_years IS '경력 연차';
COMMENT ON COLUMN instructor_applications.company IS '현재 소속/직함';
COMMENT ON COLUMN instructor_applications.curriculum IS '강의하고 싶은 내용/커리큘럼 소개';
COMMENT ON COLUMN instructor_applications.attachment_url IS '첨부파일(이력서/자격증 등) URL (GCS)';
COMMENT ON COLUMN instructor_applications.attachment_name IS '첨부파일 원본 파일명';
COMMENT ON COLUMN instructor_applications.motivation IS '신청 동기';
COMMENT ON COLUMN instructor_applications.privacy_consent IS '개인정보 수집·이용 동의 여부';
COMMENT ON COLUMN instructor_applications.status IS '심사 상태(PENDING/APPROVED/REJECTED)';
COMMENT ON COLUMN instructor_applications.reviewed_by IS '승인/반려 처리한 관리자 FK';
COMMENT ON COLUMN instructor_applications.reviewed_at IS '심사 처리 시각';
COMMENT ON COLUMN instructor_applications.created_at IS '신청 접수일';
COMMENT ON COLUMN instructor_applications.updated_at IS '레코드 수정일';
COMMENT ON COLUMN instructor_applications.reject_reason IS '반려 사유';


-- ============================================================

-- 카테고리 데이터 삽입
INSERT INTO categories (name) VALUES ('프론트엔드');
INSERT INTO categories (name) VALUES ('백엔드');
INSERT INTO categories (name) VALUES ('CS');
INSERT INTO categories (name) VALUES ('빅데이터');

-- ============================================================

-- ============================================================
-- NYO 프로젝트 시연용 더미데이터 (50건 규모로 축소 + 중복 콘텐츠 제거)
-- 원본(100건 규모) 대비 변경 사항:
--   - users: 정회원 관리자 1명(admin/1234) + 일반 회원 49명 = 50명
--   - 회원 가입일(created_at): 7월 마지막주(07-27)~오늘(08-04) 사이로 분산 (관리자 대시보드 가입 추이 확인용)
--   - lectures: 동일 유튜브 영상이 여러 강의로 중복 등장하던 것을 제거하고 실제 영상 기준 31건만 유지
--   - 인기 강의(is_popular=1)는 카테고리별로 나누어 총 10건 고정
--   - notes/posts: 완전히 새로 작성한 문구로 중복 문장 제거
--   - notes: 500~1000자, 코드블럭+본문 텍스트로 구성. 40건은 실제 위키미디어 이미지 삽입(본문+썸네일 URL 동일),
--     10건만 이미지 없음. images 테이블도 이 40건과 1:1로 대응됨
--   - comments: 강의/게시글 각각의 실제 주제에 맞는 반응으로 작성, 반말/존댓말 절반씩 혼합
--   - view_count는 2000 이하, like_count는 회원수(49~50명) 규모에 맞게 축소
--   - reports는 10건만 남기고, 신고 사유와 실제 대상 콘텐츠(댓글/노트/게시글)가 서로 일치하도록 재작성
-- ============================================================

-- ------------------------------------------------------------
-- 1. users (49명 + admin 1명 = 50명)
-- ------------------------------------------------------------
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user001', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '이지우', '즐거운너구리1', 'user001@nyotest.com', '010-2001-3001', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 8, SYSDATE - 7);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user002', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '박예은', '열심히하는펭귄2', 'user002@nyotest.com', '010-2002-3002', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-2', NULL, SYSDATE - 8, SYSDATE - 7);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user003', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '최지훈', '성실한공부벌레3', 'user003@nyotest.com', '010-2003-3003', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 7, SYSDATE - 6);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user004', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '정서준', '똑똑한너구리4', 'user004@nyotest.com', '010-2004-3004', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 7, SYSDATE - 6);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user005', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '강채원', '빠른펭귄5', 'user005@nyotest.com', '010-2005-3005', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-5', NULL, SYSDATE - 7, SYSDATE - 6);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user006', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '조소율', '조용한공부벌레6', 'user006@nyotest.com', '010-2006-3006', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 6, SYSDATE - 5);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user007', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '윤도현', '활발한너구리7', 'user007@nyotest.com', '010-2007-3007', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 6, SYSDATE - 5);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user008', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '장수빈', '차분한펭귄8', 'user008@nyotest.com', '010-2008-3008', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-8', NULL, SYSDATE - 6, SYSDATE - 5);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user009', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '임예준', '용감한공부벌레9', 'user009@nyotest.com', '010-2009-3009', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 6, SYSDATE - 5);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user010', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '한준서', '느긋한너구리10', 'user010@nyotest.com', '010-2010-3010', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 5, SYSDATE - 4);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user011', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '오지우', '성장하는펭귄11', 'user011@nyotest.com', '010-2011-3011', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-11', NULL, SYSDATE - 5, SYSDATE - 4);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user012', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '서예은', '꾸준한공부벌레12', 'user012@nyotest.com', '010-2012-3012', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 5, SYSDATE - 4);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user013', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '신지훈', '반짝이는너구리13', 'user013@nyotest.com', '010-2013-3013', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 5, SYSDATE - 4);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user014', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '권서준', '씩씩한펭귄14', 'user014@nyotest.com', '010-2014-3014', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-14', NULL, SYSDATE - 5, SYSDATE - 4);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user015', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '황채원', '행복한공부벌레15', 'user015@nyotest.com', '010-2015-3015', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user016', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '안소율', '즐거운너구리16', 'user016@nyotest.com', '010-2016-3016', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user017', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '송도현', '열심히하는펭귄17', 'user017@nyotest.com', '010-2017-3017', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-17', NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user018', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '전수빈', '성실한공부벌레18', 'user018@nyotest.com', '010-2018-3018', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user019', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '홍예준', '똑똑한너구리19', 'user019@nyotest.com', '010-2019-3019', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user020', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '김준서', '빠른펭귄20', 'user020@nyotest.com', '010-2020-3020', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-20', NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user021', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '이지우', '조용한공부벌레21', 'user021@nyotest.com', '010-2021-3021', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 4, SYSDATE - 3);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user022', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '박예은', '활발한너구리22', 'user022@nyotest.com', '010-2022-3022', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user023', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '최지훈', '차분한펭귄23', 'user023@nyotest.com', '010-2023-3023', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-23', NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user024', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '정서준', '용감한공부벌레24', 'user024@nyotest.com', '010-2024-3024', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user025', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '강채원', '느긋한너구리25', 'user025@nyotest.com', '010-2025-3025', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user026', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '조소율', '성장하는펭귄26', 'user026@nyotest.com', '010-2026-3026', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-26', NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user027', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '윤도현', '꾸준한공부벌레27', 'user027@nyotest.com', '010-2027-3027', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user028', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '장수빈', '반짝이는너구리28', 'user028@nyotest.com', '010-2028-3028', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user029', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '임예준', '씩씩한펭귄29', 'user029@nyotest.com', '010-2029-3029', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-29', NULL, SYSDATE - 3, SYSDATE - 2);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user030', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '한준서', '행복한공부벌레30', 'user030@nyotest.com', '010-2030-3030', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user031', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '오지우', '즐거운너구리31', 'user031@nyotest.com', '010-2031-3031', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user032', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '서예은', '열심히하는펭귄32', 'user032@nyotest.com', '010-2032-3032', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-32', NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user033', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '신지훈', '성실한공부벌레33', 'user033@nyotest.com', '010-2033-3033', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user034', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '권서준', '똑똑한너구리34', 'user034@nyotest.com', '010-2034-3034', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user035', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '황채원', '빠른펭귄35', 'user035@nyotest.com', '010-2035-3035', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-35', NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user036', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '안소율', '조용한공부벌레36', 'user036@nyotest.com', '010-2036-3036', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user037', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '송도현', '활발한너구리37', 'user037@nyotest.com', '010-2037-3037', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user038', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '전수빈', '차분한펭귄38', 'user038@nyotest.com', '010-2038-3038', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-38', NULL, SYSDATE - 2, SYSDATE - 1);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user039', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '홍예준', '용감한공부벌레39', 'user039@nyotest.com', '010-2039-3039', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 1, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user040', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '김준서', '느긋한너구리40', 'user040@nyotest.com', '010-2040-3040', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 1, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user041', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '이지우', '성장하는펭귄41', 'user041@nyotest.com', '010-2041-3041', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-41', NULL, SYSDATE - 1, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user042', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '박예은', '꾸준한공부벌레42', 'user042@nyotest.com', '010-2042-3042', 'INSTRUCTOR', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 1, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user043', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '최지훈', '반짝이는너구리43', 'user043@nyotest.com', '010-2043-3043', 'USER', 'SUSPENDED', NULL, NULL, NULL, SYSDATE - 1, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user044', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '정서준', '씩씩한펭귄44', 'user044@nyotest.com', '010-2044-3044', 'USER', 'SUSPENDED', 'GOOGLE', 'google-uid-44', NULL, SYSDATE - 1, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user045', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '강채원', '행복한공부벌레45', 'user045@nyotest.com', '010-2045-3045', 'USER', 'SUSPENDED', NULL, NULL, NULL, SYSDATE, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user046', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '조소율', '즐거운너구리46', 'user046@nyotest.com', '010-2046-3046', 'USER', 'ACTIVE', NULL, NULL, NULL, SYSDATE, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user047', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '윤도현', '열심히하는펭귄47', 'user047@nyotest.com', '010-2047-3047', 'USER', 'ACTIVE', 'GOOGLE', 'google-uid-47', NULL, SYSDATE, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user048', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '장수빈', '성실한공부벌레48', 'user048@nyotest.com', '010-2048-3048', 'USER', 'WITHDRAWN', NULL, NULL, SYSDATE - 0, SYSDATE, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('user049', '$2b$10$LMJ9X1MQF0/9wdSNmm1B1.QCwKI5/hsXLFLvfZ4gZGMGXe/.EJuGa', '임예준', '똑똑한너구리49', 'user049@nyotest.com', '010-2049-3049', 'USER', 'WITHDRAWN', NULL, NULL, SYSDATE - 0, SYSDATE, SYSDATE);
INSERT INTO users (login_id, password, name, nickname, email, phone, role, status, oauth_provider, oauth_id, withdrawn_at, created_at, updated_at) VALUES ('admin', '$2b$10$e4b3mQ71ZfkiMXmCzEFBJubi/ZdjvLCTsXPztl7u21sE6kIDDZ/TO', 'admin', 'admin', 'admin@admin.com', '010-5737-6810', 'ADMIN', 'ACTIVE', NULL, NULL, NULL, SYSDATE - 400, SYSDATE - 5);

-- ------------------------------------------------------------
-- 2. user_sanctions (20건)
-- ------------------------------------------------------------
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (1, 50, 'WARNING', '게시글 도배성 작성', SYSDATE - 10, NULL, SYSDATE - 10);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (2, 50, 'WARNING', '타 회원 비방', SYSDATE - 21, NULL, SYSDATE - 21);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (3, 50, 'SUSPENSION', '반복적인 신고 누적으로 인한 7일 정지', SYSDATE - 32, SYSDATE - 25, SYSDATE - 32);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (4, 50, 'WARNING', '부적절한 댓글 작성', SYSDATE - 43, NULL, SYSDATE - 43);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (5, 50, 'WARNING', '광고성 게시글 작성', SYSDATE - 54, NULL, SYSDATE - 54);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (6, 50, 'WITHDRAWAL', '악성 스팸 계정으로 판단되어 강제 탈퇴 처리', SYSDATE - 65, SYSDATE - 58, SYSDATE - 65);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (7, 50, 'WARNING', '게시글 도배성 작성', SYSDATE - 76, NULL, SYSDATE - 76);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (8, 50, 'WARNING', '타 회원 비방', SYSDATE - 87, NULL, SYSDATE - 87);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (9, 50, 'SUSPENSION', '반복적인 신고 누적으로 인한 7일 정지', SYSDATE - 98, SYSDATE - 91, SYSDATE - 98);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (10, 50, 'WARNING', '부적절한 댓글 작성', SYSDATE - 109, NULL, SYSDATE - 109);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (11, 50, 'WARNING', '광고성 게시글 작성', SYSDATE - 120, NULL, SYSDATE - 120);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (12, 50, 'WITHDRAWAL', '악성 스팸 계정으로 판단되어 강제 탈퇴 처리', SYSDATE - 131, SYSDATE - 124, SYSDATE - 131);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (13, 50, 'WARNING', '게시글 도배성 작성', SYSDATE - 142, NULL, SYSDATE - 142);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (14, 50, 'WARNING', '타 회원 비방', SYSDATE - 153, NULL, SYSDATE - 153);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (15, 50, 'SUSPENSION', '반복적인 신고 누적으로 인한 7일 정지', SYSDATE - 164, SYSDATE - 157, SYSDATE - 164);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (16, 50, 'WARNING', '부적절한 댓글 작성', SYSDATE - 175, NULL, SYSDATE - 175);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (17, 50, 'WARNING', '광고성 게시글 작성', SYSDATE - 186, NULL, SYSDATE - 186);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (18, 50, 'WITHDRAWAL', '악성 스팸 계정으로 판단되어 강제 탈퇴 처리', SYSDATE - 197, SYSDATE - 190, SYSDATE - 197);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (19, 50, 'WARNING', '게시글 도배성 작성', SYSDATE - 208, NULL, SYSDATE - 208);
INSERT INTO user_sanctions (user_id, admin_id, type, reason, start_at, end_at, created_at) VALUES (20, 50, 'WARNING', '타 회원 비방', SYSDATE - 219, NULL, SYSDATE - 219);

-- ------------------------------------------------------------
-- 4. lectures (31건, 동일 유튜브 영상 중복 제거 후 실제 존재하는 영상만 유지)
-- ------------------------------------------------------------
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, 'React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식)', '코딩애플 채널의 ''React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식)'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=LclObYwGj90', 'https://img.youtube.com/vi/LclObYwGj90/mqdefault.jpg', '코딩애플', 60, 25, 1137, 28, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 21, SYSDATE - 24, SYSDATE - 21);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, 'React JS #7 state, useState - 초보자를 위한 리액트 강좌', '코딩앙마 채널의 ''React JS #7 state, useState - 초보자를 위한 리액트 강좌'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=p5ZP4xzhRxk', 'https://img.youtube.com/vi/p5ZP4xzhRxk/mqdefault.jpg', '코딩앙마', 60, 30, 1174, 31, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 25, SYSDATE - 28, SYSDATE - 25);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, '리액트 코드짜는 법', '코딩애플 채널의 ''리액트 코드짜는 법'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=3MB8DBXzEos', 'https://img.youtube.com/vi/3MB8DBXzEos/mqdefault.jpg', '코딩애플', NULL, 9, 199, 6, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 29, SYSDATE - 32, SYSDATE - 29);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, 'React JS #1 강의 소개 - 초보자를 위한 리액트 강좌', '코딩앙마 채널의 ''React JS #1 강의 소개 - 초보자를 위한 리액트 강좌'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=05uFo_-SGXU', 'https://img.youtube.com/vi/05uFo_-SGXU/mqdefault.jpg', '코딩앙마', 58, 12, 252, 8, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 33, SYSDATE - 36, SYSDATE - 33);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, '깃헙 개발자들이 React 안쓰는 이유 : Web Component', '코딩애플 채널의 ''깃헙 개발자들이 React 안쓰는 이유 : Web Component'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=RtvSgptpfnY', 'https://img.youtube.com/vi/RtvSgptpfnY/mqdefault.jpg', '코딩애플', 65, 15, 305, 10, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 37, SYSDATE - 40, SYSDATE - 37);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, '와 Vite 쓰면 리액트 10배 빨라짐 (과장아님)', '코딩애플 채널의 ''와 Vite 쓰면 리액트 10배 빨라짐 (과장아님)'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=iX3Nu1FcZKA', 'https://img.youtube.com/vi/iX3Nu1FcZKA/mqdefault.jpg', '코딩애플', NULL, 18, 358, 12, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 41, SYSDATE - 44, SYSDATE - 41);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (1, 50, '2022 new 리액트 2강 : JSX 문법은 3개가 다임', '코딩애플 채널의 ''2022 new 리액트 2강 : JSX 문법은 3개가 다임'' 강의를 기반으로 한 프론트엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=qocQ7ekeMI4', 'https://img.youtube.com/vi/qocQ7ekeMI4/mqdefault.jpg', '코딩애플', 39, 21, 411, 14, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 45, SYSDATE - 48, SYSDATE - 45);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '스프링 부트 강의 - 1-1강 Spring Boot 개요', '나무소리 채널의 ''스프링 부트 강의 - 1-1강 Spring Boot 개요'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=MFT2s6ijTws', 'https://img.youtube.com/vi/MFT2s6ijTws/mqdefault.jpg', '나무소리', 60, 25, 1396, 29, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 49, SYSDATE - 52, SYSDATE - 49);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵', '김영한 채널의 ''김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=ZgtvcyH58ys', 'https://img.youtube.com/vi/ZgtvcyH58ys/mqdefault.jpg', '김영한', 60, 30, 1433, 32, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 53, SYSDATE - 56, SYSDATE - 53);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1)', '나무소리 채널의 ''스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1)'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=WnYPdkNSLy8', 'https://img.youtube.com/vi/WnYPdkNSLy8/mqdefault.jpg', '나무소리', 60, 35, 1470, 35, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 57, SYSDATE - 60, SYSDATE - 57);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요?', '메타코딩 채널의 ''스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요?'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=XBG6CUtVCIg', 'https://img.youtube.com/vi/XBG6CUtVCIg/mqdefault.jpg', '메타코딩', 60, 40, 1507, 38, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 61, SYSDATE - 64, SYSDATE - 61);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '[스프링 부트 기초 강의] 4강. 3.4 JPA', '한빛미디어 채널의 ''[스프링 부트 기초 강의] 4강. 3.4 JPA'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=-Iu7vFUrU3I', 'https://img.youtube.com/vi/-Iu7vFUrU3I/mqdefault.jpg', '한빛미디어', NULL, 11, 676, 4, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 65, SYSDATE - 68, SYSDATE - 65);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2)', '나무소리 채널의 ''스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2)'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=v0-60wXOgsg', 'https://img.youtube.com/vi/v0-60wXOgsg/mqdefault.jpg', '나무소리', 41, 14, 729, 6, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 69, SYSDATE - 72, SYSDATE - 69);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1)', '나무소리 채널의 ''스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1)'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=og5TDOARg6A', 'https://img.youtube.com/vi/og5TDOARg6A/mqdefault.jpg', '나무소리', 48, 17, 782, 8, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 73, SYSDATE - 76, SYSDATE - 73);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화', '인프런 inflearn 채널의 ''실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=7oi9bsPz1bg', 'https://img.youtube.com/vi/7oi9bsPz1bg/mqdefault.jpg', '인프런 inflearn', NULL, 20, 835, 10, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 77, SYSDATE - 80, SYSDATE - 77);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '실전! 스프링 부트와 JPA 활용2 - 강좌 소개', '인프런 inflearn 채널의 ''실전! 스프링 부트와 JPA 활용2 - 강좌 소개'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=XRNrdINt_1M', 'https://img.youtube.com/vi/XRNrdINt_1M/mqdefault.jpg', '인프런 inflearn', 62, 23, 888, 12, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 81, SYSDATE - 84, SYSDATE - 81);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4)', '나무소리 채널의 ''스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4)'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=CFEpsd-q3G8', 'https://img.youtube.com/vi/CFEpsd-q3G8/mqdefault.jpg', '나무소리', 69, 1, 41, 14, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 85, SYSDATE - 88, SYSDATE - 85);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (2, 50, '[스프링 부트] 게시판 무작정 따라하기 - 소개', '한코딩 채널의 ''[스프링 부트] 게시판 무작정 따라하기 - 소개'' 강의를 기반으로 한 백엔드 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=frI5CoZe-vE', 'https://img.youtube.com/vi/frI5CoZe-vE/mqdefault.jpg', '한코딩', NULL, 4, 94, 16, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 89, SYSDATE - 92, SYSDATE - 89);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (3, 50, '[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요', 'Sunkyoo Hwang 채널의 ''[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요'' 강의를 기반으로 한 CS 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=zMn9_Q33FMc', 'https://img.youtube.com/vi/zMn9_Q33FMc/mqdefault.jpg', 'Sunkyoo Hwang', 60, 45, 1803, 42, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 93, SYSDATE - 96, SYSDATE - 93);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (3, 50, '[알고리즘 강의] 힙 자료구조', 'IOI KOREA 채널의 ''[알고리즘 강의] 힙 자료구조'' 강의를 기반으로 한 CS 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=SMSkOy6KXLE', 'https://img.youtube.com/vi/SMSkOy6KXLE/mqdefault.jpg', 'IOI KOREA', 60, 50, 1840, 25, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 97, SYSDATE - 100, SYSDATE - 97);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (3, 50, '[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습', '메타코드M 채널의 ''[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습'' 강의를 기반으로 한 CS 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=NazAYdsohec', 'https://img.youtube.com/vi/NazAYdsohec/mqdefault.jpg', '메타코드M', NULL, 13, 253, 2, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 101, SYSDATE - 104, SYSDATE - 101);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (3, 50, '[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph', '메타코드M 채널의 ''[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph'' 강의를 기반으로 한 CS 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=f2_dUDovRxo', 'https://img.youtube.com/vi/f2_dUDovRxo/mqdefault.jpg', '메타코드M', 64, 16, 306, 4, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 105, SYSDATE - 108, SYSDATE - 105);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (3, 50, '자료구조 / 알고리즘 강의 8화 스택 (Stack) 구현', '어소트락 게임아카데미 채널의 ''자료구조 / 알고리즘 강의 8화 스택 (Stack) 구현'' 강의를 기반으로 한 CS 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=uhkpxJgTzh8', 'https://img.youtube.com/vi/uhkpxJgTzh8/mqdefault.jpg', '어소트락 게임아카데미', 31, 19, 359, 6, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 109, SYSDATE - 112, SYSDATE - 109);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (3, 50, '자료구조 / 알고리즘 강의 1화 - 링크드 리스트(linked list) 구현 (1/2)', '어소트락 게임아카데미 채널의 ''자료구조 / 알고리즘 강의 1화 - 링크드 리스트(linked list) 구현 (1/2)'' 강의를 기반으로 한 CS 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=rrigSKoA9x0', 'https://img.youtube.com/vi/rrigSKoA9x0/mqdefault.jpg', '어소트락 게임아카데미', NULL, 22, 412, 8, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 113, SYSDATE - 116, SYSDATE - 113);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA', '데브원영 DVWY 채널의 ''빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=tzsPfkub5XY', 'https://img.youtube.com/vi/tzsPfkub5XY/mqdefault.jpg', '데브원영 DVWY', 60, 40, 1125, 40, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 117, SYSDATE - 120, SYSDATE - 117);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경', 'Minsuk Heo 허민석 채널의 ''빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=lU9OLSVyIuw', 'https://img.youtube.com/vi/lU9OLSVyIuw/mqdefault.jpg', 'Minsuk Heo 허민석', 60, 45, 1162, 43, 1, 0, 'APPROVED', NULL, SYSTIMESTAMP - 121, SYSDATE - 124, SYSDATE - 121);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '[HD]빅데이터 분석을 위한 Hadoop(하둡) 프로그래밍 Part.1-1', '아이티동스쿨 채널의 ''[HD]빅데이터 분석을 위한 Hadoop(하둡) 프로그래밍 Part.1-1'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=wph7ufXlksI', 'https://img.youtube.com/vi/wph7ufXlksI/mqdefault.jpg', '아이티동스쿨', NULL, 6, 571, 14, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 125, SYSDATE - 128, SYSDATE - 125);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '하둡 기초 강의 기초부터 실무까지 차근차근! Hadoop Basics Tutorial', '알지오 평생교육원 채널의 ''하둡 기초 강의 기초부터 실무까지 차근차근! Hadoop Basics Tutorial'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=3cbUP8Iw6E4', 'https://img.youtube.com/vi/3cbUP8Iw6E4/mqdefault.jpg', '알지오 평생교육원', 66, 9, 624, 16, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 129, SYSDATE - 132, SYSDATE - 129);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '빅데이터분석기사 필기 무료강의ㅣ6만명이 검증한 메타코드M 대표강의', '메타코드M 채널의 ''빅데이터분석기사 필기 무료강의ㅣ6만명이 검증한 메타코드M 대표강의'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=FDiv6Hr1NyQ', 'https://img.youtube.com/vi/FDiv6Hr1NyQ/mqdefault.jpg', '메타코드M', 33, 12, 677, 18, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 133, SYSDATE - 136, SYSDATE - 133);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '[현장강의] AWS에서 하둡 스파크 고가용성 멀티 노드 클러스터 구축하기 - 완결편', 'BigData Koo 채널의 ''[현장강의] AWS에서 하둡 스파크 고가용성 멀티 노드 클러스터 구축하기 - 완결편'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=Il6oVtWq1MI', 'https://img.youtube.com/vi/Il6oVtWq1MI/mqdefault.jpg', 'BigData Koo', NULL, 15, 730, 0, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 137, SYSDATE - 140, SYSDATE - 137);
INSERT INTO lectures (category_id, created_by, title, description, lecture_url, thumbnail_url, instructor, capacity, current_enrolled, view_count, like_count, is_popular, is_deleted, status, reject_reason, reviewed_at, created_at, updated_at) VALUES (4, 50, '빅데이터분석기사 필기 강의 25년 All New version | 2,000명 수강생 검증완료', '메타코드M 채널의 ''빅데이터분석기사 필기 강의 25년 All New version | 2,000명 수강생 검증완료'' 강의를 기반으로 한 빅데이터 학습 콘텐츠입니다. 실습 위주로 진행되며 예제 코드를 따라 하며 핵심 개념을 익힐 수 있습니다.', 'https://www.youtube.com/watch?v=RKYNOhr-gFY', 'https://img.youtube.com/vi/RKYNOhr-gFY/mqdefault.jpg', '메타코드M', 47, 18, 783, 2, 0, 0, 'APPROVED', NULL, SYSTIMESTAMP - 141, SYSDATE - 144, SYSDATE - 141);

-- ------------------------------------------------------------
-- 5. notes (50건, 코드블럭+이미지 포함, 500~1000자, 이미지 없는 노트는 10건만)
-- ------------------------------------------------------------
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (1, 1, 'React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식) 보고 헷갈렸던 부분 정리', '오늘 코딩애플님 영상으로 ''React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식)'' 부분을 봤는데, 컴포넌트 리렌더링 시점이랑 상태값 변경 시점을 따로 생각해야 한다는 게 처음엔 헷갈렸다. 콘솔로 직접 찍어보면서 따라가니까 확실히 이해됐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

다음엔 이 패턴을 실제 프로젝트에도 적용해봐야겠다.

![DOM 트리 구조](https://upload.wikimedia.org/wikipedia/commons/5/5a/DOM-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DOM-model.svg', 341, 18, 0, SYSDATE - 8, SYSDATE - 7.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (1, 2, 'React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식) 복습 노트', '''React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식)'' 강의를 듣고 정리해본다. 예전엔 그냥 감으로 코드를 짰는데, 이번에 개념을 제대로 짚고 나니 왜 그렇게 동작하는지 이해가 됐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

다음 강의에서는 이 부분을 실전 프로젝트에 어떻게 쓰는지 다룬다고 하니 기대된다.

![CSS 박스 모델](https://upload.wikimedia.org/wikipedia/commons/5/53/Css_box_model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/5/53/Css_box_model.svg', 56, 4, 0, SYSDATE - 8, SYSDATE - 7.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (2, 3, 'React JS #7 state, useState - 초보자를 위한 리액트 강좌 강의 요약 정리', '코딩앙마님 강의 따라 치다가 화면에 아무것도 안 떠서 30분 넘게 헤맸는데, 알고 보니 export를 빼먹은 거였다. ''React JS #7 state, useState - 초보자를 위한 리액트 강좌'' 내용 자체는 어렵지 않은데 오타 하나로 이렇게 고생할 줄은 몰랐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

처음엔 useEffect 의존성 배열을 왜 써야 하는지 몰랐는데 이제야 감이 잡힌다.

![박스 모델 구조](https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg', 423, 24, 0, SYSDATE - 8, SYSDATE - 7.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (2, 4, 'React JS #7 state, useState - 초보자를 위한 리액트 강좌 듣고 정리한 내용', '프론트엔드 공부 시작한 지 얼마 안 됐는데 ''React JS #7 state, useState - 초보자를 위한 리액트 강좌'' 부분에서 흐름이 확 잡히는 느낌이었다. 코딩앙마님 설명이 예제 중심이라 따라가기 편했다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

state가 바뀔 때 컴포넌트 전체가 다시 그려지는 게 아니라 필요한 부분만 갱신된다는 걸 코드로 직접 확인하니 이해가 훨씬 잘 됐다.

![가상 DOM 비교 방식](https://upload.wikimedia.org/wikipedia/commons/4/42/React-example-virtual-dom-diff.svg)', 'https://upload.wikimedia.org/wikipedia/commons/4/42/React-example-virtual-dom-diff.svg', 102, 8, 0, SYSDATE - 8, SYSDATE - 7.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (3, 5, '리액트 코드짜는 법 공부하면서 남긴 정리글', '''리액트 코드짜는 법'' 강의를 듣고 정리해본다. 예전엔 그냥 감으로 코드를 짰는데, 이번에 개념을 제대로 짚고 나니 왜 그렇게 동작하는지 이해가 됐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

비슷한 예제를 몇 번 더 손으로 쳐보면서 익혀야 할 것 같다. 다음 강의에서는 이 부분을 실전 프로젝트에 어떻게 쓰는지 다룬다고 하니 기대된다. state가 바뀔 때 컴포넌트 전체가 다시 그려지는 게 아니라 필요한 부분만 갱신된다는 걸 코드로 직접 확인하니 이해가 훨씬 잘 됐다. 정리 노트 필요하시면 카톡 오픈채팅으로 문의 주세요 (유료 판매, 3천원)', NULL, 505, 30, 0, SYSDATE - 8, SYSDATE - 7.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (3, 6, '리액트 코드짜는 법 내용 정리 및 느낀점', '회사 업무 때문에 며칠 미뤄뒀던 ''리액트 코드짜는 법'' 강의를 오늘 드디어 봤다. 실무에서 자주 마주치는 패턴이라 미리 알아뒀으면 더 편했을 것 같다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

다음엔 이 패턴을 실제 프로젝트에도 적용해봐야겠다.

![CSS 박스 모델](https://upload.wikimedia.org/wikipedia/commons/5/53/Css_box_model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/5/53/Css_box_model.svg', 148, 12, 0, SYSDATE - 8, SYSDATE - 7.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (4, 7, 'React JS #1 강의 소개 - 초보자를 위한 리액트 강좌 핵심 개념 정리', '프론트엔드 공부 시작한 지 얼마 안 됐는데 ''React JS #1 강의 소개 - 초보자를 위한 리액트 강좌'' 부분에서 흐름이 확 잡히는 느낌이었다. 코딩앙마님 설명이 예제 중심이라 따라가기 편했다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

다음 강의에서는 이 부분을 실전 프로젝트에 어떻게 쓰는지 다룬다고 하니 기대된다.

![박스 모델 구조](https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg', 587, 36, 0, SYSDATE - 7, SYSDATE - 6.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (4, 8, 'React JS #1 강의 소개 - 초보자를 위한 리액트 강좌 보고 헷갈렸던 부분 정리', '오늘 코딩앙마님 영상으로 ''React JS #1 강의 소개 - 초보자를 위한 리액트 강좌'' 부분을 봤는데, 컴포넌트 리렌더링 시점이랑 상태값 변경 시점을 따로 생각해야 한다는 게 처음엔 헷갈렸다. 콘솔로 직접 찍어보면서 따라가니까 확실히 이해됐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

처음엔 useEffect 의존성 배열을 왜 써야 하는지 몰랐는데 이제야 감이 잡힌다.

![가상 DOM 비교 방식](https://upload.wikimedia.org/wikipedia/commons/4/42/React-example-virtual-dom-diff.svg)', 'https://upload.wikimedia.org/wikipedia/commons/4/42/React-example-virtual-dom-diff.svg', 194, 1, 0, SYSDATE - 7, SYSDATE - 6.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (5, 9, '깃헙 개발자들이 React 안쓰는 이유 : Web Component 복습 노트', '회사 업무 때문에 며칠 미뤄뒀던 ''깃헙 개발자들이 React 안쓰는 이유 : Web Component'' 강의를 오늘 드디어 봤다. 실무에서 자주 마주치는 패턴이라 미리 알아뒀으면 더 편했을 것 같다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

state가 바뀔 때 컴포넌트 전체가 다시 그려지는 게 아니라 필요한 부분만 갱신된다는 걸 코드로 직접 확인하니 이해가 훨씬 잘 됐다.

![DOM 트리 구조](https://upload.wikimedia.org/wikipedia/commons/5/5a/DOM-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DOM-model.svg', 217, 3, 0, SYSDATE - 7, SYSDATE - 6.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (6, 10, '와 Vite 쓰면 리액트 10배 빨라짐 (과장아님) 강의 요약 정리', '오늘 코딩애플님 영상으로 ''와 Vite 쓰면 리액트 10배 빨라짐 (과장아님)'' 부분을 봤는데, 컴포넌트 리렌더링 시점이랑 상태값 변경 시점을 따로 생각해야 한다는 게 처음엔 헷갈렸다. 콘솔로 직접 찍어보면서 따라가니까 확실히 이해됐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

다음엔 이 패턴을 실제 프로젝트에도 적용해봐야겠다. 처음엔 useEffect 의존성 배열을 왜 써야 하는지 몰랐는데 이제야 감이 잡힌다.', NULL, 240, 5, 0, SYSDATE - 7, SYSDATE - 6.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (7, 11, '2022 new 리액트 2강 : JSX 문법은 3개가 다임 듣고 정리한 내용', '코딩애플님 강의 따라 치다가 화면에 아무것도 안 떠서 30분 넘게 헤맸는데, 알고 보니 export를 빼먹은 거였다. ''2022 new 리액트 2강 : JSX 문법은 3개가 다임'' 내용 자체는 어렵지 않은데 오타 하나로 이렇게 고생할 줄은 몰랐다.

오늘 나온 예제 코드를 다시 손으로 옮겨서 정리해본다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(''count가 바뀔 때마다 실행됨:'', count);
  }, [count]);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

처음엔 useEffect 의존성 배열을 왜 써야 하는지 몰랐는데 이제야 감이 잡힌다.

![박스 모델 구조](https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg', 263, 7, 0, SYSDATE - 7, SYSDATE - 6.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (8, 12, '스프링 부트 강의 - 1-1강 Spring Boot 개요 공부하면서 남긴 정리글', '''스프링 부트 강의 - 1-1강 Spring Boot 개요'' 부분을 듣고 JPA 영속성 컨텍스트 개념이 좀 더 명확해졌다. 나무소리님이 예제로 직접 보여주셔서 이해가 훨씬 빨랐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

다음엔 실제 프로젝트 코드에도 이 패턴을 적용해볼 생각이다.

![3계층 아키텍처](https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png)', 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 792, 21, 0, SYSDATE - 7, SYSDATE - 6.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (8, 13, '스프링 부트 강의 - 1-1강 Spring Boot 개요 내용 정리 및 느낀점', '나무소리님 강의로 ''스프링 부트 강의 - 1-1강 Spring Boot 개요'' 파트 정리. 이론만 들어서는 이해가 잘 안 됐는데 직접 프로젝트에 적용해보니 확실히 남는다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

실무에서는 이런 코드에 예외 처리도 더 붙는다고 하니 다음엔 그 부분도 찾아봐야겠다.

![클라이언트-서버 모델](https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 309, 11, 0, SYSDATE - 6, SYSDATE - 5.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (9, 14, '김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵 핵심 개념 정리', '회사에서 레거시 코드 보다가 이해 안 됐던 부분이 있었는데, ''김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵'' 강의를 듣고 나서야 왜 그렇게 설계됐는지 감이 왔다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

Repository 인터페이스만 만들어도 기본 CRUD가 다 되는 게 여전히 신기하다.

![클라이언트-서버 구조도](https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg)', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 874, 27, 0, SYSDATE - 6, SYSDATE - 5.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (9, 15, '김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵 보고 헷갈렸던 부분 정리', '스프링 공부하면서 계속 막히던 부분이 있었는데 ''김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵'' 강의 보고 나서 흐름이 이어졌다. 정리해두지 않으면 또 까먹을 것 같아서 남긴다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

연관관계 주인을 헷갈려서 예전에 고생했었는데 이번에 다시 짚고 넘어가니 확실해졌다.', NULL, 355, 0, 0, SYSDATE - 6, SYSDATE - 5.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (10, 16, '스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1) 복습 노트', '나무소리님 강의로 ''스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1)'' 파트 정리. 이론만 들어서는 이해가 잘 안 됐는데 직접 프로젝트에 적용해보니 확실히 남는다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

지연 로딩과 즉시 로딩 차이도 같이 정리해두면 좋을 것 같다.

![클라이언트-서버 모델](https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 956, 33, 0, SYSDATE - 6, SYSDATE - 5.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (10, 17, '스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1) 강의 요약 정리', '실무에서 진짜 자주 쓰는 내용이라던데 ''스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1)'' 부분은 확실히 챙겨서 봐야겠다. 나무소리님 설명 덕분에 개념 잡는 데 도움 많이 됐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

다음엔 실제 프로젝트 코드에도 이 패턴을 적용해볼 생각이다.

![클라이언트-서버 구조도](https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg)', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 401, 4, 0, SYSDATE - 6, SYSDATE - 5.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (11, 18, '스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요? 듣고 정리한 내용', '스프링 공부하면서 계속 막히던 부분이 있었는데 ''스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요?'' 강의 보고 나서 흐름이 이어졌다. 정리해두지 않으면 또 까먹을 것 같아서 남긴다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

실무에서는 이런 코드에 예외 처리도 더 붙는다고 하니 다음엔 그 부분도 찾아봐야겠다.

![3계층 아키텍처](https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png)', 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 1038, 39, 0, SYSDATE - 6, SYSDATE - 5.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (11, 19, '스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요? 공부하면서 남긴 정리글', '''스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요?'' 부분을 듣고 JPA 영속성 컨텍스트 개념이 좀 더 명확해졌다. 메타코딩님이 예제로 직접 보여주셔서 이해가 훨씬 빨랐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

Repository 인터페이스만 만들어도 기본 CRUD가 다 되는 게 여전히 신기하다.

![클라이언트-서버 모델](https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 447, 8, 0, SYSDATE - 5, SYSDATE - 4.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (12, 20, '[스프링 부트 기초 강의] 4강. 3.4 JPA 내용 정리 및 느낀점', '실무에서 진짜 자주 쓰는 내용이라던데 ''[스프링 부트 기초 강의] 4강. 3.4 JPA'' 부분은 확실히 챙겨서 봐야겠다. 한빛미디어님 설명 덕분에 개념 잡는 데 도움 많이 됐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

연관관계 주인을 헷갈려서 예전에 고생했었는데 이번에 다시 짚고 넘어가니 확실해졌다. 사실 이 내용은 제가 직접 정리한 게 아니라 다른 블로그 글을 그대로 긁어온 겁니다.', NULL, 1120, 15, 0, SYSDATE - 5, SYSDATE - 4.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (12, 21, '[스프링 부트 기초 강의] 4강. 3.4 JPA 핵심 개념 정리', '회사에서 레거시 코드 보다가 이해 안 됐던 부분이 있었는데, ''[스프링 부트 기초 강의] 4강. 3.4 JPA'' 강의를 듣고 나서야 왜 그렇게 설계됐는지 감이 왔다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

지연 로딩과 즉시 로딩 차이도 같이 정리해두면 좋을 것 같다.

![3계층 아키텍처](https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png)', 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 493, 12, 0, SYSDATE - 5, SYSDATE - 4.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (13, 22, '스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2) 보고 헷갈렸던 부분 정리', '''스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2)'' 부분을 듣고 JPA 영속성 컨텍스트 개념이 좀 더 명확해졌다. 나무소리님이 예제로 직접 보여주셔서 이해가 훨씬 빨랐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

다음엔 실제 프로젝트 코드에도 이 패턴을 적용해볼 생각이다.

![클라이언트-서버 모델](https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 1202, 21, 0, SYSDATE - 5, SYSDATE - 4.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (13, 23, '스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2) 복습 노트', '나무소리님 강의로 ''스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2)'' 파트 정리. 이론만 들어서는 이해가 잘 안 됐는데 직접 프로젝트에 적용해보니 확실히 남는다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

실무에서는 이런 코드에 예외 처리도 더 붙는다고 하니 다음엔 그 부분도 찾아봐야겠다.

![클라이언트-서버 구조도](https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg)', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 39, 1, 0, SYSDATE - 5, SYSDATE - 4.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (14, 24, '스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1) 강의 요약 정리', '회사에서 레거시 코드 보다가 이해 안 됐던 부분이 있었는데, ''스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1)'' 강의를 듣고 나서야 왜 그렇게 설계됐는지 감이 왔다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

Repository 인터페이스만 만들어도 기본 CRUD가 다 되는 게 여전히 신기하다.

![3계층 아키텍처](https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png)', 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 1284, 27, 0, SYSDATE - 5, SYSDATE - 4.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (14, 25, '스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1) 듣고 정리한 내용', '스프링 공부하면서 계속 막히던 부분이 있었는데 ''스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1)'' 강의 보고 나서 흐름이 이어졌다. 정리해두지 않으면 또 까먹을 것 같아서 남긴다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

연관관계 주인을 헷갈려서 예전에 고생했었는데 이번에 다시 짚고 넘어가니 확실해졌다.', NULL, 85, 5, 0, SYSDATE - 4, SYSDATE - 3.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (15, 26, '실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 공부하면서 남긴 정리글', '인프런 inflearn님 강의로 ''실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화'' 파트 정리. 이론만 들어서는 이해가 잘 안 됐는데 직접 프로젝트에 적용해보니 확실히 남는다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

지연 로딩과 즉시 로딩 차이도 같이 정리해두면 좋을 것 같다.

![클라이언트-서버 구조도](https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg)', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 108, 7, 0, SYSDATE - 4, SYSDATE - 3.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (16, 27, '실전! 스프링 부트와 JPA 활용2 - 강좌 소개 내용 정리 및 느낀점', '스프링 공부하면서 계속 막히던 부분이 있었는데 ''실전! 스프링 부트와 JPA 활용2 - 강좌 소개'' 강의 보고 나서 흐름이 이어졌다. 정리해두지 않으면 또 까먹을 것 같아서 남긴다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

실무에서는 이런 코드에 예외 처리도 더 붙는다고 하니 다음엔 그 부분도 찾아봐야겠다.

![3계층 아키텍처](https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png)', 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 131, 9, 0, SYSDATE - 4, SYSDATE - 3.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (17, 28, '스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4) 핵심 개념 정리', '실무에서 진짜 자주 쓰는 내용이라던데 ''스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4)'' 부분은 확실히 챙겨서 봐야겠다. 나무소리님 설명 덕분에 개념 잡는 데 도움 많이 됐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

연관관계 주인을 헷갈려서 예전에 고생했었는데 이번에 다시 짚고 넘어가니 확실해졌다.

![클라이언트-서버 모델](https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg)', 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 154, 11, 0, SYSDATE - 4, SYSDATE - 3.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (18, 29, '[스프링 부트] 게시판 무작정 따라하기 - 소개 보고 헷갈렸던 부분 정리', '''[스프링 부트] 게시판 무작정 따라하기 - 소개'' 부분을 듣고 JPA 영속성 컨텍스트 개념이 좀 더 명확해졌다. 한코딩님이 예제로 직접 보여주셔서 이해가 훨씬 빨랐다.

실습에서 다뤘던 코드를 다시 정리해서 남겨둔다.

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String name);
}
```

다음엔 실제 프로젝트 코드에도 이 패턴을 적용해볼 생각이다.

![클라이언트-서버 구조도](https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg)', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 177, 13, 0, SYSDATE - 4, SYSDATE - 3.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (19, 30, '[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요 복습 노트', '''[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요'' 강의로 자료구조 개념 다시 잡았다. 취업 준비하면서 CS 지식이 너무 부족하다는 걸 느껴서 요즘 차근차근 보고 있는데 오늘 파트가 특히 헷갈렸던 부분이었다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

시간 복잡도까지 같이 계산해보는 연습을 더 해야 할 것 같다.', NULL, 1530, 15, 0, SYSDATE - 4, SYSDATE - 3.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (19, 31, '[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요 강의 요약 정리', '코딩테스트 준비하다가 자꾸 틀리는 유형이 있어서 기초부터 다시 보자 싶어 ''[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요'' 강의를 들었다. 개념을 말로 설명할 수 있어야 진짜 아는 거라는 말이 맞는 것 같다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

말로 설명할 수 있을 정도로 손으로 여러 번 짜보는 연습이 필요할 것 같다.

![연결 리스트 노드 추가](https://upload.wikimedia.org/wikipedia/commons/4/4b/CPT-LinkedLists-addingnode.svg)', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/CPT-LinkedLists-addingnode.svg', 223, 2, 0, SYSDATE - 3, SYSDATE - 2.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (20, 32, '[알고리즘 강의] 힙 자료구조 듣고 정리한 내용', '몇 번을 다시 봐도 헷갈리던 개념이었는데 IOI KOREA님 ''[알고리즘 강의] 힙 자료구조'' 강의를 보고 나서야 그림으로 이해가 됐다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

비슷한 문제를 코딩테스트에서 몇 번 본 것 같아서 확실히 익혀두려고 한다.

![이진 힙 구조](https://upload.wikimedia.org/wikipedia/commons/4/47/Binary_heap.svg)', 'https://upload.wikimedia.org/wikipedia/commons/4/47/Binary_heap.svg', 1612, 21, 0, SYSDATE - 3, SYSDATE - 2.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (20, 33, '[알고리즘 강의] 힙 자료구조 공부하면서 남긴 정리글', '''[알고리즘 강의] 힙 자료구조'' 파트 정리. 이론만 들어서는 이해가 잘 안 되길래 IOI KOREA님 강의를 보면서 직접 손으로 그려봤더니 훨씬 나았다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

직접 코드로 짜보니 그림으로만 볼 때보다 훨씬 이해가 잘 됐다.

![스택(LIFO) 구조](https://upload.wikimedia.org/wikipedia/commons/2/29/Data_stack.svg)', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Data_stack.svg', 269, 6, 0, SYSDATE - 3, SYSDATE - 2.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (21, 34, '[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습 내용 정리 및 느낀점', '코딩테스트 준비하다가 자꾸 틀리는 유형이 있어서 기초부터 다시 보자 싶어 ''[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습'' 강의를 들었다. 개념을 말로 설명할 수 있어야 진짜 아는 거라는 말이 맞는 것 같다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

다음엔 이 자료구조를 활용한 실제 문제도 풀어봐야겠다.

![이진 탐색 트리](https://upload.wikimedia.org/wikipedia/commons/d/da/Binary_search_tree.svg)', 'https://upload.wikimedia.org/wikipedia/commons/d/da/Binary_search_tree.svg', 1694, 27, 0, SYSDATE - 3, SYSDATE - 2.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (21, 35, '[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습 핵심 개념 정리', '예전에 정리해뒀던 노트를 다시 보다가 빠진 부분이 있어서 ''[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습'' 강의를 다시 들으며 보충했다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

시간 복잡도까지 같이 계산해보는 연습을 더 해야 할 것 같다. 궁금한 점 있으면 제 개인 전화번호 010-9284-1173로 문자 주세요.', NULL, 315, 10, 0, SYSDATE - 3, SYSDATE - 2.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (22, 36, '[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph 보고 헷갈렸던 부분 정리', '''[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph'' 파트 정리. 이론만 들어서는 이해가 잘 안 되길래 메타코드M님 강의를 보면서 직접 손으로 그려봤더니 훨씬 나았다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

말로 설명할 수 있을 정도로 손으로 여러 번 짜보는 연습이 필요할 것 같다.

![단일 연결 리스트 구조](https://upload.wikimedia.org/wikipedia/commons/6/6d/Singly-linked-list.svg)', 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Singly-linked-list.svg', 1776, 33, 0, SYSDATE - 3, SYSDATE - 2.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (22, 37, '[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph 복습 노트', '''[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph'' 강의로 자료구조 개념 다시 잡았다. 취업 준비하면서 CS 지식이 너무 부족하다는 걸 느껴서 요즘 차근차근 보고 있는데 오늘 파트가 특히 헷갈렸던 부분이었다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

비슷한 문제를 코딩테스트에서 몇 번 본 것 같아서 확실히 익혀두려고 한다.

![연결 리스트 노드 추가](https://upload.wikimedia.org/wikipedia/commons/4/4b/CPT-LinkedLists-addingnode.svg)', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/CPT-LinkedLists-addingnode.svg', 361, 14, 0, SYSDATE - 2, SYSDATE - 1.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (23, 38, '자료구조 / 알고리즘 강의 8화 스택 (Stack) 구현 강의 요약 정리', '예전에 정리해뒀던 노트를 다시 보다가 빠진 부분이 있어서 ''자료구조 / 알고리즘 강의 8화 스택 (Stack) 구현'' 강의를 다시 들으며 보충했다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

직접 코드로 짜보니 그림으로만 볼 때보다 훨씬 이해가 잘 됐다.

![이진 힙 구조](https://upload.wikimedia.org/wikipedia/commons/4/47/Binary_heap.svg)', 'https://upload.wikimedia.org/wikipedia/commons/4/47/Binary_heap.svg', 384, 1, 0, SYSDATE - 2, SYSDATE - 1.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (24, 39, '자료구조 / 알고리즘 강의 1화 - 링크드 리스트(linked list) 구현 (1/2) 듣고 정리한 내용', '''자료구조 / 알고리즘 강의 1화 - 링크드 리스트(linked list) 구현 (1/2)'' 강의로 자료구조 개념 다시 잡았다. 취업 준비하면서 CS 지식이 너무 부족하다는 걸 느껴서 요즘 차근차근 보고 있는데 오늘 파트가 특히 헷갈렸던 부분이었다.

직접 구현해본 코드는 다음과 같다.

```java
class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; }
}

class LinkedList {
    Node head;
    void add(int value) {
        Node newNode = new Node(value);
        if (head == null) { head = newNode; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = newNode;
    }
}
```

시간 복잡도까지 같이 계산해보는 연습을 더 해야 할 것 같다.

![스택(LIFO) 구조](https://upload.wikimedia.org/wikipedia/commons/2/29/Data_stack.svg)', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Data_stack.svg', 407, 3, 0, SYSDATE - 2, SYSDATE - 1.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (25, 40, '빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA 공부하면서 남긴 정리글', '빅데이터 쪽은 처음이라 데브원영 DVWY님 ''빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA'' 강의부터 차근차근 보고 있다. 용어부터 낯설어서 하나씩 찾아가며 듣는 중이다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

다음엔 클러스터 환경에서 직접 돌려보는 실습도 해봐야겠다. 분산 처리라는 개념 자체가 아직 낯설어서 반복해서 봐야 할 것 같다.', NULL, 340, 15, 0, SYSDATE - 2, SYSDATE - 1.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (25, 41, '빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA 내용 정리 및 느낀점', '''빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA'' 부분 정리. 하둡/스파크 생태계가 처음엔 복잡해 보였는데 데브원영 DVWY님이 구조부터 짚어주셔서 이해하기 편했다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

다음 강의에서 다룰 심화 내용도 미리 찾아봐야 할 것 같다.

![하둡의 MapReduce 처리 흐름](https://upload.wikimedia.org/wikipedia/commons/9/90/MapReduce_realisation_in_Hadoop.svg)', 'https://upload.wikimedia.org/wikipedia/commons/9/90/MapReduce_realisation_in_Hadoop.svg', 453, 7, 0, SYSDATE - 2, SYSDATE - 1.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (26, 42, '빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경 핵심 개념 정리', '요즘 회사에서 로그 데이터량이 늘면서 처리 방식 고민이 많았는데 ''빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경'' 강의를 보고 방향이 좀 잡혔다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

분산 처리라는 개념 자체가 아직 낯설어서 반복해서 봐야 할 것 같다.

![HDFS 아키텍처](https://upload.wikimedia.org/wikipedia/commons/3/3e/Hdfsarchitecture.gif)', 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Hdfsarchitecture.gif', 422, 21, 0, SYSDATE - 2, SYSDATE - 1.2);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (26, 43, '빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경 보고 헷갈렸던 부분 정리', '이 분야는 용어부터 낯설어서 Minsuk Heo 허민석님 강의 들으면서 나름대로 정리해본다. ''빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경'' 파트가 오늘 목표였다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

생소한 개념이 많아서 아직 완전히 이해했다고 하긴 어렵지만 예제를 직접 돌려보니 감이 좀 잡혔다.

![HDFS 구조도](https://upload.wikimedia.org/wikipedia/commons/e/e8/HDFS.png)', 'https://upload.wikimedia.org/wikipedia/commons/e/e8/HDFS.png', 499, 11, 0, SYSDATE - 1, SYSDATE - 0.7);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (27, 44, '[HD]빅데이터 분석을 위한 Hadoop(하둡) 프로그래밍 Part.1-1 복습 노트', '''[HD]빅데이터 분석을 위한 Hadoop(하둡) 프로그래밍 Part.1-1'' 부분 정리. 하둡/스파크 생태계가 처음엔 복잡해 보였는데 아이티동스쿨님이 구조부터 짚어주셔서 이해하기 편했다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

실무에서는 데이터 규모가 훨씬 커진다고 하니 그 감각도 같이 익혀야겠다.

![하둡 상위 레벨 아키텍처](https://upload.wikimedia.org/wikipedia/commons/8/85/Hadoop-HighLevel_hadoop_architecture-640x460.png)', 'https://upload.wikimedia.org/wikipedia/commons/8/85/Hadoop-HighLevel_hadoop_architecture-640x460.png', 504, 27, 0, SYSDATE - 1, SYSDATE - 0.6);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (27, 45, '[HD]빅데이터 분석을 위한 Hadoop(하둡) 프로그래밍 Part.1-1 강의 요약 정리', '완전 이해했다고 하기엔 아직 부족하지만, 까먹기 전에 오늘 ''[HD]빅데이터 분석을 위한 Hadoop(하둡) 프로그래밍 Part.1-1'' 강의에서 배운 내용을 정리해둔다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

다음엔 클러스터 환경에서 직접 돌려보는 실습도 해봐야겠다. 분산 처리라는 개념 자체가 아직 낯설어서 반복해서 봐야 할 것 같다. 실무에서는 데이터 규모가 훨씬 커진다고 하니 그 감각도 같이 익혀야겠다.', NULL, 45, 0, 0, SYSDATE - 1, SYSDATE - 0.5);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (28, 46, '하둡 기초 강의 기초부터 실무까지 차근차근! Hadoop Basics Tutorial 듣고 정리한 내용', '이 분야는 용어부터 낯설어서 알지오 평생교육원님 강의 들으면서 나름대로 정리해본다. ''하둡 기초 강의 기초부터 실무까지 차근차근! Hadoop Basics Tutorial'' 파트가 오늘 목표였다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

다음 강의에서 다룰 심화 내용도 미리 찾아봐야 할 것 같다.

![Kafka 작업 큐 아키텍처](https://upload.wikimedia.org/wikipedia/commons/a/af/Kafka_Job_Queue_Architecture_diagram.svg)', 'https://upload.wikimedia.org/wikipedia/commons/a/af/Kafka_Job_Queue_Architecture_diagram.svg', 586, 33, 0, SYSDATE - 1, SYSDATE - 0.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (28, 47, '하둡 기초 강의 기초부터 실무까지 차근차근! Hadoop Basics Tutorial 공부하면서 남긴 정리글', '빅데이터 쪽은 처음이라 알지오 평생교육원님 ''하둡 기초 강의 기초부터 실무까지 차근차근! Hadoop Basics Tutorial'' 강의부터 차근차근 보고 있다. 용어부터 낯설어서 하나씩 찾아가며 듣는 중이다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

분산 처리라는 개념 자체가 아직 낯설어서 반복해서 봐야 할 것 같다.

![하둡의 MapReduce 처리 흐름](https://upload.wikimedia.org/wikipedia/commons/9/90/MapReduce_realisation_in_Hadoop.svg)', 'https://upload.wikimedia.org/wikipedia/commons/9/90/MapReduce_realisation_in_Hadoop.svg', 91, 4, 0, SYSDATE - 1, SYSDATE - 0.3);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (29, 48, '빅데이터분석기사 필기 무료강의ㅣ6만명이 검증한 메타코드M 대표강의 내용 정리 및 느낀점', '완전 이해했다고 하기엔 아직 부족하지만, 까먹기 전에 오늘 ''빅데이터분석기사 필기 무료강의ㅣ6만명이 검증한 메타코드M 대표강의'' 강의에서 배운 내용을 정리해둔다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

생소한 개념이 많아서 아직 완전히 이해했다고 하긴 어렵지만 예제를 직접 돌려보니 감이 좀 잡혔다.

![HDFS 아키텍처](https://upload.wikimedia.org/wikipedia/commons/3/3e/Hdfsarchitecture.gif)', 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Hdfsarchitecture.gif', 114, 6, 0, SYSDATE - 0.6, SYSDATE - 0.4);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (30, 49, '[현장강의] AWS에서 하둡 스파크 고가용성 멀티 노드 클러스터 구축하기 - 완결편 핵심 개념 정리', '빅데이터 쪽은 처음이라 BigData Koo님 ''[현장강의] AWS에서 하둡 스파크 고가용성 멀티 노드 클러스터 구축하기 - 완결편'' 강의부터 차근차근 보고 있다. 용어부터 낯설어서 하나씩 찾아가며 듣는 중이다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

다음엔 클러스터 환경에서 직접 돌려보는 실습도 해봐야겠다.

![HDFS 구조도](https://upload.wikimedia.org/wikipedia/commons/e/e8/HDFS.png)', 'https://upload.wikimedia.org/wikipedia/commons/e/e8/HDFS.png', 137, 8, 0, SYSDATE - 0.45, SYSDATE - 0.25);
INSERT INTO notes (lecture_id, user_id, title, content, thumbnail_url, view_count, like_count, is_deleted, created_at, updated_at) VALUES (31, 1, '빅데이터분석기사 필기 강의 25년 All New version | 2,000명 수강생 검증완료 보고 헷갈렸던 부분 정리', '요즘 회사에서 로그 데이터량이 늘면서 처리 방식 고민이 많았는데 ''빅데이터분석기사 필기 강의 25년 All New version | 2,000명 수강생 검증완료'' 강의를 보고 방향이 좀 잡혔다.

실습 코드를 그대로 옮겨서 정리해둔다.

```python
from pyspark import SparkContext

sc = SparkContext("local", "WordCount")
text = sc.textFile("input.txt")
counts = (text.flatMap(lambda line: line.split(" "))
              .map(lambda word: (word, 1))
              .reduceByKey(lambda a, b: a + b))
counts.saveAsTextFile("output")
```

분산 처리라는 개념 자체가 아직 낯설어서 반복해서 봐야 할 것 같다. 실무에서는 데이터 규모가 훨씬 커진다고 하니 그 감각도 같이 익혀야겠다.', NULL, 160, 10, 0, SYSDATE - 0.3, SYSDATE - 0.1);

-- ------------------------------------------------------------
-- 6. note_histories (15건)
-- ------------------------------------------------------------
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (1, 1, 'React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식) 보고 헷갈렸던 부분 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 7.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (4, 4, 'React JS #7 state, useState - 초보자를 위한 리액트 강좌 듣고 정리한 내용 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 7.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (7, 7, 'React JS #1 강의 소개 - 초보자를 위한 리액트 강좌 핵심 개념 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 6.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (10, 10, '와 Vite 쓰면 리액트 10배 빨라짐 (과장아님) 강의 요약 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 6.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (13, 13, '스프링 부트 강의 - 1-1강 Spring Boot 개요 내용 정리 및 느낀점 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 5.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (16, 16, '스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1) 복습 노트 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 5.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (19, 19, '스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요? 공부하면서 남긴 정리글 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 4.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (22, 22, '스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2) 보고 헷갈렸던 부분 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 4.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (25, 25, '스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1) 듣고 정리한 내용 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 3.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (28, 28, '스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4) 핵심 개념 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 3.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (31, 31, '[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요 강의 요약 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 2.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (34, 34, '[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습 내용 정리 및 느낀점 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 2.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (37, 37, '[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph 복습 노트 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 1.85);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (40, 40, '빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA 공부하면서 남긴 정리글 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 1.7);
INSERT INTO note_histories (note_id, editor_id, prev_title, prev_content, edited_at) VALUES (43, 43, '빅데이터 개념 정리, 하둡 파일 시스템 (HDFS)의 탄생 배경 보고 헷갈렸던 부분 정리 (초안)', '## 초안
아직 정리 중인 내용이라 뒷부분은 나중에 보완할 예정.', SYSDATE - 0.85);

-- ------------------------------------------------------------
-- 7. tags (50건)
-- ------------------------------------------------------------
INSERT INTO tags (name, created_at) VALUES ('React', SYSDATE - 5);
INSERT INTO tags (name, created_at) VALUES ('Vue', SYSDATE - 7);
INSERT INTO tags (name, created_at) VALUES ('Angular', SYSDATE - 9);
INSERT INTO tags (name, created_at) VALUES ('Svelte', SYSDATE - 11);
INSERT INTO tags (name, created_at) VALUES ('Next.js', SYSDATE - 13);
INSERT INTO tags (name, created_at) VALUES ('TypeScript', SYSDATE - 15);
INSERT INTO tags (name, created_at) VALUES ('JavaScript', SYSDATE - 17);
INSERT INTO tags (name, created_at) VALUES ('HTML', SYSDATE - 19);
INSERT INTO tags (name, created_at) VALUES ('CSS', SYSDATE - 21);
INSERT INTO tags (name, created_at) VALUES ('TailwindCSS', SYSDATE - 23);
INSERT INTO tags (name, created_at) VALUES ('상태관리', SYSDATE - 25);
INSERT INTO tags (name, created_at) VALUES ('Redux', SYSDATE - 27);
INSERT INTO tags (name, created_at) VALUES ('리액트훅', SYSDATE - 29);
INSERT INTO tags (name, created_at) VALUES ('프론트엔드', SYSDATE - 31);
INSERT INTO tags (name, created_at) VALUES ('SSR', SYSDATE - 33);
INSERT INTO tags (name, created_at) VALUES ('Java', SYSDATE - 35);
INSERT INTO tags (name, created_at) VALUES ('Spring', SYSDATE - 37);
INSERT INTO tags (name, created_at) VALUES ('SpringBoot', SYSDATE - 39);
INSERT INTO tags (name, created_at) VALUES ('SpringSecurity', SYSDATE - 41);
INSERT INTO tags (name, created_at) VALUES ('JPA', SYSDATE - 43);
INSERT INTO tags (name, created_at) VALUES ('Hibernate', SYSDATE - 45);
INSERT INTO tags (name, created_at) VALUES ('QueryDSL', SYSDATE - 47);
INSERT INTO tags (name, created_at) VALUES ('REST API', SYSDATE - 49);
INSERT INTO tags (name, created_at) VALUES ('JWT', SYSDATE - 51);
INSERT INTO tags (name, created_at) VALUES ('OAuth2', SYSDATE - 53);
INSERT INTO tags (name, created_at) VALUES ('백엔드', SYSDATE - 55);
INSERT INTO tags (name, created_at) VALUES ('MySQL', SYSDATE - 57);
INSERT INTO tags (name, created_at) VALUES ('Docker', SYSDATE - 59);
INSERT INTO tags (name, created_at) VALUES ('자료구조', SYSDATE - 61);
INSERT INTO tags (name, created_at) VALUES ('알고리즘', SYSDATE - 63);
INSERT INTO tags (name, created_at) VALUES ('운영체제', SYSDATE - 65);
INSERT INTO tags (name, created_at) VALUES ('네트워크', SYSDATE - 67);
INSERT INTO tags (name, created_at) VALUES ('데이터베이스', SYSDATE - 69);
INSERT INTO tags (name, created_at) VALUES ('컴퓨터구조', SYSDATE - 71);
INSERT INTO tags (name, created_at) VALUES ('동시성프로그래밍', SYSDATE - 73);
INSERT INTO tags (name, created_at) VALUES ('코딩테스트', SYSDATE - 75);
INSERT INTO tags (name, created_at) VALUES ('프로세스와스레드', SYSDATE - 77);
INSERT INTO tags (name, created_at) VALUES ('교착상태', SYSDATE - 79);
INSERT INTO tags (name, created_at) VALUES ('가상메모리', SYSDATE - 81);
INSERT INTO tags (name, created_at) VALUES ('TCP_IP', SYSDATE - 83);
INSERT INTO tags (name, created_at) VALUES ('빅데이터', SYSDATE - 85);
INSERT INTO tags (name, created_at) VALUES ('하둡', SYSDATE - 87);
INSERT INTO tags (name, created_at) VALUES ('스파크', SYSDATE - 89);
INSERT INTO tags (name, created_at) VALUES ('데이터엔지니어링', SYSDATE - 91);
INSERT INTO tags (name, created_at) VALUES ('ETL', SYSDATE - 93);
INSERT INTO tags (name, created_at) VALUES ('머신러닝', SYSDATE - 95);
INSERT INTO tags (name, created_at) VALUES ('딥러닝', SYSDATE - 97);
INSERT INTO tags (name, created_at) VALUES ('데이터분석', SYSDATE - 99);
INSERT INTO tags (name, created_at) VALUES ('데이터시각화', SYSDATE - 101);
INSERT INTO tags (name, created_at) VALUES ('엘라스틱서치', SYSDATE - 103);

-- ------------------------------------------------------------
-- 8. note_tags (노트 50개 x 3~5개, 카테고리에 맞춰 부여)
-- ------------------------------------------------------------
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (1, 2, 1, SYSDATE - 7);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (1, 3, 1, SYSDATE - 7);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (1, 4, 1, SYSDATE - 7);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (1, 5, 1, SYSDATE - 7);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (2, 3, 1, SYSDATE - 10);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (2, 4, 1, SYSDATE - 10);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (2, 5, 1, SYSDATE - 10);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (2, 6, 0, SYSDATE - 10);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (2, 7, 1, SYSDATE - 10);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (3, 4, 1, SYSDATE - 13);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (3, 5, 1, SYSDATE - 13);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (3, 6, 0, SYSDATE - 13);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (4, 5, 1, SYSDATE - 16);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (4, 6, 0, SYSDATE - 16);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (4, 7, 1, SYSDATE - 16);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (4, 8, 1, SYSDATE - 16);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (5, 6, 0, SYSDATE - 19);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (5, 7, 1, SYSDATE - 19);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (5, 8, 1, SYSDATE - 19);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (5, 9, 1, SYSDATE - 19);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (5, 10, 1, SYSDATE - 19);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (6, 7, 1, SYSDATE - 22);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (6, 8, 1, SYSDATE - 22);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (6, 9, 1, SYSDATE - 22);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (7, 8, 1, SYSDATE - 25);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (7, 9, 1, SYSDATE - 25);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (7, 10, 1, SYSDATE - 25);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (7, 11, 0, SYSDATE - 25);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (8, 9, 1, SYSDATE - 28);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (8, 10, 1, SYSDATE - 28);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (8, 11, 0, SYSDATE - 28);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (8, 12, 1, SYSDATE - 28);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (8, 13, 1, SYSDATE - 28);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (9, 10, 1, SYSDATE - 31);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (9, 11, 0, SYSDATE - 31);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (9, 12, 1, SYSDATE - 31);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (10, 11, 0, SYSDATE - 34);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (10, 12, 1, SYSDATE - 34);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (10, 13, 1, SYSDATE - 34);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (10, 14, 1, SYSDATE - 34);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (11, 12, 1, SYSDATE - 37);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (11, 13, 1, SYSDATE - 37);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (11, 14, 1, SYSDATE - 37);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (11, 15, 1, SYSDATE - 37);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (11, 1, 0, SYSDATE - 37);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (12, 28, 1, SYSDATE - 40);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (12, 16, 1, SYSDATE - 40);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (12, 17, 1, SYSDATE - 40);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (13, 16, 1, SYSDATE - 43);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (13, 17, 1, SYSDATE - 43);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (13, 18, 0, SYSDATE - 43);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (13, 19, 1, SYSDATE - 43);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (14, 17, 1, SYSDATE - 46);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (14, 18, 0, SYSDATE - 46);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (14, 19, 1, SYSDATE - 46);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (14, 20, 1, SYSDATE - 46);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (14, 21, 1, SYSDATE - 46);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (15, 18, 0, SYSDATE - 49);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (15, 19, 1, SYSDATE - 49);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (15, 20, 1, SYSDATE - 49);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (16, 19, 1, SYSDATE - 52);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (16, 20, 1, SYSDATE - 52);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (16, 21, 1, SYSDATE - 52);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (16, 22, 1, SYSDATE - 52);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (17, 20, 1, SYSDATE - 55);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (17, 21, 1, SYSDATE - 55);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (17, 22, 1, SYSDATE - 55);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (17, 23, 0, SYSDATE - 55);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (17, 24, 1, SYSDATE - 55);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (18, 21, 1, SYSDATE - 58);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (18, 22, 1, SYSDATE - 58);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (18, 23, 0, SYSDATE - 58);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (19, 22, 1, SYSDATE - 61);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (19, 23, 0, SYSDATE - 61);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (19, 24, 1, SYSDATE - 61);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (19, 25, 1, SYSDATE - 61);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (20, 23, 0, SYSDATE - 64);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (20, 24, 1, SYSDATE - 64);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (20, 25, 1, SYSDATE - 64);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (20, 26, 1, SYSDATE - 64);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (20, 27, 1, SYSDATE - 64);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (21, 24, 1, SYSDATE - 67);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (21, 25, 1, SYSDATE - 67);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (21, 26, 1, SYSDATE - 67);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (22, 25, 1, SYSDATE - 70);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (22, 26, 1, SYSDATE - 70);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (22, 27, 1, SYSDATE - 70);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (22, 28, 0, SYSDATE - 70);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (23, 26, 1, SYSDATE - 73);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (23, 27, 1, SYSDATE - 73);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (23, 28, 0, SYSDATE - 73);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (23, 16, 1, SYSDATE - 73);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (23, 17, 1, SYSDATE - 73);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (24, 27, 1, SYSDATE - 76);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (24, 28, 0, SYSDATE - 76);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (24, 16, 1, SYSDATE - 76);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (25, 28, 0, SYSDATE - 79);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (25, 16, 1, SYSDATE - 79);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (25, 17, 1, SYSDATE - 79);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (25, 18, 1, SYSDATE - 79);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (26, 16, 1, SYSDATE - 82);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (26, 17, 1, SYSDATE - 82);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (26, 18, 1, SYSDATE - 82);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (26, 19, 1, SYSDATE - 82);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (26, 20, 0, SYSDATE - 82);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (27, 17, 1, SYSDATE - 85);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (27, 18, 1, SYSDATE - 85);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (27, 19, 1, SYSDATE - 85);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (28, 18, 1, SYSDATE - 88);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (28, 19, 1, SYSDATE - 88);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (28, 20, 0, SYSDATE - 88);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (28, 21, 1, SYSDATE - 88);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (29, 19, 1, SYSDATE - 91);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (29, 20, 0, SYSDATE - 91);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (29, 21, 1, SYSDATE - 91);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (29, 22, 1, SYSDATE - 91);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (29, 23, 1, SYSDATE - 91);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (30, 35, 0, SYSDATE - 94);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (30, 36, 1, SYSDATE - 94);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (30, 37, 1, SYSDATE - 94);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (31, 36, 1, SYSDATE - 97);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (31, 37, 1, SYSDATE - 97);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (31, 38, 1, SYSDATE - 97);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (31, 39, 1, SYSDATE - 97);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (32, 37, 1, SYSDATE - 100);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (32, 38, 1, SYSDATE - 100);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (32, 39, 1, SYSDATE - 100);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (32, 40, 0, SYSDATE - 100);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (32, 29, 1, SYSDATE - 100);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (33, 38, 1, SYSDATE - 103);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (33, 39, 1, SYSDATE - 103);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (33, 40, 0, SYSDATE - 103);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (34, 39, 1, SYSDATE - 106);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (34, 40, 0, SYSDATE - 106);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (34, 29, 1, SYSDATE - 106);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (34, 30, 1, SYSDATE - 106);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (35, 40, 0, SYSDATE - 109);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (35, 29, 1, SYSDATE - 109);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (35, 30, 1, SYSDATE - 109);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (35, 31, 1, SYSDATE - 109);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (35, 32, 1, SYSDATE - 109);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (36, 29, 1, SYSDATE - 112);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (36, 30, 1, SYSDATE - 112);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (36, 31, 1, SYSDATE - 112);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (37, 30, 1, SYSDATE - 115);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (37, 31, 1, SYSDATE - 115);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (37, 32, 1, SYSDATE - 115);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (37, 33, 0, SYSDATE - 115);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (38, 31, 1, SYSDATE - 118);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (38, 32, 1, SYSDATE - 118);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (38, 33, 0, SYSDATE - 118);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (38, 34, 1, SYSDATE - 118);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (38, 35, 1, SYSDATE - 118);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (39, 32, 1, SYSDATE - 121);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (39, 33, 0, SYSDATE - 121);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (39, 34, 1, SYSDATE - 121);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (40, 41, 0, SYSDATE - 124);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (40, 42, 1, SYSDATE - 124);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (40, 43, 1, SYSDATE - 124);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (40, 44, 1, SYSDATE - 124);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (41, 42, 1, SYSDATE - 127);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (41, 43, 1, SYSDATE - 127);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (41, 44, 1, SYSDATE - 127);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (41, 45, 1, SYSDATE - 127);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (41, 46, 0, SYSDATE - 127);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (42, 43, 1, SYSDATE - 130);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (42, 44, 1, SYSDATE - 130);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (42, 45, 1, SYSDATE - 130);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (43, 44, 1, SYSDATE - 133);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (43, 45, 1, SYSDATE - 133);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (43, 46, 0, SYSDATE - 133);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (43, 47, 1, SYSDATE - 133);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (44, 45, 1, SYSDATE - 136);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (44, 46, 0, SYSDATE - 136);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (44, 47, 1, SYSDATE - 136);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (44, 48, 1, SYSDATE - 136);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (44, 49, 1, SYSDATE - 136);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (45, 46, 0, SYSDATE - 139);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (45, 47, 1, SYSDATE - 139);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (45, 48, 1, SYSDATE - 139);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (46, 47, 1, SYSDATE - 142);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (46, 48, 1, SYSDATE - 142);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (46, 49, 1, SYSDATE - 142);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (46, 50, 1, SYSDATE - 142);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (47, 48, 1, SYSDATE - 145);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (47, 49, 1, SYSDATE - 145);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (47, 50, 1, SYSDATE - 145);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (47, 41, 0, SYSDATE - 145);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (47, 42, 1, SYSDATE - 145);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (48, 49, 1, SYSDATE - 148);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (48, 50, 1, SYSDATE - 148);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (48, 41, 0, SYSDATE - 148);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (49, 50, 1, SYSDATE - 151);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (49, 41, 0, SYSDATE - 151);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (49, 42, 1, SYSDATE - 151);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (49, 43, 1, SYSDATE - 151);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (50, 41, 0, SYSDATE - 154);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (50, 42, 1, SYSDATE - 154);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (50, 43, 1, SYSDATE - 154);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (50, 44, 1, SYSDATE - 154);
INSERT INTO note_tags (note_id, tag_id, is_ai_generated, created_at) VALUES (50, 45, 1, SYSDATE - 154);

-- ------------------------------------------------------------
-- 9. posts (50건 = 공지 2건 + 사담 48건, 썸네일 교체 반영 완료본)
-- ------------------------------------------------------------
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (50, '커뮤니티 이용 전 꼭 확인해주세요', '안녕하세요, NYO 운영팀입니다.

즐겁고 건강한 학습 커뮤니티를 만들어가기 위해 아래 사항을 꼭 지켜주시기 바랍니다.

1. 타 회원을 비방하거나 욕설이 포함된 게시글, 댓글은 사전 통보 없이 삭제될 수 있습니다.
2. 광고성 게시글 및 도배성 댓글은 반복될 경우 이용이 제한될 수 있습니다.
3. 다른 회원이 작성한 강의 자료 및 노트를 무단으로 도용하지 말아주세요.
4. 신고가 누적된 계정은 내용 확인 후 정지 또는 탈퇴 처리될 수 있습니다.

모두가 편안하게 이용할 수 있는 공간이 될 수 있도록 협조 부탁드립니다. 감사합니다.', NULL, 1800, 45, 1, 0, SYSDATE - 17, SYSDATE - 16);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (50, '서비스 정기 점검 안내', '안녕하세요, NYO 운영팀입니다.

서비스 안정화 및 신규 기능 배포를 위한 정기 점검이 아래와 같이 진행될 예정입니다.

- 점검 일시: 매주 수요일 새벽 02:00 ~ 04:00 (2시간)
- 점검 내용: 서버 인프라 점검, 신규 기능 배포, 성능 개선 작업
- 점검 시간 동안에는 로그인, 노트 작성, 댓글 등록 등 일부 기능 이용이 제한될 수 있습니다.

이용에 불편을 드려 죄송하며, 더 나은 서비스로 찾아뵙겠습니다. 감사합니다.', NULL, 1500, 40, 1, 0, SYSDATE - 10, SYSDATE - 9);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (8, '다들 하루에 몇 시간씩 공부하세요', '요즘 번아웃 온 것 같아서 다른 분들은 하루에 몇 시간 정도 공부하시는지 궁금해서 여쭤봐요.

![공부에 집중하는 모습](https://images.unsplash.com/photo-1680602239356-f919632ce80d?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1680602239356-f919632ce80d?w=800&h=600&fit=crop&auto=format&q=80', 117, 9, 0, 0, SYSDATE - 2, SYSDATE - 1);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (11, '취준 n개월차인데 다들 안 지치세요', '면접에서 계속 떨어지니까 점점 자신감이 없어지네요. 비슷한 경험 있으신 분들 어떻게 버티셨는지 궁금합니다.', NULL, 146, 12, 0, 0, SYSDATE - 5, SYSDATE - 4);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (14, '혹시 이 에러 겪어보신 분 계신가요', 'CORS 에러 때문에 반나절을 날렸어요. 프록시 설정을 바꿔봐도 계속 나서 혹시 겪어보신 분 계시면 조언 좀 부탁드려요.

![코드 에러 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 175, 15, 0, 0, SYSDATE - 8, SYSDATE - 7);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (17, '이번에 뽀모도로 타이머 써봤는데 진짜 좋네요', '25분 집중, 5분 휴식 사이클로 돌려봤는데 집중력이 확실히 달라지더라고요. 강추합니다.

![집중해서 공부하는 모습](https://images.unsplash.com/photo-1680602239356-f919632ce80d?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1680602239356-f919632ce80d?w=800&h=600&fit=crop&auto=format&q=80', 204, 18, 0, 0, SYSDATE - 11, SYSDATE - 10);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (20, '오늘 처음으로 오픈소스에 기여해봤어요', '작은 오타 수정 PR이었는데도 머지되니까 기분이 너무 좋네요. 다음엔 더 큰 기여도 해보고 싶어요.

![코드와 터미널 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 233, 21, 0, 0, SYSDATE - 14, SYSDATE - 13);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (23, '사이드 프로젝트 팀원 구합니다', '백엔드 하실 분 한 분 구하고 있어요! 저는 프론트 담당하고 있고, 소소하게 커뮤니티 서비스 하나 만들어보려고 합니다.

![함께 모여 작업하는 모습](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 262, 24, 0, 0, SYSDATE - 17, SYSDATE - 16);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (26, '리팩토링 하다가 멘붕왔습니다', '잘 돌아가던 코드 리팩토링 좀 해보겠다고 손댔다가 지금 세 시간째 못 고치고 있어요. 어디서부터 잘못됐는지 감도 안 잡히네요.

![코드 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 291, 27, 0, 0, SYSDATE - 20, SYSDATE - 19);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (29, '주말에 스터디 카페에서 다 같이 공부하실 분', '혼자 공부하니까 자꾸 늘어져서 같이 하실 분 구합니다. 강남역 근처로 생각 중이에요.

![카페에서 함께 공부하는 모습](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 320, 30, 0, 0, SYSDATE - 23, SYSDATE - 22);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (32, '강의 듣다가 막히는 부분 질문 좀 드려도 될까요', 'JPA 영속성 컨텍스트 부분이 자꾸 헷갈리는데 혹시 쉽게 설명해주실 분 계실까요.', NULL, 349, 33, 0, 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (35, '노트 정리하는 습관 언제부터 들이셨어요', '저는 이제서야 노트 정리하는 습관을 들이려고 하는데 다들 어떻게 정리하시는지 팁 있으면 공유해주세요.

![펼쳐진 노트와 펜](https://images.unsplash.com/photo-1761322572550-967ea8c0bfd9?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1761322572550-967ea8c0bfd9?w=800&h=600&fit=crop&auto=format&q=80', 378, 36, 0, 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (38, '오늘 면접 보고 왔는데 완전 멘탈 나갔어요', '기술 면접에서 아는 것도 말이 안 나와서 제대로 못 풀었어요. 다음 면접까지 어떻게 준비해야 할지 막막하네요.

![면접 장면](https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80', 407, 39, 0, 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (41, '오랜만에 글 남겨요 다들 잘 지내시나요', '한동안 취업 준비 때문에 정신없었는데 이제 좀 여유가 생겨서 인사드립니다.', NULL, 436, 2, 0, 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (44, '이 강의 들으신 분 계신가요 진짜 도움 많이 되네요', '설명이 너무 친절해서 초보자한테 딱인 것 같아요. 혹시 같이 들으신 분 있으면 후기 공유하고 싶어요.

![노트북 코드 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 465, 5, 0, 0, SYSDATE - 38, SYSDATE - 37);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (47, '코딩테스트 준비 어떻게들 하세요', '시간 재고 푸는 연습을 안 해서 그런지 실전에서 자꾸 시간이 부족하더라고요. 다들 어떤 사이트로 연습하시는지 궁금합니다.

![코딩 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 494, 8, 0, 0, SYSDATE - 41, SYSDATE - 40);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (1, '스터디 같이 하실 분 계신가요', '알고리즘 스터디 같이 하실 분 구해요. 일주일에 두 번 정도 온라인으로 만나서 문제 풀이 공유하는 방식으로 하고 싶어요. 참고로 스터디 참가비로 인당 3만원씩 미리 제 계좌로 보내주셔야 참여 가능합니다.

![함께 스터디하는 모습](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 523, 11, 0, 0, SYSDATE - 44, SYSDATE - 43);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (4, '깃 충돌 해결하다가 하루가 다 갔어요', '브랜치 두 개 합치는데 충돌이 너무 많이 나서 하나씩 해결하다 보니 벌써 저녁이네요. 다들 충돌 안 나게 어떻게 관리하세요.

![터미널 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 552, 14, 0, 0, SYSDATE - 47, SYSDATE - 46);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (7, '드디어 첫 프로젝트 배포했습니다', '혼자 만든 토이프로젝트인데 막상 배포하고 나니까 실감이 안 나네요. 다들 첫 배포 기억나시나요.

![배포 완료 터미널 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 581, 17, 0, 0, SYSDATE - 50, SYSDATE - 49);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (10, '스터디원 구하기 진짜 어렵네요', '시간대 맞는 분 찾기가 생각보다 힘든 것 같아요. 다들 스터디 어떻게 구하셨는지 궁금합니다.', NULL, 610, 20, 0, 0, SYSDATE - 53, SYSDATE - 52);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (13, '오늘도 야근각인데 다들 퇴근하셨나요', '배포 전날이라 다들 정신없으실 것 같은데 화이팅입니다.

![야근 중인 코드 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 639, 23, 0, 0, SYSDATE - 56, SYSDATE - 55);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (16, '면접 후기 공유합니다', '오늘 본 면접에서 나온 질문들 정리해서 남겨봅니다. CS 기초 질문이 생각보다 많이 나왔어요.

![면접 장면](https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80', 668, 26, 0, 0, SYSDATE - 59, SYSDATE - 58);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (19, '이직 고민 중인데 조언 구합니다', '지금 회사에서 성장이 정체된 느낌이라 이직을 고민 중인데 타이밍이 애매한 것 같아서 여러분 생각이 궁금합니다. 그 회사 다니는 사람들은 실력도 없으면서 자리만 차지하고 있다고 다들 그러더라고요.', NULL, 697, 29, 0, 0, SYSDATE - 62, SYSDATE - 61);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (22, '드디어 자격증 땄어요', '몇 달 준비했던 자격증 시험 합격했습니다! 같이 준비하시는 분들 힘내세요.

![책이 꽂힌 서가](https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80', 726, 32, 0, 0, SYSDATE - 65, SYSDATE - 64);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (25, '사이드 프로젝트 다들 몇 개 하고 계세요', '포트폴리오용으로 두 개 정도 진행 중인데 시간 관리가 생각보다 힘들더라고요.

![코드 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 755, 35, 0, 0, SYSDATE - 68, SYSDATE - 67);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (28, '스택오버플로우 보다가 알게 된 꿀팁 공유', '디버깅할 때 유용한 방법을 하나 알게 돼서 공유해요. 콘솔에 조건부 브레이크포인트 걸어두는 방법인데 진짜 편하네요.

![디버깅 중인 코드 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 784, 38, 0, 0, SYSDATE - 71, SYSDATE - 70);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (31, '공부 슬럼프 온 것 같은데 다들 어떻게 이겨내세요', '요즘 도통 집중이 안 되는데 비슷한 경험 있으신 분들 어떻게 극복하셨는지 궁금합니다.

![혼자 집중하는 모습](https://images.unsplash.com/photo-1680602239356-f919632ce80d?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1680602239356-f919632ce80d?w=800&h=600&fit=crop&auto=format&q=80', 813, 1, 0, 0, SYSDATE - 74, SYSDATE - 73);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (34, '드디어 인턴 합격 소식 받았어요', '몇 번 떨어지고 나서 받은 합격이라 더 감격스럽네요. 다들 응원해주셔서 감사합니다.

![합격 축하 악수](https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80', 842, 4, 0, 0, SYSDATE - 77, SYSDATE - 76);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (37, '책으로 공부하는 거랑 강의로 공부하는 거 어떤 게 나으세요', '저는 책이 더 잘 맞는 것 같은데 다들 어떤 방식 선호하시는지 궁금해서 여쭤봐요.', NULL, 871, 7, 0, 0, SYSDATE - 80, SYSDATE - 79);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (40, '오늘 처음 알게 된 단축키 공유합니다', 'VS Code에서 여러 줄 한꺼번에 수정하는 단축키를 이제 알았어요. 이거 알고 나니까 작업 속도가 확 빨라지네요.

![코드 에디터 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 900, 10, 0, 0, SYSDATE - 83, SYSDATE - 82);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (43, '포트폴리오 피드백 좀 받아보고 싶습니다', '혼자 만들다 보니 놓친 부분이 많을 것 같은데 편하게 의견 주시면 감사하겠습니다. 그리고 이왕 오신 김에 제 유튜브 채널 구독이랑 광고 링크도 한번 눌러주세요!

![코드 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 929, 13, 0, 0, SYSDATE - 86, SYSDATE - 85);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (46, '다들 개발 공부 시작한 계기가 뭐였어요', '저는 우연히 만든 엑셀 매크로가 재밌어서 시작했는데 다들 궁금해서 여쭤봐요.', NULL, 958, 16, 0, 0, SYSDATE - 89, SYSDATE - 88);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (49, '오늘 알고리즘 문제 하나 때문에 두 시간 날렸어요', '분명 맞는 로직인 것 같은데 계속 틀려서 나중에 보니 인덱스 하나를 잘못 잡고 있었네요.

![알고리즘 디버깅 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 987, 19, 0, 0, SYSDATE - 92, SYSDATE - 91);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (3, '주말에 스터디 카페 자리 잡기 전쟁이네요', '요즘 사람이 너무 많아서 자리 맡기가 힘든데 다들 어디서 공부하시는지 추천 부탁드려요.

![붐비는 스터디 카페](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 1016, 22, 0, 0, SYSDATE - 95, SYSDATE - 94);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (6, '드디어 3개월 걸린 프로젝트 마무리했습니다', '혼자 끌고 오느라 힘들었는데 마무리하고 나니 뭔가 후련하네요.

![프로젝트 완료 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 1045, 25, 0, 0, SYSDATE - 98, SYSDATE - 97);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (9, '신입 개발자 필수 역량이 뭐라고 생각하세요', '요즘 취업 준비하면서 이것저것 찾아보는데 다들 생각이 어떠신지 궁금해서 여쭤봐요.

![책이 꽂힌 서가](https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80', 1074, 28, 0, 0, SYSDATE - 101, SYSDATE - 100);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (12, '자격증 공부 병행하는 거 다들 어떻게 하세요', '회사 다니면서 공부 시간 확보하는 게 생각보다 어렵네요. 다들 시간 관리 팁 있으면 공유해주세요.

![책이 꽂힌 서가](https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80', 1103, 31, 0, 0, SYSDATE - 104, SYSDATE - 103);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (15, '오늘 배포하다가 서버 내려가서 식겁했네요', '다행히 롤백해서 큰 문제는 없었는데 심장 떨어지는 줄 알았어요.

![서버 로그 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 1132, 34, 0, 0, SYSDATE - 107, SYSDATE - 106);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (18, '개발자 커뮤니티 다들 어디서 활동하세요', '여기 말고도 자주 보시는 커뮤니티나 채널 있으면 추천 부탁드려요.

![함께 이야기 나누는 모습](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 1161, 37, 0, 0, SYSDATE - 110, SYSDATE - 109);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (21, '오늘 코드리뷰 받고 많이 배웠습니다', '제가 놓쳤던 예외 처리 부분을 짚어주셔서 다시 공부하게 됐어요. 리뷰 받는 게 확실히 도움이 되네요.

![코드 리뷰 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 1190, 0, 0, 0, SYSDATE - 113, SYSDATE - 112);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (24, '자기소개서 쓰다가 막혀서 조언 구합니다', '프로젝트 경험을 어떻게 풀어써야 할지 감이 안 잡히네요. 다들 어떻게 작성하셨는지 궁금합니다.', NULL, 1219, 3, 0, 0, SYSDATE - 116, SYSDATE - 115);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (27, '오늘 스터디에서 발표 맡았는데 떨렸어요', '다음엔 좀 더 여유 있게 준비해야겠다는 생각이 들었어요.

![발표하는 모습](https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80', 1248, 6, 0, 0, SYSDATE - 119, SYSDATE - 118);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (30, '책상 정리하고 공부 환경 좀 바꿔봤어요', '모니터 받침대 하나 놓았는데 목이 덜 아프네요. 작은 변화인데 확실히 도움이 됩니다.

![정리된 책상](https://images.unsplash.com/photo-1761322572550-967ea8c0bfd9?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1761322572550-967ea8c0bfd9?w=800&h=600&fit=crop&auto=format&q=80', 1277, 9, 0, 0, SYSDATE - 122, SYSDATE - 121);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (33, '졸업하고 바로 취업 안 하고 공부만 하는 거 어떻게 보세요', '고민이 많아지는 요즘인데 다들 생각을 듣고 싶어서 글 남겨봅니다.

![책이 꽂힌 서가](https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80', 1306, 12, 0, 0, SYSDATE - 125, SYSDATE - 124);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (36, '오늘 처음으로 유닛 테스트 작성해봤어요', '생각보다 재밌더라고요. 왜 이제서야 관심을 가졌을까 싶습니다.

![테스트 코드 화면](https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128215-3549cc686921?w=800&h=600&fit=crop&auto=format&q=80', 1335, 15, 0, 0, SYSDATE - 128, SYSDATE - 127);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (39, '팀 프로젝트에서 의견 충돌 났을 때 어떻게 하세요', '기술 스택 선택 때문에 의견이 갈렸는데 다들 이런 상황 어떻게 조율하시는지 궁금합니다.

![팀원들이 함께 논의하는 모습](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 1364, 18, 0, 0, SYSDATE - 131, SYSDATE - 130);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (42, '오늘 드디어 첫 월급 받았어요', '인턴이지만 첫 월급이라 감회가 새롭네요. 다들 첫 월급 기억나시나요.

![사무실에서의 한 장면](https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1758518730384-be3d205838e8?w=800&h=600&fit=crop&auto=format&q=80', 1393, 21, 0, 0, SYSDATE - 134, SYSDATE - 133);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (45, '장기 프로젝트 진행하시는 분들 동기부여 어떻게 유지하세요', '혼자 하다 보니 자꾸 미루게 되는데 다들 어떻게 꾸준히 하시는지 궁금합니다.

![코드 화면](https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1774901128283-64c62117216a?w=800&h=600&fit=crop&auto=format&q=80', 1422, 24, 0, 0, SYSDATE - 137, SYSDATE - 136);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (48, '오늘 알고리즘 스터디 첫 모임 했어요', '다들 열정 넘치셔서 저도 자극받았습니다. 앞으로 꾸준히 이어갔으면 좋겠네요.

![스터디 모임 첫 만남](https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1760351561007-526f5353cc76?w=800&h=600&fit=crop&auto=format&q=80', 1451, 27, 0, 0, SYSDATE - 140, SYSDATE - 139);
INSERT INTO posts (user_id, title, content, thumbnail_url, view_count, like_count, is_notice, is_deleted, created_at, updated_at) VALUES (2, '다들 개발서적 추천 좀 해주세요', '기초를 좀 더 다지고 싶은데 어떤 책부터 보면 좋을지 추천 부탁드립니다.

![책이 꽂힌 서가](https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80)', 'https://images.unsplash.com/photo-1499447155021-4907f71b9ef5?w=800&h=600&fit=crop&auto=format&q=80', 1480, 30, 0, 0, SYSDATE - 143, SYSDATE - 142);

-- ------------------------------------------------------------
-- 10. comments (강의/게시글 주제에 맞춘 반응, 반말/존댓말 절반씩 혼합)
-- ------------------------------------------------------------
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 1, 8, NULL, '코딩애플님 강의 스타일이 입문자한테 딱 맞는 것 같습니다.', 0, SYSDATE - 6, SYSDATE - 5);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 1, 13, NULL, '리렌더링 개념 이제 좀 감 잡힌 듯.', 0, SYSDATE - 12, SYSDATE - 11);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 1, 18, NULL, '설명이 정말 깔끔해서 이해하는 데 도움이 많이 됐습니다.', 0, SYSDATE - 18, SYSDATE - 17);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 1, 23, NULL, '예제 따라 치니까 바로 되네 신기하다.', 0, SYSDATE - 24, SYSDATE - 23);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 1, 28, 4, '리렌더링 개념이 헷갈렸는데 이제야 이해가 됩니다.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 2, 15, NULL, '예제 따라 치니까 바로 되네 신기하다.', 0, SYSDATE - 7, SYSDATE - 6);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 2, 20, NULL, '리렌더링 개념이 헷갈렸는데 이제야 이해가 됩니다.', 0, SYSDATE - 13, SYSDATE - 12);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 2, 25, NULL, '이거 보고 바로 프로젝트에 적용해봐야겠다.', 0, SYSDATE - 19, SYSDATE - 18);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 2, 30, NULL, '다음 강의도 이어서 들어보겠습니다, 감사합니다.', 0, SYSDATE - 25, SYSDATE - 24);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 2, 35, NULL, '이 부분 진짜 헷갈렸는데 덕분에 이해했다 ㅋㅋ', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 2, 40, 10, '이 예제 그대로 따라 해봤는데 잘 동작하네요, 감사합니다.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 3, 22, NULL, '다음 강의도 이어서 들어보겠습니다, 감사합니다.', 0, SYSDATE - 8, SYSDATE - 7);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 3, 27, NULL, '이 부분 진짜 헷갈렸는데 덕분에 이해했다 ㅋㅋ', 0, SYSDATE - 14, SYSDATE - 13);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 3, 32, NULL, '이 예제 그대로 따라 해봤는데 잘 동작하네요, 감사합니다.', 0, SYSDATE - 20, SYSDATE - 19);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 3, 37, 14, '코딩애플님 강의 스타일이 나랑 잘 맞는 듯.', 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 4, 29, NULL, '코딩앙마님 강의 스타일이 나랑 잘 맞는 듯.', 0, SYSDATE - 9, SYSDATE - 8);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 4, 34, NULL, '코딩앙마님 강의 스타일이 입문자한테 딱 맞는 것 같습니다.', 0, SYSDATE - 15, SYSDATE - 14);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 4, 39, NULL, '리렌더링 개념 이제 좀 감 잡힌 듯.', 0, SYSDATE - 21, SYSDATE - 20);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 4, 44, NULL, '설명이 정말 깔끔해서 이해하는 데 도움이 많이 됐습니다.', 0, SYSDATE - 27, SYSDATE - 26);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 4, 49, 19, '예제 따라 치니까 바로 되네 신기하다.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 5, 36, NULL, '설명이 정말 깔끔해서 이해하는 데 도움이 많이 됐습니다.', 0, SYSDATE - 10, SYSDATE - 9);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 5, 41, NULL, '예제 따라 치니까 바로 되네 신기하다.', 0, SYSDATE - 16, SYSDATE - 15);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 5, 46, NULL, '리렌더링 개념이 헷갈렸는데 이제야 이해가 됩니다.', 0, SYSDATE - 22, SYSDATE - 21);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 5, 2, NULL, '이거 보고 바로 프로젝트에 적용해봐야겠다.', 0, SYSDATE - 28, SYSDATE - 27);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 5, 7, NULL, '다음 강의도 이어서 들어보겠습니다, 감사합니다.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 5, 12, 25, '이 부분 진짜 헷갈렸는데 덕분에 이해했다 ㅋㅋ', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 6, 43, NULL, '이거 보고 바로 프로젝트에 적용해봐야겠다.', 0, SYSDATE - 11, SYSDATE - 10);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 6, 48, NULL, '다음 강의도 이어서 들어보겠습니다, 감사합니다.', 0, SYSDATE - 17, SYSDATE - 16);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 6, 4, NULL, '이 부분 진짜 헷갈렸는데 덕분에 이해했다 ㅋㅋ', 0, SYSDATE - 23, SYSDATE - 22);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 6, 9, 29, '이 예제 그대로 따라 해봤는데 잘 동작하네요, 감사합니다.', 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 7, 1, NULL, '이 예제 그대로 따라 해봤는데 잘 동작하네요, 감사합니다.', 0, SYSDATE - 12, SYSDATE - 11);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 7, 6, NULL, '코딩애플님 강의 스타일이 나랑 잘 맞는 듯.', 0, SYSDATE - 18, SYSDATE - 17);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 7, 11, NULL, '코딩애플님 강의 스타일이 입문자한테 딱 맞는 것 같습니다.', 0, SYSDATE - 24, SYSDATE - 23);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 7, 16, NULL, '리렌더링 개념 이제 좀 감 잡힌 듯.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 7, 21, 34, '설명이 정말 깔끔해서 이해하는 데 도움이 많이 됐습니다.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 8, 8, NULL, '이 개념 계속 헷갈렸는데 드디어 정리됐다.', 0, SYSDATE - 13, SYSDATE - 12);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 8, 13, NULL, 'JPA 개념이 헷갈렸는데 이 강의 보고 이해가 됐습니다.', 0, SYSDATE - 19, SYSDATE - 18);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 8, 18, NULL, '나무소리님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 25, SYSDATE - 24);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 8, 23, NULL, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 8, 28, NULL, '예제 코드 보니까 확 이해되네.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 8, 33, 40, '이 부분 시험에도 자주 나오던데 정리가 잘 됐네요.', 0, SYSDATE - 43, SYSDATE - 42);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 9, 15, NULL, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 14, SYSDATE - 13);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 9, 20, NULL, '예제 코드 보니까 확 이해되네.', 0, SYSDATE - 20, SYSDATE - 19);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 9, 25, NULL, '이 부분 시험에도 자주 나오던데 정리가 잘 됐네요.', 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 9, 30, 44, '이 부분 진짜 헷갈렸는데 이제 이해됐다.', 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 10, 22, NULL, '이 부분 진짜 헷갈렸는데 이제 이해됐다.', 0, SYSDATE - 15, SYSDATE - 14);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 10, 27, NULL, '나무소리님 설명 덕분에 연관관계 개념이 명확해졌습니다.', 0, SYSDATE - 21, SYSDATE - 20);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 10, 32, NULL, '이거 실무에서 진짜 많이 쓴다던데 미리 알아두길 잘했다.', 0, SYSDATE - 27, SYSDATE - 26);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 10, 37, NULL, '예제 코드까지 같이 봐주셔서 정말 감사합니다.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 10, 42, 49, '이 개념 계속 헷갈렸는데 드디어 정리됐다.', 0, SYSDATE - 39, SYSDATE - 38);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 11, 29, NULL, '예제 코드까지 같이 봐주셔서 정말 감사합니다.', 0, SYSDATE - 16, SYSDATE - 15);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 11, 34, NULL, '이 개념 계속 헷갈렸는데 드디어 정리됐다.', 0, SYSDATE - 22, SYSDATE - 21);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 11, 39, NULL, 'JPA 개념이 헷갈렸는데 이 강의 보고 이해가 됐습니다.', 0, SYSDATE - 28, SYSDATE - 27);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 11, 44, NULL, '메타코딩님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 11, 49, NULL, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 11, 5, 55, '예제 코드 보니까 확 이해되네.', 0, SYSDATE - 46, SYSDATE - 45);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 12, 36, NULL, '한빛미디어님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 17, SYSDATE - 16);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 12, 41, NULL, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 23, SYSDATE - 22);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 12, 46, NULL, '예제 코드 보니까 확 이해되네.', 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 12, 2, 59, '이 부분 시험에도 자주 나오던데 정리가 잘 됐네요.', 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 13, 43, NULL, '이 부분 시험에도 자주 나오던데 정리가 잘 됐네요.', 0, SYSDATE - 18, SYSDATE - 17);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 13, 48, NULL, '이 부분 진짜 헷갈렸는데 이제 이해됐다.', 0, SYSDATE - 24, SYSDATE - 23);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 13, 4, NULL, '나무소리님 설명 덕분에 연관관계 개념이 명확해졌습니다.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 13, 9, NULL, '이거 실무에서 진짜 많이 쓴다던데 미리 알아두길 잘했다.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 13, 14, 64, '예제 코드까지 같이 봐주셔서 정말 감사합니다.', 0, SYSDATE - 42, SYSDATE - 41);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 14, 1, NULL, '이거 실무에서 진짜 많이 쓴다던데 미리 알아두길 잘했다.', 0, SYSDATE - 19, SYSDATE - 18);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 14, 6, NULL, '예제 코드까지 같이 봐주셔서 정말 감사합니다.', 0, SYSDATE - 25, SYSDATE - 24);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 14, 11, NULL, '이 개념 계속 헷갈렸는데 드디어 정리됐다.', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 14, 16, NULL, 'JPA 개념이 헷갈렸는데 이 강의 보고 이해가 됐습니다.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 14, 21, NULL, '나무소리님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 43, SYSDATE - 42);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 14, 26, 70, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 49, SYSDATE - 48);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 15, 8, NULL, 'JPA 개념이 헷갈렸는데 이 강의 보고 이해가 됐습니다.', 0, SYSDATE - 20, SYSDATE - 19);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 15, 13, NULL, '인프런 inflearn님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 15, 18, NULL, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 15, 23, 74, '예제 코드 보니까 확 이해되네.', 0, SYSDATE - 38, SYSDATE - 37);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 16, 15, NULL, '예제 코드 보니까 확 이해되네.', 0, SYSDATE - 21, SYSDATE - 20);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 16, 20, NULL, '이 부분 시험에도 자주 나오던데 정리가 잘 됐네요.', 0, SYSDATE - 27, SYSDATE - 26);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 16, 25, NULL, '이 부분 진짜 헷갈렸는데 이제 이해됐다.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 16, 30, NULL, '인프런 inflearn님 설명 덕분에 연관관계 개념이 명확해졌습니다.', 0, SYSDATE - 39, SYSDATE - 38);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 16, 35, 79, '이거 실무에서 진짜 많이 쓴다던데 미리 알아두길 잘했다.', 0, SYSDATE - 45, SYSDATE - 44);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 17, 22, NULL, '나무소리님 설명 덕분에 연관관계 개념이 명확해졌습니다.', 0, SYSDATE - 22, SYSDATE - 21);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 17, 27, NULL, '이거 실무에서 진짜 많이 쓴다던데 미리 알아두길 잘했다.', 0, SYSDATE - 28, SYSDATE - 27);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 17, 32, NULL, '예제 코드까지 같이 봐주셔서 정말 감사합니다.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 17, 37, NULL, '이 개념 계속 헷갈렸는데 드디어 정리됐다.', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 17, 42, NULL, 'JPA 개념이 헷갈렸는데 이 강의 보고 이해가 됐습니다.', 0, SYSDATE - 46, SYSDATE - 45);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 17, 47, 85, '나무소리님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 52, SYSDATE - 51);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 18, 29, NULL, '이 개념 계속 헷갈렸는데 드디어 정리됐다.', 0, SYSDATE - 23, SYSDATE - 22);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 18, 34, NULL, 'JPA 개념이 헷갈렸는데 이 강의 보고 이해가 됐습니다.', 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 18, 39, NULL, '한코딩님 강의 듣고 바로 프로젝트에 적용해봤다.', 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 18, 44, 89, '실무에서도 이렇게 쓰는지 궁금했는데 궁금증이 풀렸습니다.', 0, SYSDATE - 41, SYSDATE - 40);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 19, 36, NULL, 'Sunkyoo Hwang님 설명이 명확해서 개념이 확실히 잡혔습니다.', 0, SYSDATE - 24, SYSDATE - 23);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 19, 41, NULL, '이 부분 계속 틀렸었는데 이제 감 잡힌 듯.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 19, 46, NULL, '직접 구현해보니 이해가 훨씬 잘 됩니다.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 19, 2, NULL, '이거 코딩테스트에서 자주 나오던데 정리 잘 됐다.', 0, SYSDATE - 42, SYSDATE - 41);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 19, 7, 94, '코딩테스트 준비하면서 계속 헷갈렸던 부분인데 도움이 많이 됐습니다.', 0, SYSDATE - 48, SYSDATE - 47);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 20, 43, NULL, '이거 코딩테스트에서 자주 나오던데 정리 잘 됐다.', 0, SYSDATE - 25, SYSDATE - 24);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 20, 48, NULL, '코딩테스트 준비하면서 계속 헷갈렸던 부분인데 도움이 많이 됐습니다.', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 20, 4, NULL, 'IOI KOREA님 강의 듣고 바로 구현해봤다.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 20, 9, NULL, '이 자료구조 관련 문제를 코딩테스트에서 본 적이 있어서 더 집중해서 봤습니다.', 0, SYSDATE - 43, SYSDATE - 42);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 20, 14, NULL, '직접 손으로 짜보니까 이해가 확실히 잘 되네.', 0, SYSDATE - 49, SYSDATE - 48);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 20, 19, 100, '그림으로만 볼 때보다 코드로 보니 훨씬 이해가 잘 됐습니다.', 0, SYSDATE - 55, SYSDATE - 54);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 21, 1, NULL, '이 자료구조 관련 문제를 코딩테스트에서 본 적이 있어서 더 집중해서 봤습니다.', 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 21, 6, NULL, '직접 손으로 짜보니까 이해가 확실히 잘 되네.', 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 21, 11, NULL, '그림으로만 볼 때보다 코드로 보니 훨씬 이해가 잘 됐습니다.', 0, SYSDATE - 38, SYSDATE - 37);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 21, 16, 104, '그림보다 코드로 보니까 확실히 이해되네.', 0, SYSDATE - 44, SYSDATE - 43);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 22, 8, NULL, '그림보다 코드로 보니까 확실히 이해되네.', 0, SYSDATE - 27, SYSDATE - 26);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 22, 13, NULL, '메타코드M님 설명이 명확해서 개념이 확실히 잡혔습니다.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 22, 18, NULL, '이 부분 계속 틀렸었는데 이제 감 잡힌 듯.', 0, SYSDATE - 39, SYSDATE - 38);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 22, 23, NULL, '직접 구현해보니 이해가 훨씬 잘 됩니다.', 0, SYSDATE - 45, SYSDATE - 44);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 22, 28, 109, '이거 코딩테스트에서 자주 나오던데 정리 잘 됐다.', 0, SYSDATE - 51, SYSDATE - 50);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 23, 15, NULL, '직접 구현해보니 이해가 훨씬 잘 됩니다.', 0, SYSDATE - 28, SYSDATE - 27);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 23, 20, NULL, '이거 코딩테스트에서 자주 나오던데 정리 잘 됐다.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 23, 25, NULL, '코딩테스트 준비하면서 계속 헷갈렸던 부분인데 도움이 많이 됐습니다.', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 23, 30, NULL, '어소트락 게임아카데미님 강의 듣고 바로 구현해봤다.', 0, SYSDATE - 46, SYSDATE - 45);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 23, 35, NULL, '이 자료구조 관련 문제를 코딩테스트에서 본 적이 있어서 더 집중해서 봤습니다.', 0, SYSDATE - 52, SYSDATE - 51);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 23, 40, 115, '직접 손으로 짜보니까 이해가 확실히 잘 되네.', 0, SYSDATE - 58, SYSDATE - 57);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 24, 22, NULL, '어소트락 게임아카데미님 강의 듣고 바로 구현해봤다.', 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 24, 27, NULL, '이 자료구조 관련 문제를 코딩테스트에서 본 적이 있어서 더 집중해서 봤습니다.', 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 24, 32, NULL, '직접 손으로 짜보니까 이해가 확실히 잘 되네.', 0, SYSDATE - 41, SYSDATE - 40);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 24, 37, 119, '그림으로만 볼 때보다 코드로 보니 훨씬 이해가 잘 됐습니다.', 0, SYSDATE - 47, SYSDATE - 46);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 25, 29, NULL, '용어가 낯설었는데 데브원영 DVWY님 설명 덕분에 감이 좀 잡혔습니다.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 25, 34, NULL, '데브원영 DVWY님 강의 듣고 구조가 이해됐다.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 25, 39, NULL, '실무에서 데이터 규모가 훨씬 크다고 하니 미리 익혀두길 잘한 것 같습니다.', 0, SYSDATE - 42, SYSDATE - 41);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 25, 44, NULL, '복잡해 보였는데 생각보다 어렵지 않네.', 0, SYSDATE - 48, SYSDATE - 47);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 25, 49, 124, '구조를 짚어주셔서 전체 흐름이 이해됐습니다.', 0, SYSDATE - 54, SYSDATE - 53);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 26, 36, NULL, '복잡해 보였는데 생각보다 어렵지 않네.', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 26, 41, NULL, '구조를 짚어주셔서 전체 흐름이 이해됐습니다.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 26, 46, NULL, '이 분야 용어 진짜 낯설었는데 이제 좀 감 잡힌다.', 0, SYSDATE - 43, SYSDATE - 42);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 26, 2, NULL, '하둡/스파크 구조가 처음엔 복잡해 보였는데 이해하기 편해졌습니다.', 0, SYSDATE - 49, SYSDATE - 48);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 26, 7, NULL, '이거 실무에서 훨씬 크게 쓴다던데 미리 봐두길 잘했다.', 0, SYSDATE - 55, SYSDATE - 54);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 26, 12, 130, '이 분야는 처음이라 차근차근 다시 봐야 할 것 같습니다.', 0, SYSDATE - 61, SYSDATE - 60);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 27, 43, NULL, '하둡/스파크 구조가 처음엔 복잡해 보였는데 이해하기 편해졌습니다.', 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 27, 48, NULL, '이거 실무에서 훨씬 크게 쓴다던데 미리 봐두길 잘했다.', 0, SYSDATE - 38, SYSDATE - 37);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 27, 4, NULL, '이 분야는 처음이라 차근차근 다시 봐야 할 것 같습니다.', 0, SYSDATE - 44, SYSDATE - 43);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 27, 9, 134, '다음 강의도 이어서 들어봐야겠다.', 0, SYSDATE - 50, SYSDATE - 49);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 28, 1, NULL, '다음 강의도 이어서 들어봐야겠다.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 28, 6, NULL, '용어가 낯설었는데 알지오 평생교육원님 설명 덕분에 감이 좀 잡혔습니다.', 0, SYSDATE - 39, SYSDATE - 38);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 28, 11, NULL, '알지오 평생교육원님 강의 듣고 구조가 이해됐다.', 0, SYSDATE - 45, SYSDATE - 44);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 28, 16, NULL, '실무에서 데이터 규모가 훨씬 크다고 하니 미리 익혀두길 잘한 것 같습니다.', 0, SYSDATE - 51, SYSDATE - 50);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 28, 21, 139, '복잡해 보였는데 생각보다 어렵지 않네.', 0, SYSDATE - 57, SYSDATE - 56);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 29, 8, NULL, '실무에서 데이터 규모가 훨씬 크다고 하니 미리 익혀두길 잘한 것 같습니다.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 29, 13, NULL, '복잡해 보였는데 생각보다 어렵지 않네.', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 29, 18, NULL, '구조를 짚어주셔서 전체 흐름이 이해됐습니다.', 0, SYSDATE - 46, SYSDATE - 45);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 29, 23, NULL, '이 분야 용어 진짜 낯설었는데 이제 좀 감 잡힌다.', 0, SYSDATE - 52, SYSDATE - 51);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 29, 28, NULL, '하둡/스파크 구조가 처음엔 복잡해 보였는데 이해하기 편해졌습니다.', 0, SYSDATE - 58, SYSDATE - 57);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 29, 33, 145, '이거 실무에서 훨씬 크게 쓴다던데 미리 봐두길 잘했다.', 0, SYSDATE - 64, SYSDATE - 63);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 30, 15, NULL, '이 분야 용어 진짜 낯설었는데 이제 좀 감 잡힌다.', 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 30, 20, NULL, '하둡/스파크 구조가 처음엔 복잡해 보였는데 이해하기 편해졌습니다.', 0, SYSDATE - 41, SYSDATE - 40);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 30, 25, NULL, '이거 실무에서 훨씬 크게 쓴다던데 미리 봐두길 잘했다.', 0, SYSDATE - 47, SYSDATE - 46);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 30, 30, 149, '이 분야는 처음이라 차근차근 다시 봐야 할 것 같습니다.', 0, SYSDATE - 53, SYSDATE - 52);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 31, 22, NULL, '이 분야는 처음이라 차근차근 다시 봐야 할 것 같습니다.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 31, 27, NULL, '다음 강의도 이어서 들어봐야겠다.', 0, SYSDATE - 42, SYSDATE - 41);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 31, 32, NULL, '용어가 낯설었는데 메타코드M님 설명 덕분에 감이 좀 잡혔습니다.', 0, SYSDATE - 48, SYSDATE - 47);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 31, 37, NULL, '메타코드M님 강의 듣고 구조가 이해됐다.', 0, SYSDATE - 54, SYSDATE - 53);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (NULL, 31, 42, 154, '실무에서 데이터 규모가 훨씬 크다고 하니 미리 익혀두길 잘한 것 같습니다.', 0, SYSDATE - 60, SYSDATE - 59);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (1, NULL, 6, NULL, '항상 신경 써주셔서 감사합니다, 지침 잘 지키면서 활동하겠습니다.', 0, SYSDATE - 2, SYSDATE - 1);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (1, NULL, 13, 156, '저도 이용수칙 확인했습니다, 서로 배려하면서 지내요.', 0, SYSDATE - 6, SYSDATE - 5);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (2, NULL, 11, NULL, '점검 시간 미리 알려주셔서 감사합니다, 참고하겠습니다.', 0, SYSDATE - 3, SYSDATE - 2);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (2, NULL, 18, 158, '수요일 새벽이면 이용에 크게 지장 없겠네요, 안내 감사합니다.', 0, SYSDATE - 7, SYSDATE - 6);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (3, NULL, 16, NULL, '저도 아직 정확한 답은 못 찾았는데 댓글들 보면서 같이 참고하려고요.', 0, SYSDATE - 4, SYSDATE - 3);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (4, NULL, 21, NULL, '나도 그런 적 있었는데 진짜 힘들지, 힘내라.', 0, SYSDATE - 5, SYSDATE - 4);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (4, NULL, 28, 161, '저도 그런 적 있었는데 시간이 지나면 나아지더라고요, 힘내세요.', 0, SYSDATE - 9, SYSDATE - 8);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (5, NULL, 26, NULL, '저도 겪어본 상황이라 마음이 쓰이네요, 잘 해결되시길 바랄게요.', 0, SYSDATE - 6, SYSDATE - 5);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (5, NULL, 33, NULL, '나도 궁금한 부분이라 답변 기다려본다.', 0, SYSDATE - 10, SYSDATE - 9);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (5, NULL, 40, 164, '저도 비슷한 고민이 있었는데 명확한 답을 못 찾겠더라고요, 저도 답변 기다려봅니다.', 0, SYSDATE - 14, SYSDATE - 13);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (6, NULL, 31, NULL, '오 이거 몰랐는데 꿀팁이네 저장한다.', 0, SYSDATE - 7, SYSDATE - 6);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (7, NULL, 36, NULL, '그동안 노력하신 게 결실을 맺은 것 같아 보기 좋습니다.', 0, SYSDATE - 8, SYSDATE - 7);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (7, NULL, 43, 167, '축하축하 다음 목표도 화이팅.', 0, SYSDATE - 12, SYSDATE - 11);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (8, NULL, 41, NULL, '나도 껴도 될까?', 0, SYSDATE - 9, SYSDATE - 8);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (8, NULL, 48, NULL, '재밌는 프로젝트일 것 같은데 저도 참여해보고 싶습니다.', 0, SYSDATE - 13, SYSDATE - 12);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (8, NULL, 6, 170, '잘 구해졌으면 좋겠다 화이팅.', 0, SYSDATE - 17, SYSDATE - 16);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (9, NULL, 46, NULL, '리팩토링은 항상 조심스럽죠, 커밋 단위로 쪼개서 하나씩 되돌려보세요.', 0, SYSDATE - 10, SYSDATE - 9);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (10, NULL, 2, NULL, '나도 껴도 될까?', 0, SYSDATE - 11, SYSDATE - 10);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (10, NULL, 9, 173, '좋은 스터디인 것 같은데 관심 있습니다.', 0, SYSDATE - 15, SYSDATE - 14);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (11, NULL, 7, NULL, '저도 겪어본 상황이라 마음이 쓰이네요, 잘 해결되시길 바랄게요.', 0, SYSDATE - 12, SYSDATE - 11);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (11, NULL, 14, NULL, '나도 궁금한 부분이라 답변 기다려본다.', 0, SYSDATE - 16, SYSDATE - 15);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (11, NULL, 21, 176, '저도 비슷한 고민이 있었는데 명확한 답을 못 찾겠더라고요, 저도 답변 기다려봅니다.', 0, SYSDATE - 20, SYSDATE - 19);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (12, NULL, 12, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 13, SYSDATE - 12);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (13, NULL, 17, NULL, '저도 요즘 그것 때문에 고민이 많은데 같이 힘내봐요.', 0, SYSDATE - 14, SYSDATE - 13);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (13, NULL, 24, 179, '그럴 때 있지, 너무 신경쓰지 마.', 0, SYSDATE - 18, SYSDATE - 17);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (14, NULL, 22, NULL, '오랜만이다 잘 지냈어?', 0, SYSDATE - 15, SYSDATE - 14);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (14, NULL, 29, NULL, '오 이게 누구야, 진짜 오랜만이다 잘 지냈지?', 0, SYSDATE - 19, SYSDATE - 18);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (14, NULL, 36, 182, '완전 공감된다 나도 그랬어.', 0, SYSDATE - 23, SYSDATE - 22);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (15, NULL, 27, NULL, '오 저도 그 강의 들었는데 진짜 도움 많이 됐어요.', 0, SYSDATE - 16, SYSDATE - 15);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (16, NULL, 32, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 17, SYSDATE - 16);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (16, NULL, 39, 185, '저는 개인적으로 그렇게 하고 있는데 다른 분들 의견도 궁금하네요.', 0, SYSDATE - 21, SYSDATE - 20);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (17, NULL, 37, NULL, '저도 비슷한 걸 찾고 있었는데 딱이네요.', 0, SYSDATE - 18, SYSDATE - 17);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (17, NULL, 44, NULL, '이런 거 구하기 힘든데 잘 됐으면 좋겠다.', 0, SYSDATE - 22, SYSDATE - 21);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (17, NULL, 2, 188, '저도 참여하고 싶은데 아직 자리 있을까요?', 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (18, NULL, 42, NULL, '나도 그런 적 있었는데 진짜 힘들지, 힘내라.', 0, SYSDATE - 19, SYSDATE - 18);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (19, NULL, 47, NULL, '그동안 노력하신 게 결실을 맺은 것 같아 보기 좋습니다.', 0, SYSDATE - 20, SYSDATE - 19);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (19, NULL, 5, 191, '축하축하 다음 목표도 화이팅.', 0, SYSDATE - 24, SYSDATE - 23);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (20, NULL, 3, NULL, '나도 그런 적 있었는데 진짜 힘들지, 힘내라.', 0, SYSDATE - 21, SYSDATE - 20);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (20, NULL, 10, NULL, '저도 그런 적 있었는데 시간이 지나면 나아지더라고요, 힘내세요.', 0, SYSDATE - 25, SYSDATE - 24);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (20, NULL, 17, 194, '나도 요즘 그거 때문에 힘든데 같이 버텨보자.', 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (21, NULL, 8, NULL, '저도 비슷한 생각을 했는데 공감됩니다.', 0, SYSDATE - 22, SYSDATE - 21);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (22, NULL, 13, NULL, '면접 질문 정리해주셔서 감사합니다, 저도 참고할게요.', 0, SYSDATE - 23, SYSDATE - 22);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (22, NULL, 20, 197, 'CS 기초 질문 비중이 크다는 거 알아두면 좋겠네요.', 0, SYSDATE - 27, SYSDATE - 26);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (23, NULL, 18, NULL, '저도 겪어본 상황이라 마음이 쓰이네요, 잘 해결되시길 바랄게요.', 0, SYSDATE - 24, SYSDATE - 23);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (23, NULL, 25, NULL, '나도 궁금한 부분이라 답변 기다려본다.', 0, SYSDATE - 28, SYSDATE - 27);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (23, NULL, 32, 200, '저도 비슷한 고민이 있었는데 명확한 답을 못 찾겠더라고요, 저도 답변 기다려봅니다.', 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (24, NULL, 23, NULL, '와 축하한다 진짜 잘됐다.', 0, SYSDATE - 25, SYSDATE - 24);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (25, NULL, 28, NULL, '저는 지금 두 개 병행하고 있는데 이 이상은 시간이 안 나더라고요.', 0, SYSDATE - 26, SYSDATE - 25);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (25, NULL, 35, 203, '오 나도 알고 싶었던 거다.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (26, NULL, 33, NULL, '오 이거 몰랐는데 꿀팁이네 저장한다.', 0, SYSDATE - 27, SYSDATE - 26);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (26, NULL, 40, NULL, '몰랐던 팁인데 덕분에 알게 됐네요.', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (26, NULL, 47, 206, '이런 거 공유해줘서 진짜 고맙다.', 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (27, NULL, 38, NULL, '저도 요즘 그것 때문에 고민이 많은데 같이 힘내봐요.', 0, SYSDATE - 28, SYSDATE - 27);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (28, NULL, 43, NULL, '와 축하한다 진짜 잘됐다.', 0, SYSDATE - 29, SYSDATE - 28);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (28, NULL, 1, 209, '멋지네요, 저도 동기부여 받고 갑니다.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (29, NULL, 48, NULL, '저도 아직 정확한 답은 못 찾았는데 댓글들 보면서 같이 참고하려고요.', 0, SYSDATE - 30, SYSDATE - 29);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (29, NULL, 6, NULL, '오 나도 알고 싶었던 거다.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (29, NULL, 13, 212, '저도 그 부분이 궁금했는데 좋은 질문이네요.', 0, SYSDATE - 38, SYSDATE - 37);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (30, NULL, 4, NULL, '오 이거 몰랐는데 꿀팁이네 저장한다.', 0, SYSDATE - 31, SYSDATE - 30);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (31, NULL, 9, NULL, '저도 포트폴리오 봐드릴게요, 편하게 링크 공유해주세요.', 0, SYSDATE - 32, SYSDATE - 31);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (31, NULL, 16, 215, '저도 피드백 받아보고 싶은데 어떤 식으로 구성하셨는지 궁금하네요.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (32, NULL, 14, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 33, SYSDATE - 32);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (32, NULL, 21, NULL, '저는 취업 준비 때문에 시작했는데 다른 분들 계기도 궁금하네요.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (32, NULL, 28, 218, '나도 계기가 뭐였는지 새삼 다시 생각해보게 되네.', 0, SYSDATE - 41, SYSDATE - 40);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (33, NULL, 19, NULL, '저도 요즘 그것 때문에 고민이 많은데 같이 힘내봐요.', 0, SYSDATE - 34, SYSDATE - 33);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (34, NULL, 24, NULL, '나도 그런 적 있었는데 진짜 힘들지, 힘내라.', 0, SYSDATE - 35, SYSDATE - 34);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (34, NULL, 31, 221, '저도 그런 적 있었는데 시간이 지나면 나아지더라고요, 힘내세요.', 0, SYSDATE - 39, SYSDATE - 38);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (35, NULL, 29, NULL, '그동안 노력하신 게 결실을 맺은 것 같아 보기 좋습니다.', 0, SYSDATE - 36, SYSDATE - 35);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (35, NULL, 36, NULL, '축하축하 다음 목표도 화이팅.', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (35, NULL, 43, 224, '축하드려요, 정말 고생 많으셨습니다.', 0, SYSDATE - 44, SYSDATE - 43);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (36, NULL, 34, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 37, SYSDATE - 36);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (37, NULL, 39, NULL, '저도 아직 정확한 답은 못 찾았는데 댓글들 보면서 같이 참고하려고요.', 0, SYSDATE - 38, SYSDATE - 37);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (37, NULL, 46, 227, '오 나도 알고 싶었던 거다.', 0, SYSDATE - 42, SYSDATE - 41);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (38, NULL, 44, NULL, '나도 그런 적 있었는데 진짜 힘들지, 힘내라.', 0, SYSDATE - 39, SYSDATE - 38);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (38, NULL, 2, NULL, '저도 그런 적 있었는데 시간이 지나면 나아지더라고요, 힘내세요.', 0, SYSDATE - 43, SYSDATE - 42);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (38, NULL, 9, 230, '나도 요즘 그거 때문에 힘든데 같이 버텨보자.', 0, SYSDATE - 47, SYSDATE - 46);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (39, NULL, 49, NULL, '저도 아직 정확한 답은 못 찾았는데 댓글들 보면서 같이 참고하려고요.', 0, SYSDATE - 40, SYSDATE - 39);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (40, NULL, 5, NULL, '코드리뷰 받으면서 배우는 게 진짜 크죠, 좋은 경험 하셨네요.', 0, SYSDATE - 41, SYSDATE - 40);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (40, NULL, 12, 233, '멋지네요, 저도 동기부여 받고 갑니다.', 0, SYSDATE - 45, SYSDATE - 44);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (41, NULL, 10, NULL, '저도 겪어본 상황이라 마음이 쓰이네요, 잘 해결되시길 바랄게요.', 0, SYSDATE - 42, SYSDATE - 41);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (41, NULL, 17, NULL, '나도 궁금한 부분이라 답변 기다려본다.', 0, SYSDATE - 46, SYSDATE - 45);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (41, NULL, 24, 236, '저도 비슷한 고민이 있었는데 명확한 답을 못 찾겠더라고요, 저도 답변 기다려봅니다.', 0, SYSDATE - 50, SYSDATE - 49);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (42, NULL, 15, NULL, '나도 그런 적 있었는데 진짜 힘들지, 힘내라.', 0, SYSDATE - 43, SYSDATE - 42);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (43, NULL, 20, NULL, '저도 적용해볼게요, 좋은 정보 공유 감사합니다.', 0, SYSDATE - 44, SYSDATE - 43);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (43, NULL, 27, 239, '오 신박하다 나도 해봐야겠다.', 0, SYSDATE - 48, SYSDATE - 47);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (44, NULL, 25, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 45, SYSDATE - 44);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (44, NULL, 32, NULL, '저는 개인적으로 그렇게 하고 있는데 다른 분들 의견도 궁금하네요.', 0, SYSDATE - 49, SYSDATE - 48);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (44, NULL, 39, 242, '나도 답 잘 못 찾겠던데 다른 사람들 답도 궁금하다.', 0, SYSDATE - 53, SYSDATE - 52);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (45, NULL, 30, NULL, '유닛 테스트 한번 맛보면 계속 쓰게 되더라고요, 저도 그랬어요.', 0, SYSDATE - 46, SYSDATE - 45);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (46, NULL, 35, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 47, SYSDATE - 46);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (46, NULL, 42, 245, '저는 개인적으로 그렇게 하고 있는데 다른 분들 의견도 궁금하네요.', 0, SYSDATE - 51, SYSDATE - 50);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (47, NULL, 40, NULL, '그동안 노력하신 게 결실을 맺은 것 같아 보기 좋습니다.', 0, SYSDATE - 48, SYSDATE - 47);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (47, NULL, 47, NULL, '축하축하 다음 목표도 화이팅.', 0, SYSDATE - 52, SYSDATE - 51);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (47, NULL, 5, 248, '축하드려요, 정말 고생 많으셨습니다.', 0, SYSDATE - 56, SYSDATE - 55);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (48, NULL, 45, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 49, SYSDATE - 48);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (49, NULL, 1, NULL, '알고리즘 스터디 꾸준히 하시면 실력 확실히 느실 거예요, 화이팅.', 0, SYSDATE - 50, SYSDATE - 49);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (49, NULL, 8, 251, '저도 알고리즘 스터디 하고 싶었는데, 잘 되시면 후기 부탁드려요.', 0, SYSDATE - 54, SYSDATE - 53);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (50, NULL, 6, NULL, '나도 그거 궁금했는데 좋은 질문이네.', 0, SYSDATE - 51, SYSDATE - 50);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (50, NULL, 13, NULL, '저는 클린 코드 추천하고 싶은데 다른 분들 추천도 궁금하네요.', 0, SYSDATE - 55, SYSDATE - 54);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (50, NULL, 20, 254, '나도 답 잘 못 찾겠던데 다른 사람들 답도 궁금하다.', 0, SYSDATE - 59, SYSDATE - 58);
-- 신고 사유와 매칭되는 비꼬는 답글 4건 (신고 시연용)
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (11, NULL, 34, NULL, '이 정도는 기본 아니에요? 다들 아시는 내용인데 굳이 질문까지 하시나 싶네요.', 0, SYSDATE - 3, SYSDATE - 2);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (16, NULL, 49, NULL, '그냥 검색만 해봐도 나오는 내용인데 그것도 안 찾아보고 물어보시는 거예요?', 0, SYSDATE - 2, SYSDATE - 1);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (4, NULL, 15, NULL, '이 정도로 힘들어하시는 거면 이 일 계속하기 어려우실 것 같은데요.', 0, SYSDATE - 4, SYSDATE - 3);
INSERT INTO comments (post_id, lecture_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at) VALUES (13, NULL, 43, NULL, '그 정도 질문에 답을 못 하신 거면 준비를 제대로 안 하신 거 아닌가요?', 0, SYSDATE - 1, SYSDATE - 0);

-- ------------------------------------------------------------
-- 11. likes (50건, 노트/게시글/강의/수강신청 겸용)
-- ------------------------------------------------------------
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (4, 'NOTE', 1, SYSDATE - 1);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (17, 'NOTE', 4, SYSDATE - 4);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (30, 'NOTE', 7, SYSDATE - 7);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (43, 'NOTE', 10, SYSDATE - 10);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (7, 'NOTE', 13, SYSDATE - 13);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (20, 'NOTE', 16, SYSDATE - 16);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (33, 'NOTE', 19, SYSDATE - 19);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (46, 'NOTE', 22, SYSDATE - 22);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (10, 'NOTE', 25, SYSDATE - 25);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (23, 'NOTE', 28, SYSDATE - 28);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (36, 'NOTE', 31, SYSDATE - 31);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (49, 'NOTE', 34, SYSDATE - 34);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (13, 'NOTE', 37, SYSDATE - 37);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (26, 'NOTE', 40, SYSDATE - 40);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (39, 'NOTE', 43, SYSDATE - 43);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (3, 'POST', 3, SYSDATE - 46);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (16, 'POST', 6, SYSDATE - 49);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (29, 'POST', 9, SYSDATE - 52);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (42, 'POST', 12, SYSDATE - 55);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (6, 'POST', 15, SYSDATE - 58);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (19, 'POST', 18, SYSDATE - 61);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (32, 'POST', 21, SYSDATE - 64);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (45, 'POST', 24, SYSDATE - 67);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (9, 'POST', 27, SYSDATE - 70);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (22, 'POST', 30, SYSDATE - 73);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (35, 'POST', 33, SYSDATE - 76);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (48, 'POST', 36, SYSDATE - 79);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (12, 'POST', 39, SYSDATE - 82);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (25, 'POST', 42, SYSDATE - 85);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (38, 'POST', 45, SYSDATE - 88);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (2, 'LECTURE', 1, SYSDATE - 91);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (15, 'LECTURE', 2, SYSDATE - 94);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (28, 'LECTURE', 3, SYSDATE - 97);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (41, 'LECTURE', 4, SYSDATE - 100);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (5, 'LECTURE', 5, SYSDATE - 103);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (18, 'LECTURE', 6, SYSDATE - 106);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (31, 'LECTURE', 7, SYSDATE - 109);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (44, 'LECTURE', 8, SYSDATE - 112);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (8, 'LECTURE', 9, SYSDATE - 115);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (21, 'LECTURE', 10, SYSDATE - 118);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (34, 'LECTURE', 11, SYSDATE - 121);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (47, 'LECTURE', 12, SYSDATE - 124);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (11, 'ENROLL', 2, SYSDATE - 127);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (24, 'ENROLL', 6, SYSDATE - 130);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (37, 'ENROLL', 10, SYSDATE - 133);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (1, 'ENROLL', 14, SYSDATE - 136);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (14, 'ENROLL', 18, SYSDATE - 139);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (27, 'ENROLL', 22, SYSDATE - 142);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (40, 'ENROLL', 26, SYSDATE - 145);
INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (4, 'ENROLL', 30, SYSDATE - 148);

-- ------------------------------------------------------------
-- 12. view_logs (50건)
-- ------------------------------------------------------------
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'NOTE', 1, TRUNC(SYSDATE - 1), SYSDATE - 1);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'POST', 2, TRUNC(SYSDATE - 3), SYSDATE - 3);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'LECTURE', 3, TRUNC(SYSDATE - 5), SYSDATE - 5);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'NOTE', 4, TRUNC(SYSDATE - 7), SYSDATE - 7);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'POST', 5, TRUNC(SYSDATE - 9), SYSDATE - 9);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'LECTURE', 6, TRUNC(SYSDATE - 11), SYSDATE - 11);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'NOTE', 7, TRUNC(SYSDATE - 13), SYSDATE - 13);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'POST', 8, TRUNC(SYSDATE - 15), SYSDATE - 15);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'LECTURE', 9, TRUNC(SYSDATE - 17), SYSDATE - 17);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'NOTE', 10, TRUNC(SYSDATE - 19), SYSDATE - 19);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'POST', 11, TRUNC(SYSDATE - 21), SYSDATE - 21);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'LECTURE', 12, TRUNC(SYSDATE - 23), SYSDATE - 23);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'NOTE', 13, TRUNC(SYSDATE - 25), SYSDATE - 25);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'POST', 14, TRUNC(SYSDATE - 27), SYSDATE - 27);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'LECTURE', 15, TRUNC(SYSDATE - 29), SYSDATE - 29);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'NOTE', 16, TRUNC(SYSDATE - 31), SYSDATE - 31);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'POST', 17, TRUNC(SYSDATE - 33), SYSDATE - 33);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'LECTURE', 18, TRUNC(SYSDATE - 35), SYSDATE - 35);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'NOTE', 19, TRUNC(SYSDATE - 37), SYSDATE - 37);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'POST', 20, TRUNC(SYSDATE - 39), SYSDATE - 39);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'LECTURE', 21, TRUNC(SYSDATE - 41), SYSDATE - 41);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'NOTE', 22, TRUNC(SYSDATE - 43), SYSDATE - 43);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'POST', 23, TRUNC(SYSDATE - 45), SYSDATE - 45);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'LECTURE', 24, TRUNC(SYSDATE - 47), SYSDATE - 47);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'NOTE', 25, TRUNC(SYSDATE - 49), SYSDATE - 49);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'POST', 26, TRUNC(SYSDATE - 51), SYSDATE - 51);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'LECTURE', 27, TRUNC(SYSDATE - 53), SYSDATE - 53);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'NOTE', 28, TRUNC(SYSDATE - 55), SYSDATE - 55);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'POST', 29, TRUNC(SYSDATE - 57), SYSDATE - 57);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'LECTURE', 30, TRUNC(SYSDATE - 59), SYSDATE - 59);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'NOTE', 31, TRUNC(SYSDATE - 61), SYSDATE - 61);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'POST', 32, TRUNC(SYSDATE - 63), SYSDATE - 63);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'LECTURE', 2, TRUNC(SYSDATE - 65), SYSDATE - 65);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'NOTE', 34, TRUNC(SYSDATE - 67), SYSDATE - 67);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'POST', 35, TRUNC(SYSDATE - 69), SYSDATE - 69);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'LECTURE', 5, TRUNC(SYSDATE - 71), SYSDATE - 71);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'NOTE', 37, TRUNC(SYSDATE - 73), SYSDATE - 73);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'POST', 38, TRUNC(SYSDATE - 75), SYSDATE - 75);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'LECTURE', 8, TRUNC(SYSDATE - 77), SYSDATE - 77);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'NOTE', 40, TRUNC(SYSDATE - 79), SYSDATE - 79);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'POST', 41, TRUNC(SYSDATE - 81), SYSDATE - 81);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'LECTURE', 11, TRUNC(SYSDATE - 83), SYSDATE - 83);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'NOTE', 43, TRUNC(SYSDATE - 85), SYSDATE - 85);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (10, 'POST', 44, TRUNC(SYSDATE - 87), SYSDATE - 87);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (17, 'LECTURE', 14, TRUNC(SYSDATE - 89), SYSDATE - 89);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (24, 'NOTE', 46, TRUNC(SYSDATE - 91), SYSDATE - 91);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (31, 'POST', 47, TRUNC(SYSDATE - 93), SYSDATE - 93);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (38, 'LECTURE', 17, TRUNC(SYSDATE - 95), SYSDATE - 95);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (45, 'NOTE', 49, TRUNC(SYSDATE - 97), SYSDATE - 97);
INSERT INTO view_logs (user_id, target_type, target_id, viewed_date, created_at) VALUES (3, 'POST', 50, TRUNC(SYSDATE - 99), SYSDATE - 99);

-- ------------------------------------------------------------
-- 13. pomodoro_records (50건)
-- ------------------------------------------------------------
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (6, 1, 1, 25, 5, SYSDATE - 1 - (25/1440), SYSDATE - 1, TRUNC(SYSDATE - 1), SYSDATE - 1);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (17, 2, 2, 50, 10, SYSDATE - 2 - (50/1440), SYSDATE - 2, TRUNC(SYSDATE - 2), SYSDATE - 2);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (28, NULL, 3, 25, 5, SYSDATE - 3 - (25/1440), SYSDATE - 3, TRUNC(SYSDATE - 3), SYSDATE - 3);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (39, 4, NULL, 50, 10, SYSDATE - 4 - (50/1440), SYSDATE - 4, TRUNC(SYSDATE - 4), SYSDATE - 4);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (1, 5, 5, 25, 5, SYSDATE - 5 - (25/1440), SYSDATE - 5, TRUNC(SYSDATE - 5), SYSDATE - 5);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (12, NULL, 6, 50, 10, SYSDATE - 6 - (50/1440), SYSDATE - 6, TRUNC(SYSDATE - 6), SYSDATE - 6);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (23, 7, 7, 25, 5, SYSDATE - 7 - (25/1440), SYSDATE - 7, TRUNC(SYSDATE - 7), SYSDATE - 7);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (34, 8, NULL, 50, 10, SYSDATE - 8 - (50/1440), SYSDATE - 8, TRUNC(SYSDATE - 8), SYSDATE - 8);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (45, NULL, 9, 25, 5, SYSDATE - 9 - (25/1440), SYSDATE - 9, TRUNC(SYSDATE - 9), SYSDATE - 9);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (7, 10, 10, 50, 10, SYSDATE - 10 - (50/1440), SYSDATE - 10, TRUNC(SYSDATE - 10), SYSDATE - 10);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (18, 11, 11, 25, 5, SYSDATE - 11 - (25/1440), SYSDATE - 11, TRUNC(SYSDATE - 11), SYSDATE - 11);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (29, NULL, NULL, 50, 10, SYSDATE - 12 - (50/1440), SYSDATE - 12, TRUNC(SYSDATE - 12), SYSDATE - 12);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (40, 13, 13, 25, 5, SYSDATE - 13 - (25/1440), SYSDATE - 13, TRUNC(SYSDATE - 13), SYSDATE - 13);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (2, 14, 14, 50, 10, SYSDATE - 14 - (50/1440), SYSDATE - 14, TRUNC(SYSDATE - 14), SYSDATE - 14);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (13, NULL, 15, 25, 5, SYSDATE - 15 - (25/1440), SYSDATE - 15, TRUNC(SYSDATE - 15), SYSDATE - 15);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (24, 16, NULL, 50, 10, SYSDATE - 16 - (50/1440), SYSDATE - 16, TRUNC(SYSDATE - 16), SYSDATE - 16);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (35, 17, 17, 25, 5, SYSDATE - 17 - (25/1440), SYSDATE - 17, TRUNC(SYSDATE - 17), SYSDATE - 17);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (46, NULL, 18, 50, 10, SYSDATE - 18 - (50/1440), SYSDATE - 18, TRUNC(SYSDATE - 18), SYSDATE - 18);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (8, 19, 19, 25, 5, SYSDATE - 19 - (25/1440), SYSDATE - 19, TRUNC(SYSDATE - 19), SYSDATE - 19);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (19, 20, NULL, 50, 10, SYSDATE - 20 - (50/1440), SYSDATE - 20, TRUNC(SYSDATE - 20), SYSDATE - 20);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (30, NULL, 21, 25, 5, SYSDATE - 21 - (25/1440), SYSDATE - 21, TRUNC(SYSDATE - 21), SYSDATE - 21);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (41, 22, 22, 50, 10, SYSDATE - 22 - (50/1440), SYSDATE - 22, TRUNC(SYSDATE - 22), SYSDATE - 22);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (3, 23, 23, 25, 5, SYSDATE - 23 - (25/1440), SYSDATE - 23, TRUNC(SYSDATE - 23), SYSDATE - 23);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (14, NULL, NULL, 50, 10, SYSDATE - 24 - (50/1440), SYSDATE - 24, TRUNC(SYSDATE - 24), SYSDATE - 24);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (25, 25, 25, 25, 5, SYSDATE - 25 - (25/1440), SYSDATE - 25, TRUNC(SYSDATE - 25), SYSDATE - 25);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (36, 26, 26, 50, 10, SYSDATE - 26 - (50/1440), SYSDATE - 26, TRUNC(SYSDATE - 26), SYSDATE - 26);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (47, NULL, 27, 25, 5, SYSDATE - 27 - (25/1440), SYSDATE - 27, TRUNC(SYSDATE - 27), SYSDATE - 27);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (9, 28, NULL, 50, 10, SYSDATE - 28 - (50/1440), SYSDATE - 28, TRUNC(SYSDATE - 28), SYSDATE - 28);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (20, 29, 29, 25, 5, SYSDATE - 29 - (25/1440), SYSDATE - 29, TRUNC(SYSDATE - 29), SYSDATE - 29);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (31, NULL, 30, 50, 10, SYSDATE - 30 - (50/1440), SYSDATE - 30, TRUNC(SYSDATE - 30), SYSDATE - 30);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (42, 31, 31, 25, 5, SYSDATE - 31 - (25/1440), SYSDATE - 31, TRUNC(SYSDATE - 31), SYSDATE - 31);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (4, 1, NULL, 50, 10, SYSDATE - 32 - (50/1440), SYSDATE - 32, TRUNC(SYSDATE - 32), SYSDATE - 32);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (15, NULL, 33, 25, 5, SYSDATE - 33 - (25/1440), SYSDATE - 33, TRUNC(SYSDATE - 33), SYSDATE - 33);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (26, 3, 34, 50, 10, SYSDATE - 34 - (50/1440), SYSDATE - 34, TRUNC(SYSDATE - 34), SYSDATE - 34);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (37, 4, 35, 25, 5, SYSDATE - 35 - (25/1440), SYSDATE - 35, TRUNC(SYSDATE - 35), SYSDATE - 35);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (48, NULL, NULL, 50, 10, SYSDATE - 36 - (50/1440), SYSDATE - 36, TRUNC(SYSDATE - 36), SYSDATE - 36);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (10, 6, 37, 25, 5, SYSDATE - 37 - (25/1440), SYSDATE - 37, TRUNC(SYSDATE - 37), SYSDATE - 37);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (21, 7, 38, 50, 10, SYSDATE - 38 - (50/1440), SYSDATE - 38, TRUNC(SYSDATE - 38), SYSDATE - 38);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (32, NULL, 39, 25, 5, SYSDATE - 39 - (25/1440), SYSDATE - 39, TRUNC(SYSDATE - 39), SYSDATE - 39);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (43, 9, NULL, 50, 10, SYSDATE - 40 - (50/1440), SYSDATE - 40, TRUNC(SYSDATE - 40), SYSDATE - 40);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (5, 10, 41, 25, 5, SYSDATE - 41 - (25/1440), SYSDATE - 41, TRUNC(SYSDATE - 41), SYSDATE - 41);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (16, NULL, 42, 50, 10, SYSDATE - 42 - (50/1440), SYSDATE - 42, TRUNC(SYSDATE - 42), SYSDATE - 42);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (27, 12, 43, 25, 5, SYSDATE - 43 - (25/1440), SYSDATE - 43, TRUNC(SYSDATE - 43), SYSDATE - 43);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (38, 13, NULL, 50, 10, SYSDATE - 44 - (50/1440), SYSDATE - 44, TRUNC(SYSDATE - 44), SYSDATE - 44);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (49, NULL, 45, 25, 5, SYSDATE - 45 - (25/1440), SYSDATE - 45, TRUNC(SYSDATE - 45), SYSDATE - 45);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (11, 15, 46, 50, 10, SYSDATE - 46 - (50/1440), SYSDATE - 46, TRUNC(SYSDATE - 46), SYSDATE - 46);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (22, 16, 47, 25, 5, SYSDATE - 47 - (25/1440), SYSDATE - 47, TRUNC(SYSDATE - 47), SYSDATE - 47);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (33, NULL, NULL, 50, 10, SYSDATE - 48 - (50/1440), SYSDATE - 48, TRUNC(SYSDATE - 48), SYSDATE - 48);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (44, 18, 49, 25, 5, SYSDATE - 49 - (25/1440), SYSDATE - 49, TRUNC(SYSDATE - 49), SYSDATE - 49);
INSERT INTO pomodoro_records (user_id, lecture_id, note_id, focus_minutes, break_minutes, started_at, ended_at, record_date, created_at) VALUES (6, 19, 50, 50, 10, SYSDATE - 50 - (50/1440), SYSDATE - 50, TRUNC(SYSDATE - 50), SYSDATE - 50);

-- ------------------------------------------------------------
-- 14. chat_histories (50건, 강의 주제별 질문/답변 25쌍)
-- ------------------------------------------------------------
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (5, 1, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 1, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (5, 1, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''React 기초 0강 : 리액트왜 쓰는지 알려줌 (+ 수강시 필요 사전지식)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 1 + (1/1440), '1');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (14, 2, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. React JS #7 state, useState - 초보자를 위한 리액트 강좌 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 3, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (14, 2, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''React JS #7 state, useState - 초보자를 위한 리액트 강좌'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 3 + (1/1440), '2');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (23, 3, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. 리액트 코드짜는 법 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 5, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (23, 3, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''리액트 코드짜는 법'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 5 + (1/1440), '3');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (32, 4, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. React JS #1 강의 소개 - 초보자를 위한 리액트 강좌 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 7, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (32, 4, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''React JS #1 강의 소개 - 초보자를 위한 리액트 강좌'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 7 + (1/1440), '4');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (41, 5, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. 깃헙 개발자들이 React 안쓰는 이유 : Web Component 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 9, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (41, 5, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''깃헙 개발자들이 React 안쓰는 이유 : Web Component'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 9 + (1/1440), '5');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (1, 6, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. 와 Vite 쓰면 리액트 10배 빨라짐 (과장아님) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 11, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (1, 6, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''와 Vite 쓰면 리액트 10배 빨라짐 (과장아님)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 11 + (1/1440), '6');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (10, 7, NULL, 'USER', '리액트 컴포넌트 렌더링 관련해서 질문 드립니다. 2022 new 리액트 2강 : JSX 문법은 3개가 다임 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 13, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (10, 7, NULL, 'ASSISTANT', '네, 리액트 컴포넌트 렌더링 부분을 예시와 함께 다시 설명드릴게요. ''''2022 new 리액트 2강 : JSX 문법은 3개가 다임'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 13 + (1/1440), '7');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (19, 8, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 스프링 부트 강의 - 1-1강 Spring Boot 개요 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 15, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (19, 8, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''스프링 부트 강의 - 1-1강 Spring Boot 개요'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 15 + (1/1440), '8');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (28, 9, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 17, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (28, 9, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''김영한 백엔드 개발자 자바 스프링 JPA 실무 로드맵'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 17 + (1/1440), '9');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (37, 10, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 19, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (37, 10, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''스프링 5 기초 강의 5-1강 Spring Data JPA의 이해(1)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 19 + (1/1440), '10');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (46, 11, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요? 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 21, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (46, 11, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''스프링부트 개념정리 with JPA 1강 - 스프링의 핵심은 무엇인가요?'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 21 + (1/1440), '11');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (6, 12, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. [스프링 부트 기초 강의] 4강. 3.4 JPA 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 23, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (6, 12, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''[스프링 부트 기초 강의] 4강. 3.4 JPA'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 23 + (1/1440), '12');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (15, 13, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 25, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (15, 13, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''스프링 5 기초 강의 5-4강 Spring Data JPA 실습(2)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 25 + (1/1440), '13');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (24, 14, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 27, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (24, 14, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''스프링 5 기초 강의 5-3강 Spring Data JPA 실습(1)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 27 + (1/1440), '14');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (33, 15, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 29, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (33, 15, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 29 + (1/1440), '15');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (42, 16, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 실전! 스프링 부트와 JPA 활용2 - 강좌 소개 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 31, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (42, 16, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''실전! 스프링 부트와 JPA 활용2 - 강좌 소개'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 31 + (1/1440), '16');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (2, 17, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. 스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 33, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (2, 17, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''스프링 5 기초 강의 5-6강 Spring Data JPA 실습(4)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 33 + (1/1440), '17');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (11, 18, NULL, 'USER', '스프링 JPA 영속성 컨텍스트 관련해서 질문 드립니다. [스프링 부트] 게시판 무작정 따라하기 - 소개 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 35, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (11, 18, NULL, 'ASSISTANT', '네, 스프링 JPA 영속성 컨텍스트 부분을 예시와 함께 다시 설명드릴게요. ''''[스프링 부트] 게시판 무작정 따라하기 - 소개'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 35 + (1/1440), '18');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (20, 19, NULL, 'USER', '자료구조와 알고리즘 시간복잡도 관련해서 질문 드립니다. [C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 37, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (20, 19, NULL, 'ASSISTANT', '네, 자료구조와 알고리즘 시간복잡도 부분을 예시와 함께 다시 설명드릴게요. ''''[C++] 어서와! 자료구조와 알고리즘은 처음이지? 강의 개요'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 37 + (1/1440), '19');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (29, 20, NULL, 'USER', '자료구조와 알고리즘 시간복잡도 관련해서 질문 드립니다. [알고리즘 강의] 힙 자료구조 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 39, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (29, 20, NULL, 'ASSISTANT', '네, 자료구조와 알고리즘 시간복잡도 부분을 예시와 함께 다시 설명드릴게요. ''''[알고리즘 강의] 힙 자료구조'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 39 + (1/1440), '20');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (38, 21, NULL, 'USER', '자료구조와 알고리즘 시간복잡도 관련해서 질문 드립니다. [자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 41, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (38, 21, NULL, 'ASSISTANT', '네, 자료구조와 알고리즘 시간복잡도 부분을 예시와 함께 다시 설명드릴게요. ''''[자료구조와 알고리즘 강의 5시간 완성 1편] - 환경설정과 데이터구조 배열 실습'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 41 + (1/1440), '21');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (47, 22, NULL, 'USER', '자료구조와 알고리즘 시간복잡도 관련해서 질문 드립니다. [자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 43, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (47, 22, NULL, 'ASSISTANT', '네, 자료구조와 알고리즘 시간복잡도 부분을 예시와 함께 다시 설명드릴게요. ''''[자료구조와 알고리즘 강의 5시간 완성 2편] - Linked list, Stack, Queue, tree, graph'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 43 + (1/1440), '22');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (7, 23, NULL, 'USER', '자료구조와 알고리즘 시간복잡도 관련해서 질문 드립니다. 자료구조 / 알고리즘 강의 8화 스택 (Stack) 구현 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 45, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (7, 23, NULL, 'ASSISTANT', '네, 자료구조와 알고리즘 시간복잡도 부분을 예시와 함께 다시 설명드릴게요. ''''자료구조 / 알고리즘 강의 8화 스택 (Stack) 구현'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 45 + (1/1440), '23');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (16, 24, NULL, 'USER', '자료구조와 알고리즘 시간복잡도 관련해서 질문 드립니다. 자료구조 / 알고리즘 강의 1화 - 링크드 리스트(linked list) 구현 (1/2) 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 47, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (16, 24, NULL, 'ASSISTANT', '네, 자료구조와 알고리즘 시간복잡도 부분을 예시와 함께 다시 설명드릴게요. ''''자료구조 / 알고리즘 강의 1화 - 링크드 리스트(linked list) 구현 (1/2)'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 47 + (1/1440), '24');
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (25, 25, NULL, 'USER', '하둡과 스파크의 차이 관련해서 질문 드립니다. 빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA 강의 내용 중에 이해가 잘 안 되는 부분이 있는데 좀 더 쉽게 설명해주실 수 있나요?', SYSDATE - 49, NULL);
INSERT INTO chat_histories (user_id, lecture_id, root_question_id, sender_role, message, created_at, recommended_lecture_ids) VALUES (25, 25, NULL, 'ASSISTANT', '네, 하둡과 스파크의 차이 부분을 예시와 함께 다시 설명드릴게요. ''''빅데이터 아키텍처에서 하둡 플랫폼과 카프카의 역할|HDFS, SPARK, KAFKA'''' 강의를 함께 참고하시면 이해에 도움이 되실 거예요.', SYSDATE - 49 + (1/1440), '25');

-- ------------------------------------------------------------
-- 15. images (노트 40건 - 본문 삽입 이미지와 동일 URL / 게시글 20건)
-- ------------------------------------------------------------
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (1, NULL, 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DOM-model.svg', 'DOM-model.svg', 40977, 0, SYSDATE - 7);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (2, NULL, 'https://upload.wikimedia.org/wikipedia/commons/5/53/Css_box_model.svg', 'Css_box_model.svg', 41954, 0, SYSDATE - 10);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (3, NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg', 'Box-model.svg', 42931, 0, SYSDATE - 13);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (4, NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/42/React-example-virtual-dom-diff.svg', 'React-example-virtual-dom-diff.svg', 43908, 0, SYSDATE - 16);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (6, NULL, 'https://upload.wikimedia.org/wikipedia/commons/5/53/Css_box_model.svg', 'Css_box_model.svg', 44885, 0, SYSDATE - 22);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (7, NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg', 'Box-model.svg', 45862, 0, SYSDATE - 25);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (8, NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/42/React-example-virtual-dom-diff.svg', 'React-example-virtual-dom-diff.svg', 46839, 0, SYSDATE - 28);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (9, NULL, 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DOM-model.svg', 'DOM-model.svg', 47816, 0, SYSDATE - 31);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (11, NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Box-model.svg', 'Box-model.svg', 48793, 0, SYSDATE - 37);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (12, NULL, 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 'Client-Server_3-tier_architecture_-_en.png', 49770, 0, SYSDATE - 40);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (13, NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 'Client-server-model.svg', 50747, 0, SYSDATE - 43);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (14, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 'Traditional_client-server_diagram.svg', 51724, 0, SYSDATE - 46);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (16, NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 'Client-server-model.svg', 52701, 0, SYSDATE - 52);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (17, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 'Traditional_client-server_diagram.svg', 53678, 0, SYSDATE - 55);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (18, NULL, 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 'Client-Server_3-tier_architecture_-_en.png', 54655, 0, SYSDATE - 58);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (19, NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 'Client-server-model.svg', 55632, 0, SYSDATE - 61);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (21, NULL, 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 'Client-Server_3-tier_architecture_-_en.png', 56609, 0, SYSDATE - 67);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (22, NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 'Client-server-model.svg', 57586, 0, SYSDATE - 70);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (23, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 'Traditional_client-server_diagram.svg', 58563, 0, SYSDATE - 73);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (24, NULL, 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 'Client-Server_3-tier_architecture_-_en.png', 59540, 0, SYSDATE - 76);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (26, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 'Traditional_client-server_diagram.svg', 60517, 0, SYSDATE - 82);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (27, NULL, 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Client-Server_3-tier_architecture_-_en.png', 'Client-Server_3-tier_architecture_-_en.png', 61494, 0, SYSDATE - 85);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (28, NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Client-server-model.svg', 'Client-server-model.svg', 62471, 0, SYSDATE - 88);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (29, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/30/Traditional_client-server_diagram.svg', 'Traditional_client-server_diagram.svg', 63448, 0, SYSDATE - 91);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (31, NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/CPT-LinkedLists-addingnode.svg', 'CPT-LinkedLists-addingnode.svg', 64425, 0, SYSDATE - 97);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (32, NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/47/Binary_heap.svg', 'Binary_heap.svg', 65402, 0, SYSDATE - 100);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (33, NULL, 'https://upload.wikimedia.org/wikipedia/commons/2/29/Data_stack.svg', 'Data_stack.svg', 66379, 0, SYSDATE - 103);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (34, NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/da/Binary_search_tree.svg', 'Binary_search_tree.svg', 67356, 0, SYSDATE - 106);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (36, NULL, 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Singly-linked-list.svg', 'Singly-linked-list.svg', 68333, 0, SYSDATE - 112);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (37, NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/CPT-LinkedLists-addingnode.svg', 'CPT-LinkedLists-addingnode.svg', 69310, 0, SYSDATE - 115);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (38, NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/47/Binary_heap.svg', 'Binary_heap.svg', 70287, 0, SYSDATE - 118);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (39, NULL, 'https://upload.wikimedia.org/wikipedia/commons/2/29/Data_stack.svg', 'Data_stack.svg', 71264, 0, SYSDATE - 121);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (41, NULL, 'https://upload.wikimedia.org/wikipedia/commons/9/90/MapReduce_realisation_in_Hadoop.svg', 'MapReduce_realisation_in_Hadoop.svg', 72241, 0, SYSDATE - 127);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (42, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Hdfsarchitecture.gif', 'Hdfsarchitecture.gif', 73218, 0, SYSDATE - 130);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (43, NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/e8/HDFS.png', 'HDFS.png', 74195, 0, SYSDATE - 133);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (44, NULL, 'https://upload.wikimedia.org/wikipedia/commons/8/85/Hadoop-HighLevel_hadoop_architecture-640x460.png', 'Hadoop-HighLevel_hadoop_architecture-640x460.png', 75172, 0, SYSDATE - 136);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (46, NULL, 'https://upload.wikimedia.org/wikipedia/commons/a/af/Kafka_Job_Queue_Architecture_diagram.svg', 'Kafka_Job_Queue_Architecture_diagram.svg', 76149, 0, SYSDATE - 142);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (47, NULL, 'https://upload.wikimedia.org/wikipedia/commons/9/90/MapReduce_realisation_in_Hadoop.svg', 'MapReduce_realisation_in_Hadoop.svg', 77126, 0, SYSDATE - 145);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (48, NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Hdfsarchitecture.gif', 'Hdfsarchitecture.gif', 78103, 0, SYSDATE - 148);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (49, NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/e8/HDFS.png', 'HDFS.png', 79080, 0, SYSDATE - 151);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 3, 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=600&fit=crop&auto=format&q=80', 'photo_041.jpg', 80057, 0, SYSDATE - 1);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 4, 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=800&h=600&fit=crop&auto=format&q=80', 'photo_042.jpg', 81034, 1, SYSDATE - 3);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 5, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop&auto=format&q=80', 'photo_043.jpg', 82011, 2, SYSDATE - 5);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 6, 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop&auto=format&q=80', 'photo_044.jpg', 82988, 0, SYSDATE - 7);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 7, 'https://images.unsplash.com/photo-1550439062-609e1531270e?w=800&h=600&fit=crop&auto=format&q=80', 'photo_045.jpg', 83965, 1, SYSDATE - 9);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 8, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80', 'photo_046.jpg', 84942, 2, SYSDATE - 11);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 9, 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop&auto=format&q=80', 'photo_047.jpg', 85919, 0, SYSDATE - 13);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 10, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop&auto=format&q=80', 'photo_048.jpg', 86896, 1, SYSDATE - 15);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 11, 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop&auto=format&q=80', 'photo_049.jpg', 87873, 2, SYSDATE - 17);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 12, 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=600&fit=crop&auto=format&q=80', 'photo_050.jpg', 88850, 0, SYSDATE - 19);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 13, 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=600&fit=crop&auto=format&q=80', 'photo_051.jpg', 89827, 1, SYSDATE - 21);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 14, 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&h=600&fit=crop&auto=format&q=80', 'photo_052.jpg', 90804, 2, SYSDATE - 23);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 15, 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?w=800&h=600&fit=crop&auto=format&q=80', 'photo_053.jpg', 91781, 0, SYSDATE - 25);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 16, 'https://images.unsplash.com/photo-1607706189992-eae578626c86?w=800&h=600&fit=crop&auto=format&q=80', 'photo_054.jpg', 92758, 1, SYSDATE - 27);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 17, 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&h=600&fit=crop&auto=format&q=80', 'photo_055.jpg', 93735, 2, SYSDATE - 29);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 18, 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&h=600&fit=crop&auto=format&q=80', 'photo_056.jpg', 94712, 0, SYSDATE - 31);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 19, 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&h=600&fit=crop&auto=format&q=80', 'photo_057.jpg', 95689, 1, SYSDATE - 33);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 20, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop&auto=format&q=80', 'photo_058.jpg', 96666, 2, SYSDATE - 35);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 21, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop&auto=format&q=80', 'photo_059.jpg', 97643, 0, SYSDATE - 37);
INSERT INTO images (note_id, post_id, image_url, original_name, file_size, display_order, created_at) VALUES (NULL, 22, 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop&auto=format&q=80', 'photo_060.jpg', 98620, 1, SYSDATE - 39);

-- ------------------------------------------------------------
-- 16. reports (10건, 신고 사유와 실제 대상 콘텐츠가 서로 일치)
-- ------------------------------------------------------------
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (32, 'COMMENT', 256, '제가 질문한 글에 ''이 정도는 기본 아니에요? 다들 아시는 내용인데''라며 비꼬는 댓글을 남겼습니다. 무시하는 뉘앙스라 신고합니다.', 'PENDING', SYSDATE - 3, SYSDATE - 2);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (47, 'COMMENT', 257, '''그것도 안 찾아보고 물어보시는 거예요?''라며 성의 없이 비꼬는 댓글을 남겼습니다.', 'REVIEWED', SYSDATE - 6, SYSDATE - 5);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (11, 'COMMENT', 258, '제 글에 ''이 일 계속하기 어려우실 것 같은데요''라며 은근히 무시하는 댓글을 남겨서 기분이 상했습니다.', 'PENDING', SYSDATE - 9, SYSDATE - 8);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (38, 'COMMENT', 259, '''준비를 제대로 안 하신 거 아닌가요?''라는 식으로 비꼬듯 댓글을 남겼습니다.', 'REVIEWED', SYSDATE - 12, SYSDATE - 11);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (17, 'NOTE', 5, '노트 본문 하단에 ''카톡 오픈채팅으로 문의 주세요 (유료 판매, 3천원)''라는 광고성 판매 문구가 붙어 있어 신고합니다.', 'PENDING', SYSDATE - 15, SYSDATE - 14);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (44, 'NOTE', 20, '작성자가 스스로 ''다른 블로그 글을 그대로 긁어온 것''이라고 밝히고 있어 표절/무단 도용으로 신고합니다.', 'REVIEWED', SYSDATE - 18, SYSDATE - 17);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (18, 'NOTE', 35, '노트 본문에 개인 전화번호(010-9284-1173)가 그대로 노출되어 있어 개인정보 보호를 위해 신고합니다.', 'PENDING', SYSDATE - 21, SYSDATE - 20);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (9, 'POST', 17, '스터디 모집 글인데 ''참가비로 인당 3만원씩 미리 계좌로 보내달라''고 요구하고 있어 금전 편취가 의심되어 신고합니다.', 'PENDING', SYSDATE - 24, SYSDATE - 23);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (8, 'POST', 31, '포트폴리오 피드백 요청 글인데 본문에 본인 유튜브 채널 구독과 광고 링크 클릭을 유도하는 문구가 포함되어 있어 신고합니다.', 'REVIEWED', SYSDATE - 27, SYSDATE - 26);
INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (39, 'POST', 23, '특정 회사 재직자를 향해 ''실력도 없으면서 자리만 차지하고 있다''는 비하성 표현이 포함되어 있어 신고합니다.', 'PENDING', SYSDATE - 30, SYSDATE - 29);

-- ------------------------------------------------------------
-- 17. instructor_applications (20건)
-- ------------------------------------------------------------
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (3, 1, '프론트엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', NULL, 1, '스타트업 재직중', '프론트엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_001.pdf', '이력서_001.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 5, SYSDATE - 4, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (8, 2, '백엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-2', 4, 'IT 대기업 재직중', '백엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_002.pdf', '이력서_002.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 8, SYSDATE - 7, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (13, 3, 'CS 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-3', 7, '개인 개발자', 'CS 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_003.pdf', '이력서_003.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 11, SYSDATE - 10, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (18, 4, '빅데이터 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-4', 10, '프리랜서', '빅데이터 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_004.pdf', '이력서_004.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'APPROVED', 50, SYSDATE - 13, SYSDATE - 14, SYSDATE - 13, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (23, 1, '프론트엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-5', 13, '교육 스타트업 재직중', '프론트엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_005.pdf', '이력서_005.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'REJECTED', 50, SYSDATE - 16, SYSDATE - 17, SYSDATE - 16, '제출된 증빙 자료만으로는 전문성을 확인하기 어려워 반려되었습니다.');
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (28, 2, '백엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', NULL, 1, NULL, '백엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_006.pdf', '이력서_006.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 20, SYSDATE - 19, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (33, 3, 'CS 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-7', 4, '스타트업 재직중', 'CS 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_007.pdf', '이력서_007.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 23, SYSDATE - 22, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (38, 4, '빅데이터 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-8', 7, 'IT 대기업 재직중', '빅데이터 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_008.pdf', '이력서_008.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 26, SYSDATE - 25, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (43, 1, '프론트엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-9', 10, '개인 개발자', '프론트엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_009.pdf', '이력서_009.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'APPROVED', 50, SYSDATE - 28, SYSDATE - 29, SYSDATE - 28, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (48, 2, '백엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-10', 13, '프리랜서', '백엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_010.pdf', '이력서_010.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'REJECTED', 50, SYSDATE - 31, SYSDATE - 32, SYSDATE - 31, '제출된 증빙 자료만으로는 전문성을 확인하기 어려워 반려되었습니다.');
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (4, 3, 'CS 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', NULL, 1, '교육 스타트업 재직중', 'CS 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_011.pdf', '이력서_011.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 35, SYSDATE - 34, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (9, 4, '빅데이터 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-12', 4, NULL, '빅데이터 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_012.pdf', '이력서_012.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 38, SYSDATE - 37, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (14, 1, '프론트엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-13', 7, '스타트업 재직중', '프론트엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_013.pdf', '이력서_013.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 41, SYSDATE - 40, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (19, 2, '백엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-14', 10, 'IT 대기업 재직중', '백엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_014.pdf', '이력서_014.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'APPROVED', 50, SYSDATE - 43, SYSDATE - 44, SYSDATE - 43, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (24, 3, 'CS 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-15', 13, '개인 개발자', 'CS 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_015.pdf', '이력서_015.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'REJECTED', 50, SYSDATE - 46, SYSDATE - 47, SYSDATE - 46, '제출된 증빙 자료만으로는 전문성을 확인하기 어려워 반려되었습니다.');
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (29, 4, '빅데이터 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', NULL, 1, '프리랜서', '빅데이터 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_016.pdf', '이력서_016.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 50, SYSDATE - 49, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (34, 1, '프론트엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-17', 4, '교육 스타트업 재직중', '프론트엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_017.pdf', '이력서_017.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 53, SYSDATE - 52, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (39, 2, '백엔드 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-18', 7, NULL, '백엔드 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_018.pdf', '이력서_018.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'PENDING', NULL, NULL, SYSDATE - 56, SYSDATE - 55, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (44, 3, 'CS 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-19', 10, '스타트업 재직중', 'CS 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_019.pdf', '이력서_019.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'APPROVED', 50, SYSDATE - 58, SYSDATE - 59, SYSDATE - 58, NULL);
INSERT INTO instructor_applications (user_id, category_id, bio, portfolio_url, career_years, company, curriculum, attachment_url, attachment_name, motivation, privacy_consent, status, reviewed_by, reviewed_at, created_at, updated_at, reject_reason) VALUES (49, 4, '빅데이터 분야에서 실무 경험을 쌓아온 개발자입니다. 실전 프로젝트 경험을 바탕으로 강의하고 싶습니다.', 'https://github.com/instructor-applicant-20', 13, 'IT 대기업 재직중', '빅데이터 입문부터 실전 프로젝트까지 이어지는 커리큘럼을 구성하고자 합니다.', 'https://storage.googleapis.com/nyo_images/instructor-applications/resume_020.pdf', '이력서_020.pdf', '제가 학습하며 어려웠던 부분을 다른 학습자들에게는 더 쉽게 전달하고 싶어 신청합니다.', 1, 'REJECTED', 50, SYSDATE - 61, SYSDATE - 62, SYSDATE - 61, '제출된 증빙 자료만으로는 전문성을 확인하기 어려워 반려되었습니다.');

COMMIT;
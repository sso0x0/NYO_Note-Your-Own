# NYO (Note Your Own)

노트/포모도로/강의/커뮤니티 기능을 제공하는 프로젝트입니다.
백엔드(Spring Boot)와 프론트엔드(React + Vite)로 구성되어 있습니다.

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Java 17, Spring Boot 3.5.16, Spring Data JPA, Spring Security, JWT |
| DB | Oracle Database (XE) |
| Frontend | React 19, Vite 8 |
| 빌드 도구 | Gradle (backend), npm (frontend) |

## 프로젝트 구조

```
nyo/
├── backend/          # Spring Boot 서버
│   └── src/main/java/com/nyo/
│       ├── domain/   # user, post, comment, category, lecture, note, pomodoro, chat, common
│       └── global/   # config, security, exception
└── frontend/          # React (Vite) 클라이언트
    └── src/
        ├── components/
        ├── pages/
        └── api/
```

## 사전 준비물

아래 프로그램들을 미리 설치해주세요.

- **JDK 17** (Java 17 이상)
- **Oracle Database (XE)** — 로컬에 설치되어 있어야 합니다 (`localhost:1521/XE`)
- **Node.js** (LTS 버전 권장, npm 포함)
- **Git**
- IDE: IntelliJ (backend) / VSCode (frontend) 권장

## 1. 저장소 클론

```bash
git clone https://github.com/sso0x0/NYO_Note-Your-Own.git
cd NYO_Note-Your-Own
```

## 2. 백엔드(Spring Boot) 세팅

### 2-1. 환경변수(.env) 설정

`backend` 폴더 안에 `.env` 파일을 새로 만들고, 아래 내용을 본인의 Oracle DB 계정 정보로 채워주세요.
(`.env`는 git에 올라가지 않으니 각자 로컬에 직접 만들어야 합니다. 팀 슬랙/노션에서 공유받으세요.)

```env
DB_USERNAME=본인_DB_계정
DB_PASSWORD=본인_DB_비밀번호
```

> `application.yaml`에서 아래처럼 이 값을 참조하고 있습니다.
> ```yaml
> spring:
>   datasource:
>     url: jdbc:oracle:thin:@localhost:1521/XE
>     username: ${DB_USERNAME}
>     password: ${DB_PASSWORD}
> ```

### 2-2. Oracle DB 확인

- Oracle XE가 로컬에서 `1521` 포트로 떠 있어야 합니다.
- `ddl-auto: none`으로 설정되어 있어서 **테이블을 자동으로 생성해주지 않습니다.** 팀에서 공유하는 DDL 스크립트(또는 덤프)를 미리 실행해서 스키마를 맞춰주세요.

### 2-3. 실행

IntelliJ에서 `backend` 폴더를 Gradle 프로젝트로 열거나, 터미널에서 직접 실행합니다.

```bash
cd backend
./gradlew bootRun        # Mac/Linux
gradlew.bat bootRun       # Windows
```

정상적으로 뜨면 기본적으로 `http://localhost:8080` 에서 서버가 실행됩니다.

## 3. 프론트엔드(React) 세팅

```bash
cd frontend
npm install
npm run dev
```

실행 후 터미널에 뜨는 주소(기본값 `http://localhost:5173`)로 접속하면 됩니다.

주요 npm 스크립트:
| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 빌드 결과 미리보기 |

## 4. 자주 발생하는 문제

- **`ORA-` 관련 DB 연결 에러**: Oracle XE 서비스가 켜져 있는지, `.env`의 계정 정보가 맞는지 확인하세요.
- **`.env` 인식이 안 될 때**: `.env` 파일 위치가 `backend/.env`가 맞는지 확인해주세요. (`me.paulschwarz:spring-dotenv` 라이브러리가 이 파일을 읽어옵니다.)
- **포트 충돌 (8080 / 5173)**: 다른 프로세스가 해당 포트를 쓰고 있지 않은지 확인하세요.

## 5. 브랜치 / 협업 규칙

> 팀 컨벤션에 맞게 아래 내용을 채워서 사용하세요. (예시)

- 브랜치 전략: `main` / `develop` / `feature/기능명`
- 커밋 메시지 컨벤션: `feat`, `fix`, `refactor`, `docs`, `chore` 등
- PR 시 리뷰어 최소 1인 이상 지정

---

문의사항은 팀 채널에 남겨주세요 🙌
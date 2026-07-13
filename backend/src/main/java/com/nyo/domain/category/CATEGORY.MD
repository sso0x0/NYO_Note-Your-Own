# Category API 설명

NYO 프로젝트의 카테고리(Category) 도메인 구조와 요청 처리 흐름을 정리한 문서입니다.

## 레이어 구조

```
Controller  →  Service  →  Repository  →  Entity (DB)
```

| 레이어 | 역할 | 파일 |
|---|---|---|
| Controller | HTTP 요청/응답 처리, 검증 트리거 | `CategoryController` |
| Service (Interface) | 비즈니스 로직 규격 정의 | `CategoryService` |
| Service (Impl) | 실제 비즈니스 로직 구현 | `CategoryServiceImpl` |
| Repository | DB 접근 (JPA) | `CategoryRepository` |
| Entity | DB 테이블과 매핑되는 객체 | `Category` |
| Request DTO | 클라이언트 → 서버 입력 데이터 | `CategoryRequest` |
| Response DTO | 서버 → 클라이언트 출력 데이터 | `CategoryResponse` |

각 레이어는 자기 역할만 담당합니다. Controller는 로직 없이 위임만 하고, Service가 실제 비즈니스 로직(검증, 변환, 저장 지시)을 처리하며, Repository는 DB 접근만 담당합니다.

## 요청 처리 흐름 (카테고리 생성 예시)

```
POST /api/categories
Body: { "name": "프론트엔드" }
```

1. **클라이언트 → Controller**
    - `CategoryController.createCategory()`가 요청을 받음
    - `@RequestBody`가 JSON을 `CategoryRequest` 객체로 변환
    - `@Valid`가 유효성 검증 수행

2. **Controller → Service**
    - Controller는 로직 없이 바로 위임: `categoryService.createCategory(request)`

3. **Service 내부 로직**
    - `existsByName()`으로 이름 중복 체크
    - 문제 없으면 `CategoryRequest` → `Category` 엔티티로 변환
    - `categoryRepository.save()`로 DB 저장 → PK가 채워진 엔티티 반환

4. **Service → DTO 변환**
    - `CategoryResponse.from(saved)`로 엔티티를 응답 DTO로 변환

5. **Service → Controller → 클라이언트**
    - Controller가 `ResponseEntity`로 HTTP 상태코드를 씌워서 최종 응답

## 왜 Entity를 직접 응답으로 안 쓰나?

- DTO를 분리하면 DB 구조가 외부에 그대로 노출되지 않음
- 요청/응답에 필요한 필드만 선택적으로 노출 가능
- Entity 구조가 바뀌어도 API 스펙(DTO)은 영향받지 않도록 분리 가능

## API 엔드포인트

| Method | URL | 설명 |
|---|---|---|
| POST | `/api/categories` | 카테고리 생성 |
| GET | `/api/categories` | 카테고리 전체 목록 조회 |
| GET | `/api/categories/{id}` | 카테고리 단건 조회 |

## 참고 / TODO

- 현재 `IllegalArgumentException`을 직접 던지고 있어서, `@RestControllerAdvice` 기반의 `GlobalExceptionHandler`로 예외를 잡아 적절한 HTTP 상태코드(400, 404 등)로 매핑하는 작업이 필요함
- `createCategory`의 중복 체크(`existsByName`) 후 `save`하는 흐름은 동시 요청 시 레이스 컨디션 여지가 있음 → `name` 컬럼에 DB unique 제약을 걸어두면 안전
- 현재는 Create, Read(목록/단건)만 구현됨 → Update, Delete는 추후 MVP 단계에 맞춰 추가 예정
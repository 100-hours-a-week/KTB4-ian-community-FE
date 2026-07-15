# PULSE 백엔드 구현 가이드

이 문서는 읽기 전용으로 확인한 `../week4/community` Spring 코드의 실제 계약을 기준으로 작성했다. 프론트엔드는 현재 쿠키 기반 로그인, CSRF, 게시글·댓글·좋아요 API를 그대로 사용하며 백엔드 코드는 변경하지 않았다.

## 현재 계약 확인

- 인증: Access/Refresh Token은 모두 HttpOnly 쿠키다. Access 경로는 `/`, Refresh 경로는 `/api/users`다.
- 갱신: `POST /api/users/refresh`, 성공은 본문 없는 `204`이며 두 쿠키를 회전한다.
- 게시글: 목록 `GET /api/posts`, 상세 `GET /api/posts/{postId}`, 생성 `POST /api/posts/{userId}`, 수정·삭제 `PATCH|DELETE /api/posts/{postId}`다.
- 댓글: 현재 경로에 `/users/{userId}`가 포함되며 본문 필드는 `comment`다.
- 게시글 생성 DTO에는 `content`, `imageUrl`이 있고 수정 DTO에는 `title`, `content`, `imageUrl`이 필요하다.
- 프로필 변경 DTO는 `profile_image` URL을 받으며 실제 파일 업로드 계약은 없다.

## 북마크 영구 저장

권장 엔티티는 `Bookmark(bookmarkId, userId FK, postId FK, createdAt)`이며 `(userId, postId)` unique 제약을 둔다.

```text
POST   /api/posts/{postId}/bookmarks
DELETE /api/posts/{postId}/bookmarks
GET    /api/bookmarks?page=0&size=10
GET    /api/posts/{postId}/bookmark-status
```

응답은 최소 `{ "postId": 1, "bookmarked": true }`를 제공한다. 중복 POST와 이미 삭제된 DELETE는 멱등하게 처리하고, 소유자는 URL의 사용자 ID가 아니라 Principal로 판정한다. 프론트는 이 API 전까지 `localStorage` snapshot으로 같은 브라우저 내 동작을 제공한다.

## 이미지 업로드

- 게시글 이미지 최대 1개, PNG/JPEG/WebP, 권장 최대 10MB
- MIME 헤더뿐 아니라 실제 파일 signature를 검증한다.
- `POST /api/uploads/images` 후 URL을 DTO에 넣거나 게시글 API를 multipart로 전환한다.
- 로컬 개발 저장소와 S3 호환 운영 저장소를 환경별로 분리한다.
- UUID 기반 파일명, 접근 가능한 HTTPS URL, 업로드 실패 원자성을 보장한다.
- 게시글 수정·삭제와 회원탈퇴 시 교체된 파일 및 orphan 파일을 정리한다.
- 프로필도 multipart 업로드, 기존 이미지 삭제, 기본 이미지 정책, 새 `profileImage` URL 응답을 제공한다.

## API 개선 권고

Principal과 중복되는 사용자 경로를 제거한다.

현재 로그인 응답은 사용자 ID 본문을 제공하지 않고 별도의 `GET /api/users/me`도 없다. 새 세션에서 프로필·댓글 등 사용자 ID 경로를 안정적으로 조립하려면 `GET /api/users/me`를 추가해 `userId`, `email`, `nickname`, `profileImage`를 반환하거나, 아래처럼 사용자 ID 경로 자체를 제거해야 한다.

`PostDetailResponse`에도 작성자 `user_id`를 추가해야 프론트가 닉네임 중복 가능성 없이 수정·삭제 옵션을 표시할 수 있다. 댓글 응답은 이미 `user_id`를 제공하므로 같은 계약으로 맞추는 것이 좋다.

```text
POST   /api/posts
POST   /api/posts/{postId}/comments
PATCH  /api/posts/{postId}/comments/{commentId}
DELETE /api/posts/{postId}/comments/{commentId}
```

게시글 생성/수정 DTO도 필수 필드가 서로 다르지 않게 정리한다. 모든 시간은 UTC `Z` 또는 offset이 있는 ISO-8601로 반환한다. 오류는 `{ "code": "POST_NOT_FOUND", "message": "피드를 찾을 수 없습니다." }`처럼 일관되게 반환한다.

| 상황                  | 권장 상태 | 코드                                    |
| --------------------- | --------: | --------------------------------------- |
| 북마크 중복/충돌      |       409 | `BOOKMARK_CONFLICT`                     |
| 게시글·댓글 없음      |       404 | `POST_NOT_FOUND`, `COMMENT_NOT_FOUND`   |
| 작성자 권한 없음      |       403 | `FORBIDDEN`                             |
| 이미지 형식/크기 오류 |   400/413 | `INVALID_IMAGE_TYPE`, `IMAGE_TOO_LARGE` |
| 현재 비밀번호 불일치  |       400 | `CURRENT_PASSWORD_MISMATCH`             |

## JWT·CORS 점검

- Refresh 성공 `204`, Access/Refresh 쿠키 동시 회전, 캐시 방지 헤더를 검증한다.
- 개발 HTTP와 운영 HTTPS의 `Secure`, `SameSite`를 환경별로 적용한다.
- CORS는 정확한 프론트 Origin과 `allowCredentials(true)`를 사용한다.
- `expired_access_token`과 `invalid_refresh_token`, `expired_refresh_token`, `refresh_token_reused`, family/user mismatch 응답을 일관되게 유지한다.
- 프론트에 토큰 문자열을 JSON으로 노출하지 않는다.
- 현재 Access Cookie의 `Max-Age`와 JWT 만료가 모두 600초라 브라우저가 쿠키를 먼저 제거하면 서버는 `expired_access_token` 대신 일반 `unauthorized`를 반환할 수 있다. 서버가 만료 사유를 일관되게 판별해야 한다면 Access Cookie 수명을 JWT보다 조금 길게 두거나, 만료 직전 Refresh를 공식 클라이언트 계약으로 명시한다. 프론트는 현재 로그인/갱신 후 9분이 지난 첫 보호 요청 전에 선제 Refresh한다.

## 백엔드 테스트 요구사항

북마크 중복·타인 삭제 차단, 게시글/댓글 작성자 인가, 이미지 2개 이상·MIME 위조 거부, 현재 비밀번호 불일치, 탈퇴 사용자 수정 차단, ISO 시간 직렬화, 동시 Refresh Token Rotation과 재사용 탐지를 자동화한다.

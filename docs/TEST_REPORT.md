# 테스트 보고서

## 범위

- 단위: Day.js 상대 시간 경계, BookmarkStore, LikeStore, 소유권 판정, ModalManager, JWT single-flight·9분 선제 갱신
- 통합: 피드 LNB/좋아요/북마크/작성 진입, 인증 폼 구조, POST 재시도 보존
- UI: 피드 수치·생성/편집 액션, 전체 딤드, 인증 50/50, 북마크·좋아요 페이지 공유, 상세/댓글 소유권 옵션, 설정 사용자 정보·Title3 중앙 제목, Access Token 선제 갱신

## 환경과 수치

- Chromium, 1920×1080
- 콘텐츠 폭 480px, 중심 X 960px, LNB 폭 180px, 간격 40px: Playwright 허용 오차 내 통과
- 콘솔 오류와 로컬 에셋 404: 테스트 경로에서 발견되지 않음
- 목록 렌더링은 단일 요청/단일 fragment 교체, 좋아요·북마크·댓글 변경은 대상 DOM만 갱신
- 동시 만료 2건에서 Refresh 네트워크 호출 1회, 각 원 요청 1회 재시도
- 발급 후 9분 경과 상태에서 보호 API보다 Refresh가 먼저 1회 호출되고 피드 화면과 URL이 유지됨

## 최종 결과

| 구분               | 결과 |
| ------------------ | ---- |
| CSS 빌드           | PASS |
| 단위 30개          | PASS |
| 페이지 통합 9개    | PASS |
| Playwright UI 9개  | PASS |
| `npm run test:all` | PASS |

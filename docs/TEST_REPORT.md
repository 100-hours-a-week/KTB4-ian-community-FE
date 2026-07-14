# 테스트 보고서

## 범위

- 단위: Day.js 상대 시간 경계, BookmarkStore, ModalManager, JWT single-flight
- 통합: 피드 LNB/좋아요/북마크/작성 진입, 인증 폼 구조, POST 재시도 보존
- UI: 피드 수치·생성 모달, 인증 50/50, 북마크 지속성, 상세 댓글/옵션 메뉴

## 환경과 수치

- Chromium, 1920×1080
- 콘텐츠 폭 480px, 중심 X 960px, LNB 폭 180px, 간격 40px: Playwright 허용 오차 내 통과
- 콘솔 오류와 로컬 에셋 404: 테스트 경로에서 발견되지 않음
- 목록 렌더링은 단일 요청/단일 fragment 교체, 좋아요·북마크·댓글 변경은 대상 DOM만 갱신
- 동시 만료 2건에서 Refresh 네트워크 호출 1회, 각 원 요청 1회 재시도

## 최종 결과

| 구분 | 결과 |
|---|---|
| CSS 빌드 | PASS |
| 단위 26개 | PASS |
| 페이지 통합 5개 | PASS |
| Playwright UI 4개 | PASS |
| `npm run test:all` | PASS |

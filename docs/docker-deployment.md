# 프론트엔드 컨테이너 빌드 및 검증

운영 이미지는 Node 빌드 단계에서 Webpack React SPA를 빌드하고 `index.html`, `dist` 및
Nginx 설정만 실행 단계로 복사합니다. Nginx는 패키지에 포함된 루트가 아닌 사용자로
실행되고, SPA 경로를 제공하며 `/api/`와 `/uploads/`를 `backend`라는 이름의 Compose
서비스로 전달합니다.

## 사전 요구사항

- Buildx를 포함한 Docker 엔진
- `docker buildx ls`에서 `linux/amd64`를 표시하는 빌더
- Git

## EC2 이미지 빌드

```bash
IMAGE_TAG=community-frontend:<frontend-commit> \
  ./scripts/build-image.sh
```

Apple Silicon 호스트에서는 기본값 `PLATFORM=linux/amd64`를 유지해야 합니다.
레지스트리를 사용하지 않고 전송용 압축 파일과 체크섬을 생성하려면 다음을 실행합니다.

```bash
IMAGE_TAG=community-frontend:<frontend-commit> \
EXPORT_TAR=1 \
  ./scripts/build-image.sh
```

압축 파일은 무시 대상인 `artifacts/` 디렉터리 아래에 생성됩니다. 이 압축 파일을 Git에
추가하지 않습니다.

## 실행 이미지 검증

```bash
IMAGE_TAG=community-frontend:<frontend-commit> \
  ./scripts/verify-image.sh
```

검증 과정은 이미지 아키텍처와 실행 사용자를 확인하고 Nginx 설정을 검증하며, SPA 대체
경로와 `/api` 프록시를 시험하고, 정적 캐시 헤더를 확인하며 실행 이미지에 Node.js가
없는지 검증합니다.

## 공개 설정과 비밀값

운영 브라우저는 동일 출처 요청을 사용하므로 API 빌드 인수가 필요하지 않습니다. 브라우저
JavaScript에 묶이는 값은 공개 정보입니다. JWT, 데이터베이스, AWS 또는 기타 서버 자격
증명을 Docker 빌드 인수나 프론트엔드 환경 변수로 전달하지 않습니다.

릴리스 전에 번들에 예상하지 못한 값이 있는지 검사합니다.

```bash
rg -n 'AKIA|BEGIN .*PRIVATE KEY|DB_PASSWORD|JWT_SECRET' dist
find dist -type f -name '*.map' -print
```

두 명령 모두 아무것도 출력하지 않아야 합니다.

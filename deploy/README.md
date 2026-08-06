# EC2 Nginx 배포

운영 프론트엔드는 브라우저의 HTTPS 출처를 API 및 이미지 요청에 사용합니다. Nginx는
SPA를 제공하고 `/api/`, `/uploads/`, `/images/`를 `127.0.0.1:8080`에 바인드된
백엔드로 전달합니다.

1. `npm ci`와 `npm run build:react`를 실행합니다.
2. `index.html`과 `dist/`를 `/var/www/pulse`로 복사합니다.
3. `deploy/nginx/pulse.conf.example`을 Nginx 사이트 디렉터리로 복사합니다.
4. `community.example.com`을 실제 도메인으로 교체하고 유효한 TLS 인증서를 설정합니다.
5. `sudo nginx -t`로 검증한 다음 Nginx 설정을 다시 불러옵니다.

`/h2-console`을 프록시하지 않습니다. 백엔드 포트 8080은 비공개로 유지하고 HTTPS 443만
외부에 공개합니다. 포트 80은 HTTPS 리디렉션이나 인증서 검증에만 사용합니다.

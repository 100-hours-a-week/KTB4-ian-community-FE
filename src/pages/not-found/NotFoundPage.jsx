import { Button } from "../../shared/ui/Button.jsx";

export function NotFoundPage({ onFeed }) {
  return (
    <main className="page status-page" aria-labelledby="not-found-title">
      <header className="status-page__header">
        <h1 id="not-found-title">페이지를 찾을 수 없습니다.</h1>
      </header>
      <section className="status-page__content">
        <p>요청하신 주소가 변경되었거나 존재하지 않습니다.</p>
        <Button
          variant="outline"
          className="status-page__action"
          onClick={onFeed}
        >
          피드로 돌아가기
        </Button>
      </section>
    </main>
  );
}

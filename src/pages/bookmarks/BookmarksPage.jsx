export function BookmarksPage() {
  return (
    <main className="page bookmarks-page" data-testid="bookmarks-page-ready">
      <header className="bookmarks-page__header">
        <h1>북마크</h1>
      </header>
      <section className="coming-soon" aria-labelledby="bookmarks-coming-title">
        <h2 id="bookmarks-coming-title">북마크 기능을 준비하고 있어요.</h2>
        <p>곧 원하는 피드를 저장하고 다시 확인할 수 있어요.</p>
      </section>
    </main>
  );
}

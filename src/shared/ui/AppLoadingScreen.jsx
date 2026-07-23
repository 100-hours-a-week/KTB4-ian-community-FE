import { lnbLogoImage } from "../assets/index.js";

export function AppLoadingScreen() {
  return (
    <main className="app-boot" aria-busy="true" aria-live="polite">
      <img src={lnbLogoImage} alt="PULSE" />
      <span className="app-boot__indicator" aria-hidden="true" />
      <p>PULSE를 준비하고 있습니다.</p>
    </main>
  );
}

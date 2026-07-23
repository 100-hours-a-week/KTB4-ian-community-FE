import { SignupForm } from "../../features/auth/signup/ui/SignupForm.jsx";
import { signupArtworkImage } from "../../shared/assets/index.js";

export function SignupPage({ onAuthenticated, onLogin }) {
  return (
    <main className="auth-page signup-page">
      <section className="auth-artwork" aria-label="PULSE 소개 이미지">
        <img src={signupArtworkImage} alt="" />
      </section>
      <section className="auth-main">
        <SignupForm onAuthenticated={onAuthenticated} onLogin={onLogin} />
      </section>
    </main>
  );
}

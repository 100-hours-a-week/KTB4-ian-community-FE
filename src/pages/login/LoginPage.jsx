import { LoginForm } from "../../features/auth/login/LoginForm.jsx";
import { signupArtworkImage } from "../../shared/assets/index.js";

export function LoginPage({ onAuthenticated, onSignup }) {
  return (
    <main className="auth-page login-page">
      <section className="auth-artwork" aria-label="PULSE 소개 이미지">
        <img src={signupArtworkImage} alt="" />
      </section>
      <section className="auth-main">
        <LoginForm onAuthenticated={onAuthenticated} onSignup={onSignup} />
      </section>
    </main>
  );
}

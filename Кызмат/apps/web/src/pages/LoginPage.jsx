import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ identifier, password });
      navigate(location.state?.from || "/profile", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel mx-auto max-w-xl">
      <h1 className="title">{t("auth.loginTitle")}</h1>
      <p className="subtitle">{t("auth.loginSubtitle")}</p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="label">{t("auth.identifier")}</label>
          <input className="input" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        </div>

        <div>
          <label className="label">{t("auth.password")}</label>
          <input
            required
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? t("auth.loginLoading") : t("auth.loginSubmit")}
          </button>
          <Link className="text-sm font-semibold text-slate-900 underline" to="/register">
            {t("auth.createAccount")}
          </Link>
        </div>
      </form>
    </section>
  );
}

export default LoginPage;

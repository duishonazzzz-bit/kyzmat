import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getLocalizedCityOptions } from "../data/kyrgyzstanCities";

function RegisterPage() {
  const { register } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
    city: "Бишкек",
    bio: "",
    skills: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSpecialist = form.role === "worker";

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        ...form,
        skills: isSpecialist
          ? form.skills
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
        bio: form.bio || "",
      });
      navigate("/cabinet");
    } catch (err) {
      setError(err.response?.data?.message || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel mx-auto max-w-2xl">
      <h1 className="title">{t("auth.registerTitle")}</h1>
      <p className="subtitle">{t("auth.registerSubtitle")}</p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <label className="label">{t("auth.fullName")}</label>
          <input className="input" name="fullName" required value={form.fullName} onChange={handleChange} />
        </div>

        <div>
          <label className="label">{t("auth.username")}</label>
          <input
            className="input"
            name="username"
            placeholder={t("auth.usernamePlaceholder")}
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="label">{t("auth.email")}</label>
          <input className="input" name="email" type="email" value={form.email} onChange={handleChange} />
        </div>

        <div>
          <label className="label">{t("auth.phone")}</label>
          <input className="input" name="phone" value={form.phone} onChange={handleChange} />
        </div>

        <div>
          <label className="label">{t("auth.password")}</label>
          <input
            required
            className="input"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="label">{t("auth.profileType")}</label>
          <select className="input" name="role" value={form.role} onChange={handleChange}>
            <option value="customer">{t("role.customer")}</option>
            <option value="worker">{t("role.worker")}</option>
          </select>
        </div>

        <div>
          <label className="label">{t("auth.city")}</label>
          <select className="input" name="city" value={form.city} onChange={handleChange}>
            {getLocalizedCityOptions(form.city, language).map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </div>

        {isSpecialist ? (
          <div className="sm:col-span-2">
            <label className="label">{t("auth.skills")}</label>
            <input
              className="input"
              name="skills"
              placeholder={t("auth.skillsPlaceholder")}
              value={form.skills}
              onChange={handleChange}
            />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <label className="label">{isSpecialist ? t("auth.aboutWorker") : t("auth.aboutCustomer")}</label>
          <textarea
            className="input min-h-24"
            name="bio"
            placeholder={isSpecialist ? t("auth.bioWorkerPlaceholder") : t("auth.bioCustomerPlaceholder")}
            value={form.bio}
            onChange={handleChange}
          />
        </div>

        {error ? <p className="sm:col-span-2 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="sm:col-span-2 flex items-center gap-3">
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? t("auth.registerLoading") : t("auth.registerSubmit")}
          </button>
          <Link className="text-sm font-semibold text-slate-900 underline" to="/login">
            {t("auth.haveAccount")}
          </Link>
        </div>
      </form>
    </section>
  );
}

export default RegisterPage;

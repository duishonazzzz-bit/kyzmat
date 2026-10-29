import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getLocalizedPersonName } from "../i18n/contentTranslations";
import BrandLogo from "./BrandLogo";

const desktopNavLinkClass = ({ isActive }) =>
  `inline-flex h-9 max-w-[138px] items-center justify-center rounded-full border px-3 text-[13px] font-semibold transition ${
    isActive
      ? "border-[#8d1530] bg-[#8d1530] text-white shadow-[0_10px_24px_-18px_rgba(141,21,48,0.8)]"
      : "border-white/50 bg-white/72 text-slate-900 shadow-[0_8px_20px_-18px_rgba(73,20,33,0.28)] backdrop-blur-sm hover:border-[#ead9de] hover:bg-white/88 hover:text-[#5c0f22]"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `flex min-h-11 items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? "border-[#8d1530] bg-[#8d1530] text-white shadow-[0_12px_28px_-22px_rgba(141,21,48,0.8)]"
      : "border-[#ead9de] bg-white text-slate-900 hover:border-[#d8bcc5] hover:bg-[#fff8fa]"
  }`;

function MenuIcon({ open }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        {open ? (
        <path
          d="M6 6L18 18M18 6L6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      ) : (
        <>
          <path d="M4 7H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M4 12H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M4 17H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      )}
    </svg>
  );
}

function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-full border border-white/60 bg-white/76 p-1 shadow-[0_8px_20px_-18px_rgba(73,20,33,0.28)] backdrop-blur-sm ${compact ? "gap-0.5" : "gap-1"}`}>
      {["ru", "ky", "en"].map((value) => {
        const active = language === value;

        return (
          <button
            key={value}
            type="button"
            className={`inline-flex h-8 min-w-[42px] items-center justify-center rounded-full px-3 text-xs font-bold transition ${
              active ? "bg-[#8d1530] text-white" : "text-slate-700 hover:bg-white hover:text-[#5c0f22]"
            }`}
            onClick={() => setLanguage(value)}
          >
            {t(`language.${value}`)}
          </button>
        );
      })}
    </div>
  );
}

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const localizedUserName = getLocalizedPersonName(user, language, user?.fullName);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const navigationItems = useMemo(
    () =>
      [
        { to: "/jobs", label: t("nav.jobs"), show: true },
        { to: "/workers", label: t("nav.workers"), show: true },
        { to: "/cabinet", label: t("nav.cabinet"), show: isAuthenticated },
        { to: "/chat", label: t("nav.messages"), show: isAuthenticated },
        { to: "/subscriptions", label: t("nav.subscriptions"), show: isAuthenticated },
        { to: "/cabinet/admin", label: t("nav.admin"), show: isAuthenticated && user?.role === "admin" },
        {
          to: "/jobs/new",
          label: t("nav.createJob"),
          show: isAuthenticated && (user?.role === "customer" || user?.role === "admin"),
        },
      ].filter((item) => item.show),
    [isAuthenticated, t, user?.role],
  );

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-[1000] border-b border-[#eadfda]/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-3 py-2 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 flex-1 items-center lg:w-[150px] lg:max-w-[150px] xl:w-[178px] xl:max-w-[178px] lg:flex-none">
            <BrandLogo className="w-[120px] sm:w-[145px] lg:w-full" />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden whitespace-nowrap lg:flex">
            {navigationItems.map((item) => (
              <NavLink key={item.to} className={desktopNavLinkClass} to={item.to}>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="hidden min-w-0 shrink-0 items-center justify-end gap-2 lg:flex">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <NavLink className={desktopNavLinkClass} to="/profile">
                  <span className="max-w-[112px] truncate">{localizedUserName || t("nav.profile")}</span>
                </NavLink>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-full border border-white/60 bg-white/76 px-3 text-[13px] font-semibold text-slate-900 shadow-[0_8px_20px_-18px_rgba(73,20,33,0.28)] backdrop-blur-sm transition hover:bg-white"
                  onClick={handleLogout}
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <NavLink className={desktopNavLinkClass} to="/login">
                  {t("nav.login")}
                </NavLink>
                <Link
                  className="inline-flex h-9 items-center rounded-full bg-[#8d1530] px-3.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-18px_rgba(141,21,48,0.8)] transition hover:bg-[#721127]"
                  to="/register"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher compact />
            {isAuthenticated ? (
              <NavLink
                className="inline-flex h-10 max-w-[122px] items-center rounded-full border border-white/60 bg-white/76 px-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_-18px_rgba(73,20,33,0.28)] backdrop-blur-sm transition hover:bg-white"
                to="/profile"
              >
                <span className="truncate">{localizedUserName || t("nav.profile")}</span>
              </NavLink>
            ) : null}

            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/76 text-slate-900 shadow-[0_8px_20px_-18px_rgba(73,20,33,0.28)] backdrop-blur-sm transition hover:bg-white"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-3 rounded-[28px] border border-[#ead9de] bg-[rgba(255,252,251,0.96)] p-3 shadow-[0_22px_48px_-34px_rgba(56,18,30,0.35)] backdrop-blur-xl lg:hidden">
            <nav className="grid gap-2">
              {navigationItems.map((item) => (
                <NavLink key={item.to} className={mobileNavLinkClass} to={item.to}>
                  <span className="inline-flex items-center gap-2">
                    <span>{item.label}</span>
                  </span>
                  <span aria-hidden="true" className="text-base leading-none">
                    ›
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-3 grid gap-2 border-t border-[#efe1e5] pt-3">
              {isAuthenticated ? (
                <>
                  <div className="rounded-2xl border border-[#efe1e5] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t("nav.account")}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{localizedUserName || t("nav.profile")}</p>
                    <p className="mt-1 text-xs text-slate-500">{t(`role.${user?.role || "customer"}`)}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#ead9de] bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#fff8fa]"
                    onClick={handleLogout}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <NavLink className={mobileNavLinkClass} to="/login">
                    {t("nav.login")}
                  </NavLink>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#8d1530] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-22px_rgba(141,21,48,0.8)] transition hover:bg-[#721127]"
                    to="/register"
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Navbar;

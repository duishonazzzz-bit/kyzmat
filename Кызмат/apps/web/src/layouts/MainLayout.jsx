import { useMemo } from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import BrandLogo from "../components/BrandLogo";
import FloatingChatButton from "../components/FloatingChatButton";
import { useLanguage } from "../context/LanguageContext";

function MainLayout() {
  const { t } = useLanguage();

  const footerColumns = useMemo(
    () => [
      {
        title: t("footer.platform"),
        links: [
          { to: "/jobs", label: t("footer.platform.jobs") },
          { to: "/workers", label: t("footer.platform.workers") },
          { to: "/subscriptions", label: t("footer.platform.subscriptions") },
        ],
      },
      {
        title: t("footer.customers"),
        links: [
          { to: "/jobs/new", label: t("footer.customers.createJob") },
          { to: "/workers", label: t("footer.customers.pickWorker") },
          { to: "/chat", label: t("footer.customers.chat") },
        ],
      },
      {
        title: t("footer.workers"),
        links: [
          { to: "/jobs", label: t("footer.workers.findJobs") },
          { to: "/profile", label: t("footer.workers.profile") },
          { to: "/cabinet", label: t("footer.workers.cabinet") },
        ],
      },
    ],
    [t],
  );

  return (
    <div className="min-h-screen bg-app text-slate-900">
      <Navbar />
      <FloatingChatButton />
      <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-20 lg:pt-10">
        <Outlet />
      </main>
      <footer className="border-t border-[#eadfda] bg-[linear-gradient(180deg,#fffaf7_0%,#f7efe9_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-3 py-8 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-8 lg:px-8 lg:py-10">
          <div className="space-y-4">
            <BrandLogo className="w-[156px] sm:w-[176px]" showTagline />
            <p className="max-w-md text-sm leading-6 text-slate-600">{t("footer.about")}</p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">{column.title}</p>
              <div className="space-y-2">
                {column.links.map((link) => (
                  <Link
                    key={link.to}
                    className="block text-sm font-medium text-slate-600 transition hover:text-[#5c0f22]"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#eadfda] py-4 text-center text-sm text-slate-500">{t("footer.bottom")}</div>
      </footer>
    </div>
  );
}

export default MainLayout;

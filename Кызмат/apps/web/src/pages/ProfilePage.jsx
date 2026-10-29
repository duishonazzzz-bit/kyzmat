import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { RatingInline, RatingValue } from "../components/RatingDisplay";
import UserAvatar from "../components/UserAvatar";
import WorkerStatusBadges from "../components/WorkerStatusBadges";
import { getLocalizedCityOptions } from "../data/kyrgyzstanCities";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, getLocalizedPersonName, localizeJob, localizeWorker, translateCityName, translateKnownText } from "../i18n/contentTranslations";
import {
  getCustomerStatCards,
  getProfileCopy,
  getRoleMeta,
  getWorkerStatCards,
  roleLabelsByLanguage,
  statusLabelsByLanguage,
} from "./profilePage.i18n.js";
import {
  buildWorkerResumeForm,
  buildWorkerResumePayload,
  getWorkerVerificationMeta,
  hasWorkerResumeContent,
  normalizeWorkerResume,
} from "../utils/workerResume";

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function buildForm(profile) {
  return {
    fullName: profile?.fullName || "",
    fullNameKy: profile?.fullNameKy || "",
    fullNameEn: profile?.fullNameEn || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    city: profile?.city || "",
    bio: profile?.bio || "",
    avatarUrl: profile?.avatarUrl || "",
    skillsText: Array.isArray(profile?.skills) ? profile.skills.join(", ") : "",
    ...buildWorkerResumeForm(profile?.workerResume),
  };
}

function parseSkills(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function translateListText(value, language) {
  return String(value || "")
    .split(",")
    .map((item) => translateKnownText(item.trim(), language))
    .filter(Boolean)
    .join(", ");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

        reject(new Error("READ_FILE_FAILED"));
      };
    reader.onerror = () => reject(new Error("READ_FILE_FAILED"));
    reader.readAsDataURL(file);
  });
}

function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
    </article>
  );
}

function ActionCard({ title, text, to, primary = false }) {
  return (
    <Link
      className={
        primary
          ? "rounded-2xl bg-slate-900 p-4 text-white transition hover:bg-slate-700"
          : "rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:bg-white"
      }
      to={to}
    >
      <h3 className={primary ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>{title}</h3>
      <p className={primary ? "mt-2 text-sm text-slate-100/90" : "mt-2 text-sm text-slate-600"}>{text}</p>
    </Link>
  );
}

function JobPreviewCard({ job, secondaryAction }) {
  const { language } = useLanguage();
  const copy = getProfileCopy(language);
  const statusLabels = statusLabelsByLanguage[language] || statusLabelsByLanguage.ky;
  const localizedJob = localizeJob(job, language);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{localizedJob.title}</h3>
          <p className="text-sm text-slate-600">
            {localizedJob.category_name} · {localizedJob.city}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{formatMoney(localizedJob.budget, language)}</p>
          <p className="text-xs text-slate-500">{statusLabels[localizedJob.status] || localizedJob.status}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link className="btn-secondary" to={`/jobs/${localizedJob.id}`}>
          {copy.open}
        </Link>
        {secondaryAction}
      </div>
    </article>
  );
}

function WorkerPreviewCard({ worker }) {
  const { language } = useLanguage();
  const copy = getProfileCopy(language);
  const localizedWorker = localizeWorker(worker, language);
  const resume = normalizeWorkerResume(localizedWorker.workerResume);
  const verificationMeta = getWorkerVerificationMeta(resume.verificationStatus, localizedWorker.isPro, language);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar className="h-14 w-14 rounded-2xl" name={localizedWorker.fullName} src={localizedWorker.avatarUrl} />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{localizedWorker.fullName}</h3>
            <p className="text-sm text-slate-600">{localizedWorker.city || copy.noCity}</p>
          </div>
        </div>
        <WorkerStatusBadges
          className="items-start sm:justify-end"
          isPro={localizedWorker.isPro}
          verificationMeta={verificationMeta}
          verificationStatus={resume.verificationStatus}
        />
      </div>

      <p className="mt-2 text-sm text-slate-700">{localizedWorker.bio || copy.workerBioFallback}</p>

      {(localizedWorker.skills || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {localizedWorker.skills.slice(0, 4).map((skill) => (
            <span className="badge" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
        <span>
          <RatingValue rating={localizedWorker.rating || 0} />
        </span>
        <span>{copy.completedWorks} {localizedWorker.completedJobs || 0}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link className="btn-secondary" to={`/workers/${localizedWorker.id}`}>
          {copy.publicProfile}
        </Link>
        <Link className="btn-secondary" to={`/chat?withUserId=${localizedWorker.id}`}>
          {copy.writeInChat}
        </Link>
      </div>
    </article>
  );
}

function UserPreviewCard({ account }) {
  const { language } = useLanguage();
  const copy = getProfileCopy(language);
  const roleLabels = roleLabelsByLanguage[language] || roleLabelsByLanguage.ky;
  const localizedName = getLocalizedPersonName(account, language, account.fullName);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{localizedName}</h3>
          <p className="text-sm text-slate-600">
            {roleLabels[account.role] || account.role} · {account.city || copy.noCity}
          </p>
        </div>
        <RatingInline rating={account.rating || 0} reviews={account.totalReviews || 0} />
      </div>
    </article>
  );
}

function ProfilePage() {
  const { language } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(() => buildForm(user));
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [dataError, setDataError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [focusedResumeField, setFocusedResumeField] = useState("");

  const isCustomer = profile?.role === "customer";
  const isWorker = profile?.role === "worker";
  const isAdmin = profile?.role === "admin";
  const copy = getProfileCopy(language);
  const statusLabels = statusLabelsByLanguage[language] || statusLabelsByLanguage.ky;
  const openPhotoLabel = language === "en" ? "Open photo" : language === "ru" ? "Открыть фото" : "Сүрөттү ачуу";
  const closePhotoPreviewLabel = language === "en" ? "Close preview" : language === "ru" ? "Закрыть просмотр" : "Көрүүнү жабуу";
  const roleMeta = getRoleMeta(language);
  const customerStatCards = getCustomerStatCards(language);
  const workerStatCards = getWorkerStatCards(language);
  const meta = roleMeta[profile?.role] || roleMeta.customer;
  const localizedProfileName = getLocalizedPersonName(profile, language, profile?.fullName);
  const localizedNameLabels =
    language === "en"
      ? { ky: "Name in Kyrgyz", en: "Name in English", help: "Optional display names for multilingual profile display." }
      : language === "ru"
        ? { ky: "Имя на кыргызском", en: "Имя на английском", help: "Необязательные отображаемые имена для многоязычного профиля." }
        : { ky: "Аты кыргызча", en: "Аты англисче", help: "Көп тилдүү профил үчүн кошумча көрсөтүлүүчү аттар." };
  const workerResume = useMemo(() => buildWorkerResumePayload(form), [form]);
  const localizedWorkerResume = useMemo(
    () => ({
      ...workerResume,
      headline: translateKnownText(workerResume.headline, language),
      serviceModes: workerResume.serviceModes.map((item) => translateKnownText(item, language)),
      serviceAreas: workerResume.serviceAreas.map((item) => translateCityName(item, language)),
      education: translateKnownText(workerResume.education, language),
      achievements: translateKnownText(workerResume.achievements, language),
      languages: workerResume.languages.map((item) => translateKnownText(item, language)),
      availability: translateKnownText(workerResume.availability, language),
      pricingNote: translateKnownText(workerResume.pricingNote, language),
      responseTime: translateKnownText(workerResume.responseTime, language),
      verificationItems: workerResume.verificationItems.map((item) => translateKnownText(item, language)),
      verificationNote: translateKnownText(workerResume.verificationNote, language),
      portfolioHighlights: workerResume.portfolioHighlights.map((item) => translateKnownText(item, language)),
    }),
    [language, workerResume],
  );
  const workerVerificationMeta = useMemo(
    () => getWorkerVerificationMeta(workerResume.verificationStatus, profile?.isPro, language),
    [language, workerResume.verificationStatus, profile?.isPro],
  );

  useEffect(() => {
    if (!isPhotoPreviewOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsPhotoPreviewOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPhotoPreviewOpen]);

  const resumeValue = (name, value, { list = false } = {}) => {
    if (language === "ru" || focusedResumeField === name) return value;
    return list ? translateListText(value, language) : translateKnownText(value, language);
  };
  const resumeFieldEvents = (name) => ({
    onFocus: () => setFocusedResumeField(name),
    onBlur: () => setFocusedResumeField(""),
  });

  const customerStats = useMemo(() => {
    const counters = { open: 0, in_progress: 0, completed: 0, cancelled: 0 };
    let responses = 0;

    jobs.forEach((job) => {
      counters[job.status] = (counters[job.status] || 0) + 1;
      responses += Number(job.responses_count || 0);
    });

    return { total: jobs.length, responses, ...counters };
  }, [jobs]);

  const workerStats = useMemo(() => {
    return {
      assigned: jobs.length,
      inProgress: jobs.filter((job) => job.status === "in_progress").length,
      completed: jobs.filter((job) => job.status === "completed").length,
      available: availableJobs.length,
      urgentOpen: availableJobs.filter((job) => job.is_urgent).length,
    };
  }, [jobs, availableJobs]);

  const adminCards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: language === "en" ? "Users" : language === "ru" ? "Пользователи" : "Колдонуучулар", value: overview.users.total_users, hint: language === "en" ? `${overview.users.workers} specialists` : language === "ru" ? `${overview.users.workers} исполнителей` : `${overview.users.workers} аткаруучу` },
      { label: language === "en" ? "Jobs" : language === "ru" ? "Заказы" : "Тапшырмалар", value: overview.jobs.total_jobs, hint: language === "en" ? `${overview.jobs.open_jobs} open` : language === "ru" ? `${overview.jobs.open_jobs} открытых` : `${overview.jobs.open_jobs} ачык` },
      { label: language === "en" ? "Disputes" : language === "ru" ? "Споры" : "Талаштар", value: overview.activity.open_disputes, hint: language === "en" ? "Needs attention" : language === "ru" ? "Требуют внимания" : "Көңүл буруу керек" },
      { label: language === "en" ? "Messages" : language === "ru" ? "Сообщения" : "Билдирүүлөр", value: overview.activity.total_messages, hint: language === "en" ? "Inside the platform" : language === "ru" ? "Внутри платформы" : "Платформанын ичинде" },
    ];
  }, [language, overview]);

  const roleActions = useMemo(() => {
    return meta.actions.map((item) => ({
      ...item,
      to: typeof item.to === "function" ? item.to(profile) : item.to,
    }));
  }, [meta.actions, profile]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    setDataError("");

    try {
      const { data } = await api.get("/users/me");
      setProfile(data);
      setForm(buildForm(data));
      setPasswordForm(emptyPasswordForm);
      setPasswordError("");
      setPasswordSuccess("");
      return data;
    } catch (error) {
      if (user) {
        setProfile(user);
        setForm(buildForm(user));
        return user;
      }

      setDataError(error.response?.data?.message || copy.loadProfileFailed);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadRoleData = async (activeProfile) => {
    if (!activeProfile?.id || !activeProfile?.role) return;

    setLoadingData(true);
    setDataError("");

    try {
      if (activeProfile.role === "customer") {
        const [jobsResult, workersResult] = await Promise.all([
          api.get("/jobs", { params: { customerId: activeProfile.id, sort: "recent" } }),
          api.get("/workers", { params: { city: activeProfile.city || undefined, minRating: 4 } }),
        ]);

        setJobs(jobsResult.data);
        setWorkers(workersResult.data.slice(0, 6));
        setAvailableJobs([]);
        setOverview(null);
        setUsers([]);
        return;
      }

      if (activeProfile.role === "worker") {
        const [assignedJobsResult, openJobsResult] = await Promise.all([
          api.get("/jobs", { params: { workerId: activeProfile.id, sort: "recent" } }),
          api.get("/jobs", {
            params: {
              status: "open",
              city: activeProfile.city || undefined,
              sort: "urgent_first",
            },
          }),
        ]);

        setJobs(assignedJobsResult.data);
        setAvailableJobs(openJobsResult.data.slice(0, 6));
        setWorkers([]);
        setOverview(null);
        setUsers([]);
        return;
      }

      const [overviewResult, usersResult] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/users", { params: { limit: 8 } }),
      ]);

      setOverview(overviewResult.data);
      setUsers(usersResult.data);
      setJobs([]);
      setAvailableJobs([]);
      setWorkers([]);
    } catch (error) {
      setDataError(error.response?.data?.message || copy.loadProfileDataFailed);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setProfile(user);
      setForm(buildForm(user));
    }
    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    if (profile?.id && profile?.role) {
      loadRoleData(profile);
    }
  }, [profile?.id, profile?.role, profile?.city]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveError("");
    setSaveSuccess("");
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError(copy.imageOnly);
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setSaveError(copy.imageTooLarge);
      return;
    }

    try {
      const avatarUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({ ...prev, avatarUrl }));
      setSaveError("");
      setSaveSuccess(copy.imageReady);
    } catch {
      setSaveError(copy.imageUploadFailed);
    }
  };

  const clearAvatar = () => {
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
    setSaveError("");
    setSaveSuccess("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      if (isWorker && !form.avatarUrl) {
        setSaveError(copy.workerPhotoRequiredError);
        return;
      }

      const payload = {
        fullName: form.fullName,
        fullNameKy: form.fullNameKy || null,
        fullNameEn: form.fullNameEn || null,
        email: form.email || null,
        phone: form.phone || null,
        city: form.city || null,
        bio: form.bio || null,
        avatarUrl: form.avatarUrl || null,
      };

      if (isWorker) {
        payload.skills = parseSkills(form.skillsText);
        payload.workerResume = workerResume;
      }

      const { data } = await api.patch("/users/me", payload);
      setProfile(data);
      setForm(buildForm(data));
      await refreshProfile();
      setSaveSuccess(copy.profileSaved);
    } catch (error) {
      setSaveError(error.response?.data?.message || copy.profileSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const currentPassword = passwordForm.currentPassword;
    const nextPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword) {
      setPasswordError(copy.enterCurrentPassword);
      return;
    }

    if (nextPassword.length < 6) {
      setPasswordError(copy.passwordMin);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordError(copy.passwordMatch);
      return;
    }

    if (currentPassword === nextPassword) {
      setPasswordError(copy.passwordDifferent);
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const { data } = await api.patch("/users/me/password", {
        currentPassword,
        newPassword: nextPassword,
      });

      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess(data.message || copy.passwordUpdated);
    } catch (error) {
      setPasswordError(error.response?.data?.message || copy.passwordUpdateFailed);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!profile && loadingProfile) {
    return <section className="panel">{copy.loading}</section>;
  }

  if (!profile) {
    return <section className="panel">{copy.loadProfileFailed}</section>;
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="badge">{meta.badge}</span>
            <h1 className="title mt-4">{meta.title}</h1>
            <p className="subtitle">{meta.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="badge">{localizedProfileName}</span>
              <span className="badge">{profile.city || copy.noCity}</span>
              <RatingInline className="badge" rating={profile.rating || 0} reviews={profile.totalReviews || 0} />
              {profile.isPro && <span className="badge">PRO</span>}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#4f0e1f] via-[#72122a] to-[#a21a39] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f6d9df]">{meta.badge}</p>
            <h2 className="mt-3 font-display text-2xl font-bold">{meta.spotlightTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">{meta.spotlightText}</p>
            <div className="mt-5 space-y-2 text-sm text-slate-100/90">
              {meta.bullets.map((bullet) => (
                <p key={bullet}>• {bullet}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {dataError && <section className="panel text-sm font-medium text-red-600">{dataError}</section>}
      {loadingData && <section className="panel text-sm text-slate-600">{copy.loadingRoleData}</section>}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{copy.profileTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{copy.profileSubtitle}</p>
            </div>
            <Link className="btn-secondary" to="/cabinet">
              {copy.openCabinet}
            </Link>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <label className="label">{copy.name}</label>
              <input className="input" name="fullName" value={form.fullName} onChange={handleChange} />
            </div>
            <div>
              <label className="label">{localizedNameLabels.ky}</label>
              <input className="input" name="fullNameKy" value={form.fullNameKy} onChange={handleChange} />
            </div>
            <div>
              <label className="label">{localizedNameLabels.en}</label>
              <input className="input" name="fullNameEn" value={form.fullNameEn} onChange={handleChange} />
            </div>
            <div className="md:col-span-2 -mt-1 text-sm text-slate-500">{localizedNameLabels.help}</div>
            <div>
              <label className="label">Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label">{copy.phone}</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label">{copy.city}</label>
              <select className="input" name="city" value={form.city} onChange={handleChange}>
                {getLocalizedCityOptions(form.city, language).map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{copy.role}</label>
              <div className="input flex items-center bg-slate-50 text-slate-600">{meta.badge}</div>
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {form.avatarUrl ? (
                  <button
                    aria-label={openPhotoLabel}
                    className="group relative w-fit rounded-[30px] transition hover:scale-[1.02]"
                    onClick={() => setIsPhotoPreviewOpen(true)}
                    type="button"
                  >
                    <UserAvatar className="h-28 w-28 rounded-[30px]" name={form.fullName} src={form.avatarUrl} />
                    <span className="pointer-events-none absolute inset-0 rounded-[30px] bg-slate-950/0 transition group-hover:bg-slate-950/12" />
                  </button>
                ) : (
                  <UserAvatar className="h-28 w-28 rounded-[30px]" name={form.fullName} src={form.avatarUrl} />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-950">{isWorker ? copy.workerPhoto : copy.profilePhoto}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{copy.photoHelp}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <label className="btn-secondary cursor-pointer">
                      {copy.uploadPhoto}
                      <input accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="sr-only" onChange={handleAvatarFileChange} type="file" />
                    </label>
                    {form.avatarUrl && (
                      <button className="btn-secondary" onClick={clearAvatar} type="button">
                        {copy.removePhoto}
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{copy.photoHint}</p>
                </div>
              </div>
              {isWorker && !form.avatarUrl && <p className="mt-4 text-sm font-medium text-[#8d1530]">{copy.workerPhotoRequired}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="label">{copy.about}</label>
              <textarea className="input min-h-28" name="bio" value={form.bio} onChange={handleChange} placeholder={isWorker ? copy.workerBioPlaceholder : copy.customerBioPlaceholder} />
            </div>

            {isWorker && (
              <>
                <div className="md:col-span-2">
                  <label className="label">{copy.skills}</label>
                  <input className="input" name="skillsText" value={form.skillsText} onChange={handleChange} placeholder={copy.skillsPlaceholder} />
                  <p className="mt-2 text-sm text-slate-500">{copy.skillsHint}</p>
                </div>

                <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">{copy.resumeTitle}</h3>
                      <p className="mt-1 text-sm text-slate-600">{copy.resumeText}</p>
                    </div>
                    <Link className="btn-secondary" to={`/workers/${profile.id}`}>
                      {copy.openPublicProfile}
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="label">{copy.headline}</label>
                      <input className="input" name="headline" value={resumeValue("headline", form.headline)} onChange={handleChange} placeholder={copy.headlinePlaceholder} {...resumeFieldEvents("headline")} />
                    </div>
                    <div>
                      <label className="label">{copy.experienceYears}</label>
                      <input className="input" inputMode="numeric" name="experienceYears" value={form.experienceYears} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="label">{copy.languages}</label>
                      <input className="input" name="languagesText" value={resumeValue("languagesText", form.languagesText, { list: true })} onChange={handleChange} placeholder={copy.languagesPlaceholder} {...resumeFieldEvents("languagesText")} />
                    </div>
                    <div>
                      <label className="label">{copy.serviceMode}</label>
                      <input className="input" name="serviceModesText" value={resumeValue("serviceModesText", form.serviceModesText, { list: true })} onChange={handleChange} placeholder={copy.serviceModePlaceholder} {...resumeFieldEvents("serviceModesText")} />
                    </div>
                    <div>
                      <label className="label">{copy.serviceArea}</label>
                      <input className="input" name="serviceAreasText" value={focusedResumeField === "serviceAreasText" || language === "ru" ? form.serviceAreasText : form.serviceAreasText.split(",").map((item) => translateCityName(item.trim(), language)).filter(Boolean).join(", ")} onChange={handleChange} placeholder={copy.serviceAreaPlaceholder} {...resumeFieldEvents("serviceAreasText")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{copy.education}</label>
                      <textarea className="input min-h-24" name="education" value={resumeValue("education", form.education)} onChange={handleChange} {...resumeFieldEvents("education")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{copy.achievements}</label>
                      <textarea className="input min-h-24" name="achievements" value={resumeValue("achievements", form.achievements)} onChange={handleChange} {...resumeFieldEvents("achievements")} />
                    </div>
                    <div>
                      <label className="label">{copy.schedule}</label>
                      <input className="input" name="availability" value={resumeValue("availability", form.availability)} onChange={handleChange} placeholder={copy.schedulePlaceholder} {...resumeFieldEvents("availability")} />
                    </div>
                    <div>
                      <label className="label">{copy.pricingNote}</label>
                      <input className="input" name="pricingNote" value={resumeValue("pricingNote", form.pricingNote)} onChange={handleChange} placeholder={copy.pricingNotePlaceholder} {...resumeFieldEvents("pricingNote")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{copy.portfolioLinks}</label>
                      <textarea className="input min-h-24" name="portfolioLinksText" value={form.portfolioLinksText} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="label">{copy.verificationStatus}</label>
                      <select className="input" name="verificationStatus" value={form.verificationStatus} onChange={handleChange}>
                        <option value="basic">{copy.verificationBasic}</option>
                        <option value="verified">{copy.verificationVerified}</option>
                        <option value="top">{copy.verificationTop}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{copy.responseTime}</label>
                      <input className="input" name="responseTime" value={resumeValue("responseTime", form.responseTime)} onChange={handleChange} placeholder={copy.responseTimePlaceholder} {...resumeFieldEvents("responseTime")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{copy.verificationItems}</label>
                      <input className="input" name="verificationItemsText" value={resumeValue("verificationItemsText", form.verificationItemsText, { list: true })} onChange={handleChange} placeholder={copy.verificationItemsPlaceholder} {...resumeFieldEvents("verificationItemsText")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{copy.verificationNote}</label>
                      <textarea className="input min-h-24" name="verificationNote" value={resumeValue("verificationNote", form.verificationNote)} onChange={handleChange} {...resumeFieldEvents("verificationNote")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{copy.portfolioWorks}</label>
                      <textarea className="input min-h-24" name="portfolioHighlightsText" value={resumeValue("portfolioHighlightsText", form.portfolioHighlightsText, { list: true })} onChange={handleChange} {...resumeFieldEvents("portfolioHighlightsText")} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {saveError && <p className="md:col-span-2 text-sm font-medium text-red-600">{saveError}</p>}
            {saveSuccess && <p className="md:col-span-2 text-sm font-medium text-emerald-700">{saveSuccess}</p>}

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button className="btn-primary" disabled={saving} type="submit">
                  {saving ? copy.saving : copy.saveProfile}
                </button>
                <button className="btn-secondary" onClick={() => setForm(buildForm(profile))} type="button">
                  {copy.discardChanges}
                </button>
              </div>
            </form>
          </section>

        <section className="panel">
          <h2 className="text-2xl font-bold text-slate-950">{copy.toolsTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{copy.toolsSubtitle}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-lg font-bold text-slate-900">{copy.passwordTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{copy.passwordText}</p>
            <form className="mt-4 grid gap-3" onSubmit={handlePasswordSubmit}>
              <div>
                <label className="label">{copy.currentPassword}</label>
                <input className="input" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} />
              </div>
              <div>
                <label className="label">{copy.newPassword}</label>
                <input className="input" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} />
              </div>
              <div>
                <label className="label">{copy.confirmPassword}</label>
                <input className="input" name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} />
              </div>
              {passwordError && <p className="text-sm font-medium text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm font-medium text-emerald-700">{passwordSuccess}</p>}
              <div>
                <button className="btn-secondary" disabled={passwordSaving} type="submit">
                  {passwordSaving ? copy.changing : copy.changePassword}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {roleActions.map((action) => (
              <ActionCard key={`${action.title}-${action.to}`} primary={action.primary} text={action.text} title={action.title} to={action.to} />
            ))}
          </div>

          {isWorker && hasWorkerResumeContent(workerResume) && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{copy.previewTitle}</h3>
                  <p className="mt-1 text-sm text-slate-600">{copy.previewText}</p>
                </div>
                <Link className="btn-secondary" to={`/workers/${profile.id}`}>
                  {copy.open}
                </Link>
              </div>

              {workerResume.headline && <p className="mt-4 text-base font-semibold text-slate-950">{localizedWorkerResume.headline}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {workerResume.experienceYears !== null && <span className="badge border-slate-200 bg-white">{workerResume.experienceYears} {copy.years}</span>}
                {localizedWorkerResume.serviceModes.map((item) => (
                  <span className="badge border-slate-200 bg-white" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              {workerResume.verificationStatus !== "basic" && (
                <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${workerVerificationMeta.badgeClass}`}>
                  {workerVerificationMeta.label}
                </div>
              )}
              {workerResume.serviceAreas.length > 0 && (
                <p className="mt-4 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.serviceAreaLabel}</span> {localizedWorkerResume.serviceAreas.join(", ")}
                </p>
              )}
              {workerResume.availability && (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.availabilityLabel}</span> {localizedWorkerResume.availability}
                </p>
              )}
              {workerResume.pricingNote && (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.pricesLabel}</span> {localizedWorkerResume.pricingNote}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {isCustomer && (
        <>
          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-950">{copy.customerSummary}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {customerStatCards.map((card) => (
                <StatCard hint={card.hint} key={card.key} label={card.label} value={customerStats[card.key]} />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h2 className="text-2xl font-bold text-slate-950">{copy.myJobs}</h2>
               <Link className="btn-secondary" to={`/jobs?customerId=${profile.id}`}>
                 {copy.allJobs}
               </Link>
             </div>
            {!loadingData && jobs.length === 0 && <p className="mt-4 text-sm text-slate-600">{copy.noCustomerJobs}</p>}
            <div className="mt-4 space-y-3">
              {jobs.slice(0, 6).map((job) => (
                <JobPreviewCard
                  job={job}
                  key={job.id}
                  secondaryAction={
                     <Link className="btn-secondary" to={`/chat?jobId=${job.id}`}>
                       {copy.jobChat}
                     </Link>
                  }
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h2 className="text-2xl font-bold text-slate-950">{copy.suggestedWorkers}</h2>
               <Link className="btn-secondary" to="/workers">
                 {copy.allWorkers}
               </Link>
             </div>
            {!loadingData && workers.length === 0 && <p className="mt-4 text-sm text-slate-600">{copy.noSuggestions}</p>}
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workers.map((worker) => (
                <WorkerPreviewCard key={worker.id} worker={worker} />
              ))}
            </div>
          </section>
        </>
      )}

      {isWorker && (
        <>
          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-950">{copy.workerSummary}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {workerStatCards.map((card) => (
                <StatCard hint={card.hint} key={card.key} label={card.label} value={workerStats[card.key]} />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h2 className="text-2xl font-bold text-slate-950">{copy.currentJobs}</h2>
               <Link className="btn-secondary" to="/cabinet/worker">
                 {copy.workerCabinet}
               </Link>
             </div>
            {!loadingData && jobs.length === 0 && <p className="mt-4 text-sm text-slate-600">{copy.noWorkerJobs}</p>}
            <div className="mt-4 space-y-3">
              {jobs.slice(0, 6).map((job) => (
                <JobPreviewCard
                  job={job}
                  key={job.id}
                  secondaryAction={
                     <Link className="btn-secondary" to={`/chat?jobId=${job.id}`}>
                       {language === "en" ? "Chat with customer" : language === "ru" ? "Чат с заказчиком" : "Кардар менен чат"}
                     </Link>
                  }
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h2 className="text-2xl font-bold text-slate-950">{copy.availableJobs}</h2>
               <Link className="btn-secondary" to={`/jobs?status=open${profile.city ? `&city=${encodeURIComponent(profile.city)}` : ""}`}>
                 {copy.allOpenJobs}
               </Link>
             </div>
            {!loadingData && availableJobs.length === 0 && <p className="mt-4 text-sm text-slate-600">{copy.noOpenJobs}</p>}
            <div className="mt-4 space-y-3">
              {availableJobs.map((job) => (
                <JobPreviewCard
                  job={job}
                  key={job.id}
                  secondaryAction={
                     <Link className="btn-primary" to={`/jobs/${job.id}`}>
                       {copy.reply}
                     </Link>
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}

      {isAdmin && (
        <>
          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-950">{copy.platformSummary}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {adminCards.map((card) => (
                <StatCard hint={card.hint} key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h2 className="text-2xl font-bold text-slate-950">{copy.latestJobs}</h2>
               <Link className="btn-secondary" to="/cabinet/admin">
                 {copy.fullAdminPanel}
               </Link>
            </div>
            <div className="mt-4 space-y-3">
              {(overview?.recentJobs || []).map((job) => {
                const localizedJob = localizeJob(job, language);
                return (
                <article key={job.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{localizedJob.title}</h3>
                      <p className="text-sm text-slate-600">
                        {localizedJob.category_name} · {localizedJob.city} · {statusLabels[job.status] || job.status}
                      </p>
                      <p className="text-sm text-slate-600">{copy.customerName} {job.customer_name}</p>
                    </div>
                    <Link className="btn-secondary" to={`/jobs/${job.id}`}>
                      {copy.open}
                    </Link>
                  </div>
                </article>
              );
              })}
            </div>
          </section>

          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-950">{copy.newUsers}</h2>
            {!loadingData && users.length === 0 && <p className="mt-4 text-sm text-slate-600">{copy.noUsers}</p>}
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {users.map((account) => (
                <UserPreviewCard account={account} key={account.id} />
              ))}
            </div>
          </section>
        </>
      )}

      {isPhotoPreviewOpen && form.avatarUrl && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm"
          onClick={() => setIsPhotoPreviewOpen(false)}
          role="dialog"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label={closePhotoPreviewLabel}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-2xl font-semibold text-slate-900 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.6)] transition hover:bg-white"
              onClick={() => setIsPhotoPreviewOpen(false)}
              type="button"
            >
              ×
            </button>
            <img
              alt={form.fullName || copy.profilePhoto}
              className="max-h-[90vh] max-w-[90vw] rounded-[28px] border border-white/15 object-contain shadow-[0_40px_80px_-36px_rgba(15,23,42,0.65)]"
              src={form.avatarUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

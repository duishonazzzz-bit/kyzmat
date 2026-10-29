import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, localizeJob } from "../i18n/contentTranslations";

const pageCopy = {
  ru: {
    loadError: "Не удалось загрузить кабинет исполнителя.",
    title: "Кабинет исполнителя",
    subtitle: "Следите за текущими заказами, открывайте новые заявки и держите рабочий поток под контролем.",
    assigned: "Назначенные заказы",
    inProgress: "В работе",
    completed: "Завершено",
    available: "Доступные заказы",
    openNewJobs: "Открыть новые заказы",
    myProfile: "Мой профиль",
    myActiveJobs: "Мои активные заказы",
    loading: "Загружаем ваши активные заказы...",
    noActive: "Назначенных заказов пока нет.",
    addressFallback: "Адрес откроется в карточке заказа",
    openJob: "Открыть заказ",
    route: "Карта и маршрут",
    chat: "Открыть чат",
    archive: "Архив исполнителя",
    archiveText: "Завершённые и отменённые заказы вынесены отдельно, чтобы не мешать активной работе.",
    archivedCount: "в архиве",
    archiveEmpty: "Архив пока пуст.",
    jobsToRespond: "Заказы для отклика",
    noOpenJobs: "Подходящих открытых заказов пока нет.",
    respond: "Откликнуться",
  },
  ky: {
    loadError: "Аткаруучунун кабинети жүктөлгөн жок.",
    title: "Аткаруучунун кабинети",
    subtitle: "Учурдагы заказдарды көзөмөлдөп, жаңы тапшырмаларды ачып жана иш агымын башкаруу үчүн ушул жерди колдонуңуз.",
    assigned: "Берилген заказдар",
    inProgress: "Иште",
    completed: "Аяктаган",
    available: "Жеткиликтүү заказдар",
    openNewJobs: "Жаңы заказдарды ачуу",
    myProfile: "Менин профилим",
    myActiveJobs: "Менин активдүү заказдарым",
    loading: "Активдүү заказдарыңыз жүктөлүүдө...",
    noActive: "Азырынча берилген заказдар жок.",
    addressFallback: "Дарек заказдын карточкасында ачылат",
    openJob: "Заказды ачуу",
    route: "Карта жана маршрут",
    chat: "Чатты ачуу",
    archive: "Аткаруучунун архиви",
    archiveText: "Аяктаган жана жокко чыгарылган заказдар активдүү ишке тоскоол болбошу үчүн өзүнчө чыгарылды.",
    archivedCount: "архивде",
    archiveEmpty: "Архив азырынча бош.",
    jobsToRespond: "Жооп бере турган заказдар",
    noOpenJobs: "Азырынча ылайыктуу ачык заказдар жок.",
    respond: "Жооп берүү",
  },
  en: {
    loadError: "Unable to load the specialist dashboard.",
    title: "Specialist dashboard",
    subtitle:
      "Track your current jobs, open new requests, and keep your workflow under control.",
    assigned: "Assigned jobs",
    inProgress: "In progress",
    completed: "Completed",
    available: "Available jobs",
    openNewJobs: "Open new jobs",
    myProfile: "My profile",
    myActiveJobs: "My active jobs",
    loading: "Loading your active jobs...",
    noActive: "No assigned jobs yet.",
    addressFallback: "Address is available in the job card",
    openJob: "Open job",
    route: "Map and route",
    chat: "Open chat",
    archive: "Specialist archive",
    archiveText:
      "Completed and cancelled jobs are separated so they do not distract from active work.",
    archivedCount: "in archive",
    archiveEmpty: "The archive is empty for now.",
    jobsToRespond: "Jobs available for response",
    noOpenJobs: "There are no suitable open jobs yet.",
    respond: "Send response",
  },
};

function WorkerCabinetPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const [myJobs, setMyJobs] = useState([]);
  const [openJobs, setOpenJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCabinet = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError("");

      try {
        const [myJobsResult, openJobsResult] = await Promise.all([
          api.get("/jobs", { params: { workerId: user.id, sort: "recent" } }),
          api.get("/jobs", {
            params: {
              status: "open",
              city: user.city || undefined,
              sort: "recent",
            },
          }),
        ]);

        setMyJobs(myJobsResult.data);
        setOpenJobs(openJobsResult.data.slice(0, 10));
      } catch (err) {
        setError(err.response?.data?.message || copy.loadError);
      } finally {
        setLoading(false);
      }
    };

    void loadCabinet();
  }, [copy.loadError, user?.city, user?.id]);

  const activeJobs = useMemo(() => myJobs.filter((job) => job.status === "in_progress").map((job) => localizeJob(job, language)), [myJobs, language]);

  const archivedJobs = useMemo(
    () => myJobs.filter((job) => job.status === "completed" || job.status === "cancelled").map((job) => localizeJob(job, language)),
    [myJobs, language],
  );

  const localizedOpenJobs = useMemo(() => openJobs.map((job) => localizeJob(job, language)), [openJobs, language]);

  const stats = useMemo(() => {
    const inProgress = activeJobs.length;
    const completed = archivedJobs.filter((job) => job.status === "completed").length;
    return {
      assigned: activeJobs.length,
      inProgress,
      completed,
      available: localizedOpenJobs.length,
    };
  }, [activeJobs, archivedJobs, localizedOpenJobs]);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h1 className="title">{copy.title}</h1>
        <p className="subtitle">{copy.subtitle}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.assigned}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.assigned}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.inProgress}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.inProgress}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.completed}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.completed}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.available}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.available}</p>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="btn-primary" to="/jobs?status=open">
            {copy.openNewJobs}
          </Link>
          <Link className="btn-secondary" to="/profile">
            {copy.myProfile}
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.myActiveJobs}</h2>
        {loading ? <p className="mt-3 text-sm text-slate-600">{copy.loading}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {!loading && !error && activeJobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">{copy.noActive}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {activeJobs.slice(0, 8).map((job) => (
            <article
              key={job.id}
              className={`rounded-2xl border p-4 ${
                job.status === "completed"
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white"
                  : "border-slate-200 bg-white/80"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-600">
                    {job.category_name} · {job.city}
                  </p>
                  {job.status === "completed" ? (
                    <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      ✓ {copy.completed}
                    </span>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-600">{job.address || copy.addressFallback}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatMoney(job.budget, language)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn-secondary" to={`/jobs/${job.id}`}>
                  {copy.openJob}
                </Link>
                <Link className="btn-secondary" to={`/jobs/${job.id}#route-panel`}>
                  {copy.route}
                </Link>
                <Link className="btn-secondary" to={`/chat?jobId=${job.id}`}>
                  {copy.chat}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.archive}</h2>
            <p className="mt-2 text-sm text-slate-600">{copy.archiveText}</p>
          </div>
          <div className="badge">
            {archivedJobs.length} {copy.archivedCount}
          </div>
        </div>

        {!loading && !error && archivedJobs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">{copy.archiveEmpty}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {archivedJobs.slice(0, 6).map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-600">
                    {job.category_name} · {job.city}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{job.address || copy.addressFallback}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatMoney(job.budget, language)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn-secondary" to={`/jobs/${job.id}`}>
                  {copy.openJob}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.jobsToRespond}</h2>
        {!loading && !error && localizedOpenJobs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">{copy.noOpenJobs}</p>
        ) : null}
        <div className="mt-4 space-y-3">
          {localizedOpenJobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-600">
                    {job.category_name} · {job.city}
                  </p>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatMoney(job.budget, language)}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Link className="btn-primary" to={`/jobs/${job.id}`}>
                  {copy.respond}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default WorkerCabinetPage;


import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { RatingInline } from "../components/RatingDisplay";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, localizeJob, localizeWorker } from "../i18n/contentTranslations";

const statusTitles = {
  ru: {
    open: "Открытые",
    in_progress: "В работе",
    completed: "Завершённые",
    cancelled: "Отменённые",
  },
  ky: {
    open: "Ачык",
    in_progress: "Иште",
    completed: "Аяктаган",
    cancelled: "Жокко чыгарылган",
  },
};

const pageCopy = {
  ru: {
    loadError: "Не удалось загрузить кабинет заказчика.",
    title: "Кабинет заказчика",
    subtitle: "Управляйте заказами, следите за откликами и подбирайте исполнителей в одном рабочем пространстве.",
    totalJobs: "Всего заказов",
    open: "Открытые",
    inProgress: "В работе",
    completed: "Завершённые",
    totalResponses: "Откликов всего",
    publishJob: "Опубликовать заказ",
    myJobs: "Все мои заказы",
    activeJobs: "Активные заказы",
    loading: "Загружаем активные заказы...",
    noActive: "Сейчас у вас нет активных заказов.",
    responses: "Откликов",
    openJob: "Открыть заказ",
    goToChat: "Перейти в чат",
    archive: "Архив заказов",
    archiveText: "Отменённые и завершённые заказы больше не мешают в рабочем списке, но остаются в истории.",
    archivedCount: "в архиве",
    archiveEmpty: "Архив пока пуст.",
    open: "Открытые",
    recommendedWorkers: "Рекомендованные исполнители",
    noRecommendations: "Пока нет рекомендаций.",
    cityMissing: "Город не указан",
    openProfile: "Открыть профиль",
    writeChat: "Написать в чат",
  },
  ky: {
    loadError: "Кардардын кабинети жүктөлгөн жок.",
    title: "Кардардын кабинети",
    subtitle: "Заказдарды башкарып, жоопторду көзөмөлдөп жана аткаруучуларды бир жерден тандаңыз.",
    totalJobs: "Бардык заказдар",
    open: "Ачык",
    inProgress: "Иште",
    completed: "Аяктаган",
    totalResponses: "Бардык жооптор",
    publishJob: "Тапшырма жарыялоо",
    myJobs: "Менин заказдарым",
    activeJobs: "Активдүү заказдар",
    loading: "Активдүү заказдар жүктөлүүдө...",
    noActive: "Азырынча активдүү заказдарыңыз жок.",
    responses: "Жооптор",
    openJob: "Заказды ачуу",
    goToChat: "Чатка өтүү",
    archive: "Заказдардын архиви",
    archiveText: "Жокко чыгарылган жана аяктаган заказдар негизги тизмеге тоскоол болбой, тарыхта сакталып калат.",
    archivedCount: "архивде",
    archiveEmpty: "Архив азырынча бош.",
    recommendedWorkers: "Сунушталган аткаруучулар",
    noRecommendations: "Азырынча сунуштар жок.",
    cityMissing: "Шаар көрсөтүлгөн эмес",
    openProfile: "Профилди ачуу",
    writeChat: "Чатка жазуу",
  },
  en: {
    loadError: "Unable to load the customer dashboard.",
    title: "Customer dashboard",
    subtitle:
      "Manage your jobs, track responses, and choose specialists in one workspace.",
    totalJobs: "Total jobs",
    open: "Open",
    inProgress: "In progress",
    completed: "Completed",
    totalResponses: "Total responses",
    publishJob: "Post a job",
    myJobs: "All my jobs",
    activeJobs: "Active jobs",
    loading: "Loading active jobs...",
    noActive: "You do not have any active jobs right now.",
    responses: "Responses",
    openJob: "Open job",
    goToChat: "Open chat",
    archive: "Jobs archive",
    archiveText:
      "Cancelled and completed jobs stay in history but no longer distract in the active work list.",
    archivedCount: "in archive",
    archiveEmpty: "The archive is empty for now.",
    recommendedWorkers: "Recommended specialists",
    noRecommendations: "No recommendations yet.",
    cityMissing: "City not specified",
    openProfile: "Open profile",
    writeChat: "Message in chat",
  },
};

function CustomerCabinetPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const statusCopy = statusTitles[language] || statusTitles.ru;
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCabinet = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError("");

      try {
        const [jobsResult, workersResult] = await Promise.all([
          api.get("/jobs", { params: { customerId: user.id, sort: "recent" } }),
          api.get("/workers", { params: { city: user.city || undefined, minRating: 4 } }),
        ]);

        setJobs(jobsResult.data);
        setWorkers(workersResult.data.slice(0, 5));
      } catch (err) {
        setError(err.response?.data?.message || copy.loadError);
      } finally {
        setLoading(false);
      }
    };

    void loadCabinet();
  }, [copy.loadError, user?.city, user?.id]);

  const stats = useMemo(() => {
    const byStatus = { open: 0, in_progress: 0, completed: 0, cancelled: 0 };
    let totalResponses = 0;

    jobs.forEach((job) => {
      byStatus[job.status] = (byStatus[job.status] || 0) + 1;
      totalResponses += Number(job.responses_count || 0);
    });

    return {
      total: jobs.length,
      totalResponses,
      ...byStatus,
    };
  }, [jobs]);

  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status === "open" || job.status === "in_progress").map((job) => localizeJob(job, language)),
    [jobs, language],
  );

  const archivedJobs = useMemo(
    () => jobs.filter((job) => job.status === "completed" || job.status === "cancelled").map((job) => localizeJob(job, language)),
    [jobs, language],
  );

  const localizedWorkers = useMemo(() => workers.map((worker) => localizeWorker(worker, language)), [workers, language]);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h1 className="title">{copy.title}</h1>
        <p className="subtitle">{copy.subtitle}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.totalJobs}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.open}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.open}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.inProgress}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.in_progress}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.completed}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.completed}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase text-slate-500">{copy.totalResponses}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalResponses}</p>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="btn-primary" to="/jobs/new">
            {copy.publishJob}
          </Link>
          <Link className="btn-secondary" to={`/jobs?customerId=${user?.id || ""}`}>
            {copy.myJobs}
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.activeJobs}</h2>
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
                    {job.category_name} · {statusCopy[job.status] || job.status}
                  </p>
                  {job.status === "completed" ? (
                    <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      ✓ {statusCopy.completed}
                    </span>
                  ) : null}
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p className="text-lg font-bold text-slate-900">{formatMoney(job.budget, language)}</p>
                  <p>
                    {copy.responses}: {job.responses_count}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn-secondary" to={`/jobs/${job.id}`}>
                  {copy.openJob}
                </Link>
                <Link className="btn-secondary" to={`/chat?jobId=${job.id}`}>
                  {copy.goToChat}
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
                    {job.category_name} · {statusCopy[job.status] || job.status}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p className="text-lg font-bold text-slate-900">{formatMoney(job.budget, language)}</p>
                  <p>
                    {copy.responses}: {job.responses_count}
                  </p>
                </div>
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
        <h2 className="text-2xl font-bold text-slate-950">{copy.recommendedWorkers}</h2>
        {!localizedWorkers.length ? <p className="mt-3 text-sm text-slate-600">{copy.noRecommendations}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {localizedWorkers.map((worker) => (
            <article key={worker.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-center gap-3">
                <UserAvatar className="h-14 w-14 rounded-2xl" name={worker.fullName} src={worker.avatarUrl} />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{worker.fullName}</h3>
                  <p className="text-sm text-slate-600">{worker.city || copy.cityMissing}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                <RatingInline rating={worker.rating || 0} reviews={worker.totalReviews || 0} />
              </p>
              <div className="mt-3 flex gap-2">
                <Link className="btn-secondary" to={`/workers/${worker.id}`}>
                  {copy.openProfile}
                </Link>
                <Link className="btn-secondary" to={`/chat?withUserId=${worker.id}`}>
                  {copy.writeChat}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CustomerCabinetPage;

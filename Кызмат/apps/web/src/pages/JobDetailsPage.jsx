import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import JobRoutePanel from "../components/JobRoutePanel";
import { RatingInline, RatingValue } from "../components/RatingDisplay";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, localizeJob } from "../i18n/contentTranslations";

const statusMap = {
  ru: {
    open: "Открыт",
    in_progress: "В работе",
    completed: "Завершён",
    cancelled: "Отменён",
  },
  ky: {
    open: "Ачык",
    in_progress: "Иште",
    completed: "Аяктаган",
    cancelled: "Жокко чыгарылган",
  },
  en: {
    open: "Open",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
  },
};

const pageCopy = {
  ru: {
    loadError: "Не удалось загрузить заказ",
    responseError: "Не удалось отправить отклик",
    selectWorkerError: "Не удалось выбрать исполнителя",
    statusError: "Не удалось изменить статус",
    reviewError: "Не удалось сохранить отзыв",
    reviewTitle: "Оцените исполнителя",
    reviewText: "Отзыв может оставить только заказчик после завершения заказа. Оценка обновит средний рейтинг исполнителя.",
    reviewRating: "Оценка",
    reviewComment: "Комментарий",
    reviewPlaceholder: "Напишите, как прошла работа",
    sendReview: "Оставить отзыв",
    reviewSaved: "Отзыв сохранён. Рейтинг исполнителя обновлён.",
    yourReview: "Ваш отзыв",
    averageWorkerRating: "Средний рейтинг исполнителя",
    loading: "Загрузка заказа...",
    status: "Статус",
    escrow: "Escrow",
    city: "Город",
    address: "Адрес",
    addressFallback: "Заказчик уточнит адрес в чате",
    landmark: "Ориентир",
    customer: "Заказчик",
    worker: "Исполнитель",
    workerMissing: "Исполнитель не выбран",
    backToJobs: "К списку заказов",
    complete: "Завершить заказ",
    cancel: "Отменить заказ",
    respondTitle: "Откликнуться на заказ",
    yourPrice: "Ваша цена",
    etaDays: "Срок (дни)",
    sendResponse: "Отправить отклик",
    commentPlaceholder: "Комментарий к отклику",
    responsesTitle: "Отклики исполнителей",
    responseStatus: "Статус",
    profile: "Профиль",
    write: "Написать",
    chooseWorker: "Выбрать исполнителя",
    noResponses: "Откликов пока нет.",
    detailsChat: "Открыть чат с исполнителем",
    writeCustomer: "Написать заказчику",
  },
  ky: {
    loadError: "Заказ жүктөлгөн жок",
    responseError: "Жооп жөнөтүлгөн жок",
    selectWorkerError: "Аткаруучуну тандоо мүмкүн болгон жок",
    statusError: "Статусту өзгөртүү мүмкүн болгон жок",
    reviewError: "Пикирди сактоо мүмкүн болгон жок",
    reviewTitle: "Аткаруучуга баа бериңиз",
    reviewText: "Пикирди заказ аяктагандан кийин заказчы гана калтыра алат. Баа аткаруучунун орточо рейтингин жаңылайт.",
    reviewRating: "Баа",
    reviewComment: "Пикир",
    reviewPlaceholder: "Иш кандай өткөнүн жазыңыз",
    sendReview: "Пикир калтыруу",
    reviewSaved: "Пикир сакталды. Аткаруучунун рейтинги жаңырды.",
    yourReview: "Сиздин пикириңиз",
    averageWorkerRating: "Аткаруучунун орточо рейтинги",
    loading: "Заказ жүктөлүүдө...",
    status: "Статус",
    escrow: "Escrow",
    city: "Шаар",
    address: "Дарек",
    addressFallback: "Кардар даректи чатта тактайт",
    landmark: "Багыт",
    customer: "Кардар",
    worker: "Аткаруучу",
    workerMissing: "Аткаруучу тандала элек",
    backToJobs: "Заказдар тизмесине",
    complete: "Заказды аяктоо",
    cancel: "Заказды жокко чыгаруу",
    respondTitle: "Заказга жооп берүү",
    yourPrice: "Сиздин баа",
    etaDays: "Мөөнөт (күн)",
    sendResponse: "Жооп жөнөтүү",
    commentPlaceholder: "Жоопко комментарий",
    responsesTitle: "Аткаруучулардын жооптору",
    responseStatus: "Статус",
    profile: "Профиль",
    write: "Жазуу",
    chooseWorker: "Аткаруучуну тандоо",
    noResponses: "Азырынча жооп жок.",
    detailsChat: "Аткаруучу менен чатты ачуу",
    writeCustomer: "Кардарга жазуу",
  },
  en: {
    loadError: "Unable to load job",
    responseError: "Unable to send response",
    selectWorkerError: "Unable to select specialist",
    statusError: "Unable to change status",
    reviewError: "Unable to save review",
    reviewTitle: "Rate the specialist",
    reviewText: "Only the customer can leave a review after the job is completed. The rating updates the specialist's average score.",
    reviewRating: "Rating",
    reviewComment: "Comment",
    reviewPlaceholder: "Describe how the job went",
    sendReview: "Submit review",
    reviewSaved: "Review saved. The specialist rating has been updated.",
    yourReview: "Your review",
    averageWorkerRating: "Specialist average rating",
    loading: "Loading job...",
    status: "Status",
    escrow: "Escrow",
    city: "City",
    address: "Address",
    addressFallback: "The customer will clarify the address in chat",
    landmark: "Landmark",
    customer: "Customer",
    worker: "Specialist",
    workerMissing: "Specialist not selected",
    backToJobs: "Back to jobs",
    complete: "Complete job",
    cancel: "Cancel job",
    respondTitle: "Respond to job",
    yourPrice: "Your price",
    etaDays: "ETA (days)",
    sendResponse: "Send response",
    commentPlaceholder: "Comment for the response",
    responsesTitle: "Specialist responses",
    responseStatus: "Status",
    profile: "Profile",
    write: "Message",
    chooseWorker: "Choose specialist",
    noResponses: "No responses yet.",
    detailsChat: "Open chat with specialist",
    writeCustomer: "Message customer",
  },
};

function JobDetailsPage() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const currentStatusMap = statusMap[language] || statusMap.ru;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseForm, setResponseForm] = useState({ proposedPrice: "", message: "", etaDays: "" });
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const myRole = user?.role;
  const canRespond = myRole === "worker" || myRole === "admin";

  const loadJob = useCallback(
    async (options = {}) => {
      const { silent = false } = options;

      if (!silent) {
        setLoading(true);
      }

      setError("");
      try {
        const { data } = await api.get(`/jobs/${jobId}`);
        setJob(data);
        setResponseForm((prev) => ({
          ...prev,
          proposedPrice: prev.proposedPrice || data.budget,
        }));
        return data;
      } catch (err) {
        setError(err.response?.data?.message || copy.loadError);
        return null;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [copy.loadError, jobId],
  );

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!job?.worker_id || job.status !== "in_progress") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void loadJob({ silent: true });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [job?.status, job?.worker_id, loadJob]);

  const submitResponse = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      await api.post("/jobs/respond", {
        jobId,
        proposedPrice: Number(responseForm.proposedPrice),
        message: responseForm.message || undefined,
        etaDays: responseForm.etaDays ? Number(responseForm.etaDays) : undefined,
      });
      setResponseForm((prev) => ({ ...prev, message: "", etaDays: "" }));
      await loadJob();
    } catch (err) {
      setError(err.response?.data?.message || copy.responseError);
    } finally {
      setActionLoading(false);
    }
  };

  const selectWorker = async (workerId) => {
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/jobs/${jobId}/select-worker`, { workerId });
      await loadJob();
    } catch (err) {
      setError(err.response?.data?.message || copy.selectWorkerError);
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (status) => {
    setActionLoading(true);
    setError("");
    try {
      await api.patch(`/jobs/${jobId}/status`, { status });
      await loadJob();
    } catch (err) {
      setError(err.response?.data?.message || copy.statusError);
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!job?.worker_id) return;

    setActionLoading(true);
    setError("");
    setReviewSuccess("");

    try {
      await api.post("/reviews", {
        jobId,
        revieweeId: job.worker_id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim() || undefined,
      });
      setReviewForm({ rating: "5", comment: "" });
      setReviewSuccess(copy.reviewSaved);
      await loadJob();
    } catch (err) {
      setError(err.response?.data?.message || copy.reviewError);
    } finally {
      setActionLoading(false);
    }
  };

  const availableStatusActions = useMemo(() => {
    if (!job || !job.canUpdateStatus) return [];
    if (job.status === "in_progress") return ["completed"];
    if (job.status === "open") return ["cancelled"];
    return [];
  }, [job]);

  const directChatLink = useMemo(() => {
    if (!job || !user) return null;

    const isCustomerSide = user.role === "customer" || user.role === "admin";
    const isWorkerSide = user.role === "worker" || user.role === "admin";

    if (isCustomerSide && job.worker_id) {
      return {
        to: `/chat?withUserId=${job.worker_id}&jobId=${job.id}`,
        label: job.worker_name ? `${copy.write} ${job.worker_name}` : copy.detailsChat,
      };
    }

    if (isWorkerSide && user.id !== job.customer_id) {
      return {
        to: `/chat?withUserId=${job.customer_id}&jobId=${job.id}`,
        label: copy.writeCustomer,
      };
    }

    return null;
  }, [copy.detailsChat, copy.write, copy.writeCustomer, job, user]);

  const canBuildRoute = useMemo(() => {
    if (!job || !user) return false;
    return user.role === "admin" || user.id === job.worker_id;
  }, [job, user]);

  if (loading) {
    return <section className="panel">{copy.loading}</section>;
  }

  if (error && !job) {
    return <section className="panel text-red-600">{error}</section>;
  }

  if (!job) {
    return null;
  }

  const localizedJob = localizeJob(job, language);

  return (
    <div className="space-y-6">
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="badge">{localizedJob.category_name}</span>
            <h1 className="title mt-3">{localizedJob.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {localizedJob.city} · {copy.status}: {currentStatusMap[job.status] || job.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{formatMoney(job.budget, language)}</p>
            <p className="text-xs text-slate-500">
              {copy.escrow}: {job.escrow_status}
            </p>
          </div>
        </div>

        <p className="text-slate-700">{localizedJob.description}</p>

        <div className="grid gap-3 rounded-2xl border border-[rgba(141,21,48,0.12)] bg-[#fcf8f4] p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.city}</p>
            <p className="mt-2 font-semibold text-slate-900">{localizedJob.city}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.address}</p>
            <p className="mt-2 font-semibold text-slate-900">{localizedJob.address || copy.addressFallback}</p>
          </div>
          {localizedJob.location_note ? (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.landmark}</p>
              <p className="mt-2 text-sm text-slate-700">{localizedJob.location_note}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
          <span>
            {copy.customer}: {job.customer_name}
          </span>
          {job.worker_name ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{copy.worker}: {localizedJob.worker_name || job.worker_name}</span>
              <RatingInline className="badge border-slate-200 bg-white" rating={job.worker_rating || 0} reviews={job.worker_reviews || 0} />
            </span>
          ) : (
            <span>{copy.workerMissing}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" to="/jobs">
            {copy.backToJobs}
          </Link>
          {directChatLink ? (
            <Link className="btn-secondary" to={directChatLink.to}>
              {directChatLink.label}
            </Link>
          ) : null}
          {availableStatusActions.includes("completed") ? (
            <button className="btn-primary" onClick={() => updateStatus("completed")} disabled={actionLoading} type="button">
              {copy.complete}
            </button>
          ) : null}
          {availableStatusActions.includes("cancelled") ? (
            <button className="btn-secondary" onClick={() => updateStatus("cancelled")} disabled={actionLoading} type="button">
              {copy.cancel}
            </button>
          ) : null}
        </div>
      </section>

      {job.address || job.latitude || job.longitude ? (
        <JobRoutePanel canBuildRoute={canBuildRoute} job={job} onJobRefresh={loadJob} />
      ) : null}

      {(job.canReviewWorker || job.customerReview) && (
        <section className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{copy.reviewTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.reviewText}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.averageWorkerRating}</p>
              <div className="mt-2">
                <RatingInline rating={job.worker_rating || 0} reviews={job.worker_reviews || 0} />
              </div>
            </div>
          </div>

          {job.customerReview ? (
            <article className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{copy.yourReview}</h3>
                <RatingValue rating={job.customerReview.rating || 0} />
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{job.customerReview.comment || "-"}</p>
            </article>
          ) : job.canReviewWorker ? (
            <form className="mt-5 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end" onSubmit={submitReview}>
              <div>
                <label className="label">{copy.reviewRating}</label>
                <select className="input" value={reviewForm.rating} onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{copy.reviewComment}</label>
                <textarea
                  className="input min-h-24"
                  maxLength={1500}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                  placeholder={copy.reviewPlaceholder}
                  value={reviewForm.comment}
                />
              </div>
              <button className="btn-primary" disabled={actionLoading} type="submit">
                {copy.sendReview}
              </button>
            </form>
          ) : null}

          {reviewSuccess ? <p className="mt-4 text-sm font-medium text-emerald-700">{reviewSuccess}</p> : null}
        </section>
      )}

      {canRespond && job.canRespond ? (
        <section className="panel">
          <h2 className="text-2xl font-bold text-slate-950">{copy.respondTitle}</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={submitResponse}>
            <input
              className="input"
              min="1"
              onChange={(event) => setResponseForm((prev) => ({ ...prev, proposedPrice: event.target.value }))}
              placeholder={copy.yourPrice}
              required
              type="number"
              value={responseForm.proposedPrice}
            />
            <input
              className="input"
              min="1"
              onChange={(event) => setResponseForm((prev) => ({ ...prev, etaDays: event.target.value }))}
              placeholder={copy.etaDays}
              type="number"
              value={responseForm.etaDays}
            />
            <div className="flex items-center">
              <button className="btn-primary w-full" disabled={actionLoading} type="submit">
                {copy.sendResponse}
              </button>
            </div>
            <textarea
              className="input min-h-24 sm:col-span-3"
              onChange={(event) => setResponseForm((prev) => ({ ...prev, message: event.target.value }))}
              placeholder={copy.commentPlaceholder}
              value={responseForm.message}
            />
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.responsesTitle}</h2>
        {job.responses?.length ? (
          <div className="mt-4 space-y-3">
            {job.responses.map((response) => (
              <article key={response.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{response.worker_name}</h3>
                    <p className="text-sm text-slate-600">
                      <RatingInline rating={response.worker_rating || 0} reviews={response.worker_reviews || 0} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{formatMoney(response.proposed_price, language)}</p>
                    <p className="text-xs text-slate-500">
                      {copy.responseStatus}: {response.status}
                    </p>
                  </div>
                </div>
                {response.message ? <p className="mt-2 text-sm text-slate-700">{localizedJob.responses?.find((item) => item.id === response.id)?.message || response.message}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link className="btn-secondary" to={`/workers/${response.worker_id}`}>
                    {copy.profile}
                  </Link>
                  <Link className="btn-secondary" to={`/chat?withUserId=${response.worker_id}&jobId=${job.id}`}>
                    {copy.write}
                  </Link>
                  {job.canSelectWorker && response.status !== "accepted" ? (
                    <button
                      className="btn-primary"
                      disabled={actionLoading}
                      onClick={() => selectWorker(response.worker_id)}
                      type="button"
                    >
                      {copy.chooseWorker}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">{copy.noResponses}</p>
        )}
      </section>

      {error ? <p className="panel text-red-600">{error}</p> : null}
    </div>
  );
}

export default JobDetailsPage;

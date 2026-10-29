import { useState } from "react";
import { Link } from "react-router-dom";
import { RatingValue } from "./RatingDisplay";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, localizeJob } from "../i18n/contentTranslations";

const statusMeta = {
  ru: {
    open: "Открыт",
    in_progress: "В работе",
    completed: "Завершён",
    cancelled: "Отменён",
    dateMissing: "Дата не указана",
    urgent: "Срочно",
    escrow: "Безопасная сделка",
    orderType: "Заказная работа",
    vacancyType: "Вакансия",
    budget: "Бюджет",
    salary: "Оплата",
    responses: "Откликов",
    customer: "Заказчик",
    customerRating: "Рейтинг клиента",
    location: "Локация",
    details: "Подробнее о заказе",
    vacancyDetails: "Подробнее о вакансии",
    respond: "Откликнуться",
    yourPrice: "Ваша цена",
    responseMessage: "Кратко опишите сроки, опыт или условия работы",
    sendResponse: "Отправить отклик",
    close: "Закрыть",
    citySeparator: "·",
    publishedAt: "Опубликован",
    until: "До",
    completedBanner: "Заказ завершён",
    completedHint: "Работа закрыта. Можно посмотреть детали, переписку и отзыв.",
    published: "Размещено",
  },
  ky: {
    open: "Ачык",
    in_progress: "Иште",
    completed: "Аяктаган",
    cancelled: "Жокко чыгарылган",
    dateMissing: "Дата көрсөтүлгөн эмес",
    urgent: "Шашылыш",
    escrow: "Коопсуз келишим",
    orderType: "Заказдык иш",
    vacancyType: "Вакансия",
    budget: "Бюджет",
    salary: "Төлөм",
    responses: "Жооптор",
    customer: "Кардар",
    customerRating: "Кардардын рейтинги",
    location: "Жайгашкан жер",
    details: "Тапшырма тууралуу",
    vacancyDetails: "Вакансия тууралуу",
    respond: "Жооп берүү",
    yourPrice: "Сиздин баа",
    responseMessage: "Мөөнөтүн, тажрыйбаңызды же шарттарыңызды кыскача жазыңыз",
    sendResponse: "Жооп жөнөтүү",
    close: "Жабуу",
    citySeparator: "·",
    publishedAt: "Жарыяланган",
    until: "Чейин",
    completedBanner: "Заказ аяктады",
    completedHint: "Иш жабылды. Деталдарын, кат алышууну жана пикирди көрүүгө болот.",
    published: "Жарыяланган",
  },
  en: {
    open: "Open",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    dateMissing: "Date not specified",
    urgent: "Urgent",
    escrow: "Secure deal",
    orderType: "Custom job",
    vacancyType: "Vacancy",
    budget: "Budget",
    salary: "Pay",
    responses: "Responses",
    customer: "Customer",
    customerRating: "Customer rating",
    location: "Location",
    details: "Job details",
    vacancyDetails: "Vacancy details",
    respond: "Send response",
    yourPrice: "Your price",
    responseMessage: "Briefly describe timing, experience, or conditions",
    sendResponse: "Send response",
    close: "Close",
    citySeparator: "·",
    publishedAt: "Published",
    until: "Until",
    completedBanner: "Job completed",
    completedHint: "The work is closed. You can review details, chat, and feedback.",
    published: "Published",
  },
};

const statusClassMap = {
  open: "border-emerald-100 bg-emerald-50 text-emerald-700",
  in_progress: "border-sky-100 bg-sky-50 text-sky-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-100 bg-rose-50 text-rose-700",
};

function formatDate(value, language, fallback) {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleDateString(language === "ky" ? "ky-KG" : language === "en" ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function JobCard({ job, canRespond, onRespond, compact = false }) {
  const { language } = useLanguage();
  const copy = statusMeta[language] || statusMeta.ru;
  const localizedJob = localizeJob(job, language);
  const [isOpen, setIsOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState(job.budget);
  const [message, setMessage] = useState("");
  const isCompleted = localizedJob.status === "completed";
  const isVacancy = localizedJob.job_type === "vacancy";
  const cardTheme = isVacancy
    ? {
        shell: "border-[#d8a3b0] bg-[linear-gradient(135deg,#fff7f8_0%,#ffffff_45%,#f8edf0_100%)] shadow-[0_28px_80px_-48px_rgba(141,21,48,0.5)]",
        rail: "from-[#8d1530] via-[#b42345] to-[#ead3d9]",
        priceBox: "border-[#ead3d9] bg-white/92",
        typeBadge: "border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]",
      }
    : {
        shell: "border-slate-200 bg-white/95 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.28)]",
        rail: "from-slate-900 via-[#8d1530] to-[#ead3d9]",
        priceBox: "border-slate-200 bg-slate-50/90",
        typeBadge: "border-slate-200 bg-white text-slate-700",
      };

  const submitResponse = (event) => {
    event.preventDefault();
    onRespond({
      jobId: localizedJob.id,
      proposedPrice: Number(proposedPrice),
      message,
    });
    setMessage("");
    setIsOpen(false);
  };

  return (
    <article
      className={`relative space-y-5 overflow-hidden rounded-[30px] border p-5 transition hover:-translate-y-0.5 sm:p-6 ${
        isCompleted
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-[#fcf8f4] shadow-[0_28px_70px_-42px_rgba(16,185,129,0.65)]"
          : cardTheme.shell
      }`}
    >
      {!isCompleted ? <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${cardTheme.rail}`} /> : null}
      {isCompleted ? (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#8d1530]" />
      ) : null}

      {isCompleted ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50/90 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">✓</span>
            <div>
              <p className="font-bold text-emerald-800">{copy.completedBanner}</p>
              <p className="text-sm text-emerald-700">{copy.completedHint}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="badge">{localizedJob.category_name}</span>
            <span className={`badge ${cardTheme.typeBadge}`}>
              {isVacancy ? copy.vacancyType : copy.orderType}
            </span>
            <span className={`badge ${statusClassMap[localizedJob.status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {copy[localizedJob.status] || localizedJob.status}
            </span>
            {localizedJob.is_urgent ? <span className="badge border-[#ead3d9] bg-[#f9ecef] text-[#8d1530]">{copy.urgent}</span> : null}
            {localizedJob.escrow_status !== "not_required" ? (
              <span className="badge border-slate-200 bg-white text-slate-700">{copy.escrow}</span>
            ) : null}
          </div>
          <div>
            <h3 className="break-words text-[1.7rem] font-black leading-tight tracking-[-0.045em] text-slate-950 sm:text-3xl">{localizedJob.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-white/70 px-3 py-1">{localizedJob.city}</span>
              <span className="rounded-full bg-white/70 px-3 py-1">{copy.until} {formatDate(localizedJob.due_date, language, copy.dateMissing)}</span>
              <span className="rounded-full bg-white/70 px-3 py-1">{copy.published} {formatDate(localizedJob.created_at, language, copy.dateMissing)}</span>
            </div>
          </div>
        </div>
        <div className={`rounded-[26px] border px-5 py-5 text-left lg:text-right ${isCompleted ? "border-emerald-200 bg-white/90" : cardTheme.priceBox}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{isVacancy ? copy.salary : copy.budget}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-slate-950">
            {formatMoney(localizedJob.budget, language)}
          </p>
          <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
            {copy.responses}: {localizedJob.responses_count}
          </p>
        </div>
      </div>

      {!compact ? <p className="text-[15px] leading-7 text-slate-700">{localizedJob.description}</p> : null}

      <div className="grid gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/72 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.customer}</p>
          <p className="mt-1 font-semibold text-slate-900">{localizedJob.customer_name}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/72 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.customerRating}</p>
          <p className="mt-1 font-semibold text-slate-900">
            <RatingValue rating={localizedJob.customer_rating || 0} />
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/72 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.location}</p>
          <p className="mt-1 font-semibold text-slate-900">{localizedJob.city}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Link className="btn-secondary w-full sm:w-auto" to={`/jobs/${localizedJob.id}`}>
          {isVacancy ? copy.vacancyDetails : copy.details}
        </Link>

        {canRespond && localizedJob.status === "open" && !compact ? (
          !isOpen ? (
            <button className="btn-primary w-full sm:w-auto" type="button" onClick={() => setIsOpen(true)}>
              {copy.respond}
            </button>
          ) : (
            <form className="grid w-full gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3" onSubmit={submitResponse}>
              <input
                required
                className="input"
                min="1"
                placeholder={copy.yourPrice}
                type="number"
                value={proposedPrice}
                onChange={(event) => setProposedPrice(event.target.value)}
              />
              <input
                className="input sm:col-span-2"
                placeholder={copy.responseMessage}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <div className="flex flex-col gap-2 sm:col-span-3 sm:flex-row">
                <button className="btn-primary w-full sm:w-auto" type="submit">
                  {copy.sendResponse}
                </button>
                <button className="btn-secondary w-full sm:w-auto" type="button" onClick={() => setIsOpen(false)}>
                  {copy.close}
                </button>
              </div>
            </form>
          )
        ) : null}
      </div>
    </article>
  );
}

export default JobCard;

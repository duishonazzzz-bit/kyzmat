import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { RatingInline, RatingValue, ReviewCountText } from "../components/RatingDisplay";
import UserAvatar from "../components/UserAvatar";
import WorkerStatusBadges from "../components/WorkerStatusBadges";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { localizeWorker, translateCityName, translateKnownText } from "../i18n/contentTranslations";
import { getWorkerVerificationMeta, hasWorkerResumeContent, normalizeWorkerResume } from "../utils/workerResume";

const pageCopy = {
  ru: {
    loadError: "Не удалось загрузить профиль специалиста.",
    loading: "Загружаем профиль специалиста...",
    notFound: "Профиль специалиста не найден.",
    profileBadge: "Профиль специалиста",
    defaultCity: "Кыргызстан",
    completedJobs: "выполненных заказов",
    emptyBio:
      "Специалист пока не добавил подробное описание. Вы можете написать ему в чат и уточнить условия сотрудничества.",
    chat: "Написать в чат",
    loginToChat: "Войти, чтобы написать",
    cityJobs: "Заказы в этом городе",
    backToCatalog: "Назад в каталог",
    resumeKicker: "Резюме и форматы работы",
    resumeSpotlight: "Профиль специалиста в одном экране",
    resumeSpotlightText:
      "Здесь собрана ключевая информация для выбора: опыт, навыки, форматы услуг, география работы, отзывы и быстрый переход к диалогу.",
    skillsMissing: "Навыки пока не указаны.",
    serviceModes: "Форматы услуг",
    summary: "Краткая сводка",
    city: "Город",
    rating: "Рейтинг",
    reviews: "Отзывы",
    done: "Выполнено",
    experience: "Опыт",
    years: "лет",
    notSpecified: "Не указан",
    notSpecifiedPlural: "Не указаны",
    languages: "Языки",
    verification: "Проверка",
    responseTime: "Ответ",
    responseInChat: "В чате",
    workTerms: "Условия работы",
    workArea: "Где работает:",
    availability: "Доступность:",
    pricing: "По ценам:",
    replySpeed: "Как быстро отвечает:",
    trust: "Проверка и доверие",
    resumeAndExperience: "Резюме и опыт",
    resumeAndExperienceText:
      "Здесь собрана основная информация, которая помогает оценить опыт, условия работы и надёжность исполнителя.",
    resumeFilled: "Заполнено",
    resumeBasic: "Базовый профиль",
    education: "Образование и курсы",
    achievements: "Достижения и опыт",
    portfolioCases: "Кейсы из портфолио",
    portfolio: "Портфолио",
    partialResumeText:
      "Основные данные уже заполнены, но подробный рассказ о специалисте и примеры работ пока не добавлены.",
    emptyResumeText:
      "Исполнитель пока не заполнил расширенное резюме. Можно связаться с ним в чате и уточнить детали напрямую.",
    customerReviews: "Отзывы клиентов",
    customerReviewsText: "Оценки и комментарии клиентов по завершённым заказам.",
    reviewEntries: "записей",
    defaultReviewer: "Клиент",
    emptyComment: "Клиент оставил оценку без комментария.",
    noReviews:
      "Пока нет опубликованных отзывов. Вы можете связаться со специалистом и обсудить задачу напрямую.",
  },
  ky: {
    loadError: "Аткаруучунун профили жүктөлгөн жок.",
    loading: "Аткаруучунун профили жүктөлүүдө...",
    notFound: "Аткаруучунун профили табылган жок.",
    profileBadge: "Аткаруучунун профили",
    defaultCity: "Кыргызстан",
    completedJobs: "аткарылган заказ",
    emptyBio:
      "Аткаруучу азырынча кеңири сүрөттөмө кошо элек. Сиз ага чат аркылуу жазып, иш шарттарын тактай аласыз.",
    chat: "Чатка жазуу",
    loginToChat: "Жазуу үчүн кириңиз",
    cityJobs: "Бул шаардагы тапшырмалар",
    backToCatalog: "Каталогго кайтуу",
    resumeKicker: "Резюме жана кызмат форматы",
    resumeSpotlight: "Аткаруучунун профили бир экранда",
    resumeSpotlightText:
      "Бул жерде тандоо үчүн негизги маалымат топтолгон: тажрыйба, көндүмдөр, кызмат форматы, иш аймагы, сын-пикирлер жана чатка тез өтүү.",
    skillsMissing: "Көндүмдөр азырынча көрсөтүлгөн эмес.",
    serviceModes: "Кызмат форматы",
    summary: "Кыскача маалымат",
    city: "Шаар",
    rating: "Рейтинг",
    reviews: "Сын-пикирлер",
    done: "Аткарылган",
    experience: "Тажрыйба",
    years: "жыл",
    notSpecified: "Көрсөтүлгөн эмес",
    notSpecifiedPlural: "Көрсөтүлгөн эмес",
    languages: "Тилдер",
    verification: "Текшерүү",
    responseTime: "Жооп",
    responseInChat: "Чатта",
    workTerms: "Иш шарттары",
    workArea: "Кайсы жерде иштейт:",
    availability: "Жеткиликтүүлүк:",
    pricing: "Баа тууралуу:",
    replySpeed: "Канчалык тез жооп берет:",
    trust: "Текшерүү жана ишеним",
    resumeAndExperience: "Резюме жана тажрыйба",
    resumeAndExperienceText:
      "Бул жерде аткаруучунун тажрыйбасын, иш шарттарын жана ишенимдүүлүгүн баалоого жардам берген негизги маалымат чогултулган.",
    resumeFilled: "Толтурулган",
    resumeBasic: "Негизги профиль",
    education: "Билим жана курстар",
    achievements: "Жетишкендиктер жана тажрыйба",
    portfolioCases: "Портфолиодогу кейстер",
    portfolio: "Портфолио",
    partialResumeText:
      "Негизги маалымат толтурулган, бирок адис тууралуу кеңири маалымат жана иштердин мисалдары азырынча кошула элек.",
    emptyResumeText:
      "Аткаруучу азырынча кеңейтилген резюме толтурган эмес. Чат аркылуу байланышып, маалыматты түз тактасаңыз болот.",
    customerReviews: "Кардарлардын сын-пикирлери",
    customerReviewsText: "Аяктаган заказдар боюнча кардарлардын баалоолору жана пикирлери.",
    reviewEntries: "жазуу",
    defaultReviewer: "Кардар",
    emptyComment: "Кардар баа калтырган, бирок комментарий жазган эмес.",
    noReviews:
      "Азырынча жарыяланган сын-пикирлер жок. Сиз адис менен түз байланышып, тапшырманы сүйлөшө аласыз.",
  },
  en: {
    loadError: "Unable to load specialist profile.",
    loading: "Loading specialist profile...",
    notFound: "Specialist profile not found.",
    profileBadge: "Specialist profile",
    defaultCity: "Kyrgyzstan",
    completedJobs: "completed jobs",
    emptyBio:
      "The specialist has not added a detailed description yet. You can message them in chat and clarify the working terms.",
    chat: "Message specialist",
    loginToChat: "Sign in to message",
    cityJobs: "Jobs in this city",
    backToCatalog: "Back to catalog",
    resumeKicker: "Resume and work formats",
    resumeSpotlight: "Specialist profile on one screen",
    resumeSpotlightText:
      "Everything needed for a quick decision is gathered here: experience, skills, service formats, work area, reviews, and a fast path into chat.",
    skillsMissing: "Skills have not been added yet.",
    serviceModes: "Service formats",
    summary: "Summary",
    city: "City",
    rating: "Rating",
    reviews: "Reviews",
    done: "Completed",
    experience: "Experience",
    years: "years",
    notSpecified: "Not specified",
    notSpecifiedPlural: "Not specified",
    languages: "Languages",
    verification: "Verification",
    responseTime: "Response",
    responseInChat: "In chat",
    workTerms: "Work terms",
    workArea: "Works in:",
    availability: "Availability:",
    pricing: "Pricing:",
    replySpeed: "Response speed:",
    trust: "Verification and trust",
    resumeAndExperience: "Resume and experience",
    resumeAndExperienceText:
      "This block contains the core information that helps evaluate the specialist's experience, reliability, and working terms.",
    resumeFilled: "Completed",
    resumeBasic: "Basic profile",
    education: "Education and courses",
    achievements: "Achievements and experience",
    portfolioCases: "Portfolio cases",
    portfolio: "Portfolio",
    partialResumeText:
      "The basic profile is already filled in, but a detailed story about the specialist and examples of work have not been added yet.",
    emptyResumeText:
      "The specialist has not filled in the extended resume yet. You can contact them in chat and clarify the details directly.",
    customerReviews: "Customer reviews",
    customerReviewsText: "Customer ratings and comments for completed jobs.",
    reviewEntries: "entries",
    defaultReviewer: "Customer",
    emptyComment: "The customer left a rating without a comment.",
    noReviews:
      "There are no published reviews yet. You can contact the specialist directly and discuss the job.",
  },
};

function formatReviewDate(value, language) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString(language === "ky" ? "ky-KG" : language === "en" ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </article>
  );
}

function WorkerProfilePage() {
  const { workerId } = useParams();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadWorker = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/workers/${workerId}`);

        if (isMounted) {
          setWorker(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || copy.loadError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadWorker();

    return () => {
      isMounted = false;
    };
  }, [copy.loadError, workerId]);

  const localizedWorker = useMemo(() => localizeWorker(worker, language), [worker, language]);
  const resume = useMemo(() => normalizeWorkerResume(localizedWorker?.workerResume), [localizedWorker?.workerResume]);
  const hasResume = hasWorkerResumeContent(resume);
  const verificationMeta = useMemo(
    () => getWorkerVerificationMeta(resume.verificationStatus, localizedWorker?.isPro, language),
    [language, resume.verificationStatus, localizedWorker?.isPro],
  );

  if (loading) {
    return <section className="panel">{copy.loading}</section>;
  }

  if (error && !worker) {
    return <section className="panel text-red-600">{error}</section>;
  }

  if (!localizedWorker) {
    return <section className="panel">{copy.notFound}</section>;
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="badge border-[#ead3d9] bg-[#f9ecef] text-[#8d1530]">{copy.profileBadge}</span>
            <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <UserAvatar className="h-20 w-20 rounded-[28px]" name={localizedWorker.fullName} src={localizedWorker.avatarUrl} />
              <div>
                <h1 className="title">{localizedWorker.fullName}</h1>
                <p className="mt-2 text-sm text-slate-600">{localizedWorker.city || copy.defaultCity}</p>
                {resume.headline ? <p className="mt-3 text-base font-semibold text-slate-900">{resume.headline}</p> : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <RatingInline className="badge" rating={localizedWorker.rating || 0} reviews={localizedWorker.totalReviews || 0} />
              <span className="badge">
                {localizedWorker.completedJobs || 0} {copy.completedJobs}
              </span>
              <WorkerStatusBadges
                isPro={localizedWorker.isPro}
                verificationMeta={verificationMeta}
                verificationStatus={resume.verificationStatus}
              />
            </div>

            <p className="subtitle">{localizedWorker.bio || copy.emptyBio}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {isAuthenticated ? (
                <Link className="btn-primary w-full sm:w-auto" to={`/chat?withUserId=${localizedWorker.id}`}>
                  {copy.chat}
                </Link>
              ) : (
                <Link className="btn-primary w-full sm:w-auto" to="/login">
                  {copy.loginToChat}
                </Link>
              )}
              <Link className="btn-secondary w-full sm:w-auto" to={`/jobs?city=${encodeURIComponent(localizedWorker.city || "")}`}>
                {copy.cityJobs}
              </Link>
              <Link className="btn-secondary w-full sm:w-auto" to="/workers">
                {copy.backToCatalog}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#4f0e1f] via-[#72122a] to-[#a21a39] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f6d9df]">{copy.resumeKicker}</p>
            <h2 className="mt-3 font-display text-2xl font-bold">{copy.resumeSpotlight}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">{copy.resumeSpotlightText}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(localizedWorker.skills || []).length > 0 ? (
                localizedWorker.skills.map((skill) => (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium" key={skill}>
                    {translateKnownText(skill, language)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-100/85">{copy.skillsMissing}</span>
              )}
            </div>

            {resume.serviceModes.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f4c7d1]">{copy.serviceModes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {resume.serviceModes.map((mode) => (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium" key={mode}>
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel">
          <h2 className="text-2xl font-bold text-slate-950">{copy.summary}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SummaryCard label={copy.city} value={localizedWorker.city || copy.notSpecified} />
            <SummaryCard label={copy.rating} value={<RatingValue rating={localizedWorker.rating || 0} />} />
            <SummaryCard label={copy.reviews} value={<ReviewCountText reviews={localizedWorker.totalReviews || 0} />} />
            <SummaryCard label={copy.done} value={localizedWorker.completedJobs || 0} />
            <SummaryCard
              label={copy.experience}
              value={resume.experienceYears !== null ? `${resume.experienceYears} ${copy.years}` : copy.notSpecified}
            />
            <SummaryCard
              label={copy.languages}
              value={resume.languages.length ? resume.languages.join(", ") : copy.notSpecifiedPlural}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SummaryCard label={copy.verification} value={verificationMeta.shortLabel} />
            <SummaryCard label={copy.responseTime} value={resume.responseTime || copy.responseInChat} />
          </div>

          {(resume.serviceAreas.length > 0 || resume.availability || resume.pricingNote || resume.responseTime) ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="text-lg font-bold text-slate-950">{copy.workTerms}</h3>
              {resume.serviceAreas.length > 0 ? (
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.workArea}</span> {resume.serviceAreas.join(", ")}
                </p>
              ) : null}
              {resume.availability ? (
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.availability}</span> {resume.availability}
                </p>
              ) : null}
              {resume.pricingNote ? (
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.pricing}</span> {resume.pricingNote}
                </p>
              ) : null}
              {resume.responseTime ? (
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  <span className="font-semibold text-slate-900">{copy.replySpeed}</span> {resume.responseTime}
                </p>
              ) : null}
            </div>
          ) : null}

          {(resume.verificationStatus !== "basic" || resume.verificationItems.length > 0 || resume.verificationNote) ? (
            <div className={`mt-5 rounded-2xl border p-4 ${verificationMeta.panelClass}`}>
              <h3 className="text-lg font-bold text-slate-950">{copy.trust}</h3>
              <p className="mt-2 text-sm text-slate-700">{verificationMeta.label}</p>
              {resume.verificationItems.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {resume.verificationItems.map((item) => (
                    <span className="badge border-white/70 bg-white/80 text-slate-700" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              {resume.verificationNote ? <p className="mt-4 text-sm leading-7 text-slate-700">{resume.verificationNote}</p> : null}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{copy.resumeAndExperience}</h2>
              <p className="mt-1 text-sm text-slate-600">{copy.resumeAndExperienceText}</p>
            </div>
            <span className="badge">{hasResume ? copy.resumeFilled : copy.resumeBasic}</span>
          </div>

          {hasResume ? (
            <div className="mt-5 space-y-5">
              {resume.education ? (
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <h3 className="text-lg font-bold text-slate-900">{copy.education}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{translateKnownText(resume.education, language)}</p>
                </article>
              ) : null}

              {resume.achievements ? (
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <h3 className="text-lg font-bold text-slate-900">{copy.achievements}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{translateKnownText(resume.achievements, language)}</p>
                </article>
              ) : null}

              {resume.portfolioHighlights.length > 0 ? (
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <h3 className="text-lg font-bold text-slate-900">{copy.portfolioCases}</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {resume.portfolioHighlights.map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4" key={item}>
                        <p className="text-sm leading-7 text-slate-700">{translateKnownText(item, language)}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {resume.portfolioLinks.length > 0 ? (
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <h3 className="text-lg font-bold text-slate-900">{copy.portfolio}</h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {resume.portfolioLinks.map((link) => (
                      <a
                        className="text-sm font-medium text-[#8d1530] transition hover:text-[#6d1025]"
                        href={link}
                        key={link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </article>
              ) : null}

              {!resume.education && !resume.achievements && !resume.portfolioHighlights.length && !resume.portfolioLinks.length ? (
                <p className="text-sm text-slate-600">{copy.partialResumeText}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">{copy.emptyResumeText}</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.customerReviews}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.customerReviewsText}</p>
          </div>
          <span className="badge">
            {localizedWorker.reviews?.length || 0} {copy.reviewEntries}
          </span>
        </div>

        {localizedWorker.reviews?.length ? (
          <div className="mt-5 space-y-3">
            {localizedWorker.reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{review.reviewer_name || copy.defaultReviewer}</h3>
                    <p className="text-sm text-slate-600">{formatReviewDate(review.created_at, language)}</p>
                  </div>
                  <span className="badge">
                    <RatingValue rating={review.rating || 0} />
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{review.comment || copy.emptyComment}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">{copy.noReviews}</p>
        )}
      </section>

      {error ? <section className="panel text-sm font-medium text-red-600">{error}</section> : null}
    </div>
  );
}

export default WorkerProfilePage;

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { RatingInline, RatingValue, ReviewCountText } from "../components/RatingDisplay";
import UserAvatar from "../components/UserAvatar";
import WorkerStatusBadges from "../components/WorkerStatusBadges";
import { getLocalizedCityOptions } from "../data/kyrgyzstanCities";
import {
  buildCategoryGroups,
  categoryMatchesSection,
  getAllServiceSectionsLabel,
  getServiceSectionByKey,
  getServiceSectionLabel,
  serviceSections,
} from "../data/serviceSections";
import { useLanguage } from "../context/LanguageContext";
import { localizeWorker, translateCategoryName, translateCityName, translateKnownText } from "../i18n/contentTranslations";
import { getWorkerVerificationMeta, normalizeWorkerResume } from "../utils/workerResume";

const cardThemes = [
  "bg-[#f7e7ea] text-[#8d1530]",
  "bg-[#efe4da] text-[#7a2431]",
  "bg-[#f3ede8] text-[#5c0f22]",
  "bg-[#ece4e8] text-[#7d2a43]",
];

const sectionSurfaces = {
  repair: {
    pillClass: "border-[#ead3d9] bg-[#f9ecef] text-[#8d1530]",
    surfaceClass: "border-[#ead3d9] bg-[linear-gradient(180deg,#fff8fa_0%,#fff3f5_100%)]",
  },
  home: {
    pillClass: "border-[#e8ded6] bg-[#fbf5f0] text-[#7a2431]",
    surfaceClass: "border-[#e8ded6] bg-[linear-gradient(180deg,#fffaf7_0%,#fbf4ee_100%)]",
  },
  beauty: {
    pillClass: "border-[#ead8e8] bg-[#fbf2f9] text-[#7d2a43]",
    surfaceClass: "border-[#ead8e8] bg-[linear-gradient(180deg,#fff9fd_0%,#faf1f8_100%)]",
  },
  education: {
    pillClass: "border-[#dce6ef] bg-[#f0f6fb] text-[#3c5d7d]",
    surfaceClass: "border-[#dce6ef] bg-[linear-gradient(180deg,#f8fcff_0%,#eef6fb_100%)]",
  },
  it: {
    pillClass: "border-[#d7e6ec] bg-[#eff8fb] text-[#245a6e]",
    surfaceClass: "border-[#d7e6ec] bg-[linear-gradient(180deg,#f7fdff_0%,#eef7fb_100%)]",
  },
  legal: {
    pillClass: "border-[#e4e1ed] bg-[#f4f2fa] text-[#544579]",
    surfaceClass: "border-[#e4e1ed] bg-[linear-gradient(180deg,#fbfaff_0%,#f4f2fa_100%)]",
  },
  auto: {
    pillClass: "border-[#e9ddd6] bg-[#fcf4ef] text-[#8a4a2f]",
    surfaceClass: "border-[#e9ddd6] bg-[linear-gradient(180deg,#fffaf7_0%,#fcf1ea_100%)]",
  },
  logistics: {
    pillClass: "border-[#dae5db] bg-[#f0f8f1] text-[#41614a]",
    surfaceClass: "border-[#dae5db] bg-[linear-gradient(180deg,#f9fef9_0%,#eef7ef_100%)]",
  },
  other: {
    pillClass: "border-slate-200 bg-slate-50 text-slate-700",
    surfaceClass: "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
  },
};

const sectionDescriptions = {
  ru: {
    repair: "Мастера по дому, отделке, монтажу и бытовому ремонту.",
    home: "Уборка, помощь по хозяйству, няни и домашний сервис.",
    beauty: "Бьюти-услуги, массаж, уход и персональный сервис.",
    education: "Школьные предметы, языки, музыка, курсы и онлайн-занятия.",
    it: "Сайты, техника, маркетинг, тексты и цифровые задачи.",
    legal: "Юристы, бухгалтерия, документы и бизнес-консультации.",
    auto: "Ремонт авто, диагностика, шиномонтаж и помощь на дороге.",
    logistics: "Доставка, переезды, грузчики и городская логистика.",
    other: "Универсальные специалисты и профили без ярко выраженного направления.",
  },
  ky: {
    repair: "Үй, жасалгалоо, монтаж жана тиричилик оңдоосу боюнча адистер.",
    home: "Тазалоо, чарбага жардам, бала кароо жана үй сервиси.",
    beauty: "Бьюти кызматтар, массаж, кам көрүү жана жеке сервис.",
    education: "Мектеп сабактары, тилдер, музыка, курстар жана онлайн окуу.",
    it: "Сайттар, техника, маркетинг, тексттер жана санарип тапшырмалар.",
    legal: "Юристтер, бухгалтерия, документтер жана бизнес кеңештери.",
    auto: "Унаа оңдоо, диагностика, шиномонтаж жана жолдогу жардам.",
    logistics: "Жеткирүү, көчүү, жүк ташуучулар жана шаардык логистика.",
    other: "Так багыты көрсөтүлбөгөн универсалдуу адистер.",
  },
  en: {
    repair: "Home repair, finishing, installation, and day-to-day maintenance specialists.",
    home: "Cleaning, household help, nannies, and home support services.",
    beauty: "Beauty services, massage, care, and personal service experts.",
    education: "School subjects, languages, music, courses, and online learning.",
    it: "Websites, tech, marketing, content, and digital tasks.",
    legal: "Lawyers, accounting, documents, and business consulting.",
    auto: "Car repair, diagnostics, tire service, and roadside help.",
    logistics: "Delivery, moving, loaders, and city logistics.",
    other: "General specialists and profiles without a clearly defined direction.",
  },
};

const pageCopy = {
  ru: {
    cityFallback: "Город не указан",
    completedJobs: "выполненных заказов",
    experienceYears: "лет опыта",
    bioFallback: "Специалист готов обсудить задачу, сроки и стоимость работы в чате платформы.",
    directions: "Направления",
    worksIn: "Работает",
    format: "Формат",
    response: "Ответ",
    rating: "Рейтинг",
    reviews: "Отзывы",
    deals: "Сделки",
    openProfile: "Открыть профиль",
    writeToChat: "Написать в чат",
    cityJobs: "Заказы в городе",
    filters: "Фильтры",
    filtersTitle: "Подобрать специалиста",
    filtersText:
      "Соберите выдачу по городу, направлению, категории и рейтингу, чтобы быстрее выйти на нужного исполнителя.",
    search: "Поиск",
    searchPlaceholder: "Имя, навык, услуга или описание",
    city: "Город",
    section: "Раздел услуг",
    category: "Категория",
    allCategories: "Все категории",
    minRating: "Минимальный рейтинг",
    anyRating: "Любой рейтинг",
    sort: "Сортировка",
    reset: "Сбросить фильтры",
    quickTitle: "Хотите получить предложения быстрее?",
    quickText:
      "Опубликуйте задачу, и подходящие специалисты сами пришлют отклики с ценой, сроками и условиями.",
    publishJob: "Опубликовать задачу",
    openJobs: "Перейти к заказам",
    catalogKicker: "Каталог исполнителей",
    catalogTitle: "Специалисты по направлениям и специализациям",
    catalogText:
      "Профили собраны по направлениям, чтобы было удобно сравнивать опыт, рейтинг, отзывы, скорость ответа и рабочую зону без смешения разных профессий.",
    activeSearch: "Поиск",
    activeSection: "Раздел",
    activeCity: "Город",
    activeRating: "Рейтинг от",
    activeCategory: "Категория",
    found: "Найдено",
    foundText: "специалистов по текущим фильтрам",
    directionsCount: "Направлений",
    directionsCountText: "разделов в текущей выдаче",
    proProfiles: "PRO-анкеты",
    proProfilesText: "выделенных профилей в выдаче",
    averageRating: "Средний рейтинг",
    averageRatingText: "а также профилей с рейтингом 4.8 и выше",
    loading: "Загружаем каталог специалистов...",
    empty: "По текущим параметрам специалисты не найдены.",
    specialistsCount: "специалистов",
    insideBlock: "Внутри блока",
    anySection: "Все разделы",
  },
  ky: {
    cityFallback: "Шаар көрсөтүлгөн эмес",
    completedJobs: "аткарылган заказ",
    experienceYears: "жылдык тажрыйба",
    bioFallback: "Адис тапшырманы, мөөнөттү жана бааны платформадагы чатта талкуулоого даяр.",
    directions: "Багыттар",
    worksIn: "Иштейт",
    format: "Формат",
    response: "Жооп",
    rating: "Рейтинг",
    reviews: "Пикирлер",
    deals: "Бүтүмдөр",
    openProfile: "Профилди ачуу",
    writeToChat: "Чатка жазуу",
    cityJobs: "Шаардагы заказдар",
    filters: "Чыпкалар",
    filtersTitle: "Адисти тандоо",
    filtersText:
      "Керектүү аткаруучуга тезирээк чыгуу үчүн шаар, багыт, категория жана рейтинг боюнча тандаңыз.",
    search: "Издөө",
    searchPlaceholder: "Аты, көндүмү, кызматы же сүрөттөмөсү",
    city: "Шаар",
    section: "Кызмат бөлүмү",
    category: "Категория",
    allCategories: "Бардык категориялар",
    minRating: "Минималдуу рейтинг",
    anyRating: "Каалаган рейтинг",
    sort: "Иреттөө",
    reset: "Чыпкаларды тазалоо",
    quickTitle: "Сунуштарды ылдамыраак алгыңыз келеби?",
    quickText:
      "Тапшырма жарыялаңыз, ылайыктуу адистер баасы, мөөнөтү жана шарттары менен өздөрү жооп жөнөтүшөт.",
    publishJob: "Тапшырма жарыялоо",
    openJobs: "Заказдарга өтүү",
    catalogKicker: "Аткаруучулардын каталогу",
    catalogTitle: "Багыттар жана адистиктер боюнча аткаруучулар",
    catalogText:
      "Профилдер багыттар боюнча топтолгондуктан тажрыйбаны, рейтингди, пикирлерди, жооп ылдамдыгын жана иш аймагын ыңгайлуу салыштырууга болот.",
    activeSearch: "Издөө",
    activeSection: "Бөлүм",
    activeCity: "Шаар",
    activeRating: "Рейтинг",
    activeCategory: "Категория",
    found: "Табылды",
    foundText: "адис учурдагы чыпкаларга туура келет",
    directionsCount: "Багыттар",
    directionsCountText: "учурдагы тизмедеги бөлүм",
    proProfiles: "PRO-анкеталар",
    proProfilesText: "өзгөчөлөнгөн профилдер",
    averageRating: "Орточо рейтинг",
    averageRatingText: "4.8 жана андан жогору рейтинги бар профилдер",
    loading: "Адистер каталогу жүктөлүүдө...",
    empty: "Бул параметрлер боюнча адистер табылган жок.",
    specialistsCount: "адис",
    insideBlock: "Бул блокто",
    anySection: "Бардык бөлүмдөр",
  },
  en: {
    cityFallback: "City not specified",
    completedJobs: "completed jobs",
    experienceYears: "years of experience",
    bioFallback: "The specialist is ready to discuss the task, timing, and price in the platform chat.",
    directions: "Directions",
    worksIn: "Works in",
    format: "Format",
    response: "Response",
    rating: "Rating",
    reviews: "Reviews",
    deals: "Jobs completed",
    openProfile: "Open profile",
    writeToChat: "Message in chat",
    cityJobs: "Jobs in this city",
    filters: "Filters",
    filtersTitle: "Find a specialist",
    filtersText:
      "Build the results by city, direction, category, and rating to reach the right specialist faster.",
    search: "Search",
    searchPlaceholder: "Name, skill, service, or description",
    city: "City",
    section: "Service section",
    category: "Category",
    allCategories: "All categories",
    minRating: "Minimum rating",
    anyRating: "Any rating",
    sort: "Sorting",
    reset: "Reset filters",
    quickTitle: "Want to get offers faster?",
    quickText:
      "Post a request, and matching specialists will send responses with price, timing, and conditions.",
    publishJob: "Post a request",
    openJobs: "Go to jobs",
    catalogKicker: "Specialists catalog",
    catalogTitle: "Specialists by directions and specializations",
    catalogText:
      "Profiles are grouped by direction so it is easier to compare experience, rating, reviews, response speed, and work area without mixing very different professions.",
    activeSearch: "Search",
    activeSection: "Section",
    activeCity: "City",
    activeRating: "Rating from",
    activeCategory: "Category",
    found: "Found",
    foundText: "specialists matching current filters",
    directionsCount: "Directions",
    directionsCountText: "sections in the current results",
    proProfiles: "PRO profiles",
    proProfilesText: "highlighted profiles in results",
    averageRating: "Average rating",
    averageRatingText: "profiles with rating 4.8 and higher",
    loading: "Loading specialists catalog...",
    empty: "No specialists found for the current filters.",
    specialistsCount: "specialists",
    insideBlock: "Inside this block",
    anySection: "All sections",
  },
};

const sortOptionsByLanguage = {
  ru: [
    { value: "recommended", label: "Рекомендуемые" },
    { value: "rating", label: "По рейтингу" },
    { value: "reviews", label: "По отзывам" },
    { value: "jobs", label: "По заказам" },
    { value: "name", label: "По имени" },
  ],
  ky: [
    { value: "recommended", label: "Сунушталган" },
    { value: "rating", label: "Рейтинг боюнча" },
    { value: "reviews", label: "Пикирлер боюнча" },
    { value: "jobs", label: "Заказдар боюнча" },
    { value: "name", label: "Аты боюнча" },
  ],
  en: [
    { value: "recommended", label: "Recommended" },
    { value: "rating", label: "By rating" },
    { value: "reviews", label: "By reviews" },
    { value: "jobs", label: "By jobs" },
    { value: "name", label: "By name" },
  ],
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatActiveFilter(prefix, value) {
  return `${prefix}: ${value}`;
}

function resolveWorkerSections(worker) {
  const resume = normalizeWorkerResume(worker.workerResume);
  const rawDirections = Array.isArray(worker.directions) ? worker.directions.filter(Boolean) : [];
  const searchPool = [
    ...rawDirections,
    ...(worker.skills || []),
    worker.fullName,
    worker.bio,
    resume.headline,
    ...resume.serviceAreas,
    ...resume.serviceModes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matched = serviceSections.filter((section) =>
    section.matchers.some((matcher) => searchPool.includes(normalize(matcher))),
  );

  return {
    resume,
    rawDirections,
    sections: matched.length ? matched.slice(0, 3) : [],
  };
}

function buildWorkerViewModel(worker, language) {
  const localizedWorker = localizeWorker(worker, language);
  const { resume, rawDirections, sections } = resolveWorkerSections(localizedWorker);
  const localizedSections = (sections.length ? sections : [{ key: "other" }]).map((section) => ({
    key: section.key,
    label: section.key === "other" ? pageCopy[language].anySection : getServiceSectionLabel(section, language),
    description:
      sectionDescriptions[language]?.[section.key] ||
      sectionDescriptions.ru[section.key] ||
      sectionDescriptions[language].other,
    ...(sectionSurfaces[section.key] || sectionSurfaces.other),
  }));

  return {
    ...localizedWorker,
    rawCity: worker.city || "",
    resume,
    rawDirections,
    verificationMeta: getWorkerVerificationMeta(resume.verificationStatus, localizedWorker.isPro, language),
    directionGroups: localizedSections,
    primaryDirection: localizedSections[0],
  };
}

function groupWorkersByDirection(workers) {
  const groups = new Map();

  workers.forEach((worker) => {
    const group = worker.primaryDirection || {
      key: "other",
      label: "",
      description: "",
      ...sectionSurfaces.other,
    };

    if (!groups.has(group.key)) {
      groups.set(group.key, {
        ...group,
        workers: [],
      });
    }

    groups.get(group.key).workers.push(worker);
  });

  return [...groups.values()]
    .sort((left, right) => left.label.localeCompare(right.label, "ru"))
    .map((group) => ({
      ...group,
      count: group.workers.length,
    }));
}

function WorkerCard({ worker, index, copy, language }) {
  const theme = cardThemes[index % cardThemes.length];
  const details = [
    worker.rawDirections.length > 0
      ? { label: copy.directions, value: worker.rawDirections.join(", ") }
      : null,
    worker.resume.serviceAreas.length > 0
      ? { label: copy.worksIn, value: worker.resume.serviceAreas.map((item) => translateCityName(item, language)).join(", ") }
      : null,
    worker.resume.serviceModes.length > 0
      ? { label: copy.format, value: worker.resume.serviceModes.map((item) => translateKnownText(item, language)).join(", ") }
      : null,
    worker.resume.responseTime
      ? { label: copy.response, value: translateKnownText(worker.resume.responseTime, language) }
      : null,
  ].filter(Boolean);

  return (
    <article className="worker-card">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <WorkerStatusBadges
            className="justify-end"
            isPro={worker.isPro}
            verificationMeta={worker.verificationMeta}
            verificationStatus={worker.resume.verificationStatus}
          />
        </div>
        <div className="flex min-w-0 items-start gap-4">
          <UserAvatar className={`h-16 w-16 shrink-0 rounded-[22px] ${theme}`} name={worker.fullName} src={worker.avatarUrl} />
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-xl font-extrabold leading-tight tracking-[-0.03em] text-slate-950">{worker.fullName}</h3>
            <p className="mt-1 text-sm text-slate-500">{translateCityName(worker.city, language) || copy.cityFallback}</p>
            {worker.resume.headline && <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{worker.resume.headline}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {worker.directionGroups.map((direction) => (
          <span key={`${worker.id}-${direction.key}`} className={`badge ${direction.pillClass}`}>
            {direction.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <RatingInline className="badge border-slate-200 bg-slate-50" rating={worker.rating || 0} reviews={worker.totalReviews} />
        <span className="badge border-slate-200 bg-slate-50">
          {worker.completedJobs} {copy.completedJobs}
        </span>
        {worker.resume.experienceYears !== null && (
          <span className="badge border-slate-200 bg-slate-50">
            {worker.resume.experienceYears} {copy.experienceYears}
          </span>
        )}
      </div>

      <p className="text-sm leading-7 text-slate-700">{translateKnownText(worker.bio, language) || copy.bioFallback}</p>

      {details.length > 0 && (
        <div className="worker-card__details">
          {details.map((detail) => (
            <div className="worker-card__detail-row" key={`${worker.id}-${detail.label}`}>
              <span className="worker-card__detail-label">{detail.label}:</span>
              <span className="worker-card__detail-value">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {(worker.skills || []).slice(0, 6).map((skill) => (
          <span key={`${worker.id}-${skill}`} className="badge bg-white">
            {translateKnownText(skill, language)}
          </span>
        ))}
      </div>

      <div className="worker-card__stats">
        <div className="worker-card__stat">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.rating}</p>
          <p className="mt-1 font-semibold text-slate-900">
            <RatingValue rating={worker.rating || 0} />
          </p>
        </div>
        <div className="worker-card__stat">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.reviews}</p>
          <p className="mt-1 font-semibold text-slate-900">
            <ReviewCountText reviews={worker.totalReviews} />
          </p>
        </div>
        <div className="worker-card__stat">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.deals}</p>
          <p className="mt-1 font-semibold text-slate-900">{worker.completedJobs}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Link className="btn-secondary w-full sm:w-auto" to={`/workers/${worker.id}`}>
          {copy.openProfile}
        </Link>
        <Link className="btn-secondary w-full sm:w-auto" to={`/chat?withUserId=${worker.id}`}>
          {copy.writeToChat}
        </Link>
        <Link className="btn-primary w-full sm:w-auto" to={`/jobs?city=${encodeURIComponent(worker.rawCity || "")}`}>
          {copy.cityJobs}
        </Link>
      </div>
    </article>
  );
}

function WorkersPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const sortOptions = sortOptionsByLanguage[language] || sortOptionsByLanguage.ru;
  const [searchParams, setSearchParams] = useSearchParams();
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filters = {
    q: searchParams.get("q") || "",
    section: searchParams.get("section") || "",
    city: searchParams.get("city") || "",
    minRating: searchParams.get("minRating") || "",
    categoryId: searchParams.get("categoryId") || "",
    sort: searchParams.get("sort") || "recommended",
  };

  const activeFilters = [
    filters.q ? { key: "q", label: formatActiveFilter(copy.activeSearch, filters.q) } : null,
    filters.section
      ? {
          key: "section",
          label: formatActiveFilter(
            copy.activeSection,
            getServiceSectionLabel(getServiceSectionByKey(filters.section), language) || filters.section,
          ),
        }
      : null,
    filters.city ? { key: "city", label: formatActiveFilter(copy.activeCity, translateCityName(filters.city, language)) } : null,
    filters.minRating ? { key: "minRating", label: formatActiveFilter(copy.activeRating, filters.minRating) } : null,
    filters.categoryId
      ? {
          key: "categoryId",
          label: formatActiveFilter(
            copy.activeCategory,
            translateCategoryName(
              categories.find((category) => String(category.id) === String(filters.categoryId))?.name || filters.categoryId,
              language,
            ),
          ),
        }
      : null,
  ].filter(Boolean);

  const setFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);

    if (!value || (name === "sort" && value === "recommended")) {
      next.delete(name);
    } else {
      next.set(name, value);
    }

    setSearchParams(next, { replace: true });
  };

  const loadWorkers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => key !== "section" && Boolean(value)),
      );
      const { data } = await api.get("/workers", { params });
      setWorkers(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.loading);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [filters.q, filters.city, filters.minRating, filters.categoryId, filters.sort]);

  const visibleCategoryGroups = useMemo(() => {
    const filteredCategories = categories.filter((category) => categoryMatchesSection(category, filters.section));

    return buildCategoryGroups(filteredCategories, language).map((group) => ({
      ...group,
      label: getServiceSectionLabel(group.key, language) || group.label,
    }));
  }, [categories, filters.section, language]);

  const handleSectionChange = (value) => {
    const next = new URLSearchParams(searchParams);
    const selectedCategory = categories.find((category) => String(category.id) === String(filters.categoryId));

    if (!value) {
      next.delete("section");
    } else {
      next.set("section", value);
    }

    if (!categoryMatchesSection(selectedCategory, value)) {
      next.delete("categoryId");
    }

    setSearchParams(next, { replace: true });
  };

  const workerCards = useMemo(
    () =>
      workers
        .map((worker) => buildWorkerViewModel(worker, language))
        .sort((left, right) => {
          if (filters.sort === "rating") {
            return Number(right.rating || 0) - Number(left.rating || 0);
          }

          if (filters.sort === "reviews") {
            return Number(right.totalReviews || 0) - Number(left.totalReviews || 0);
          }

          if (filters.sort === "jobs") {
            return Number(right.completedJobs || 0) - Number(left.completedJobs || 0);
          }

          if (filters.sort === "name") {
            return String(left.fullName || "").localeCompare(
              String(right.fullName || ""),
              language === "ky" ? "ky" : language === "en" ? "en" : "ru",
            );
          }

          return Number(right.isPro) - Number(left.isPro) || Number(right.rating || 0) - Number(left.rating || 0);
        }),
    [filters.sort, language, workers],
  );

  const visibleWorkerCards = useMemo(
    () =>
      workerCards.filter((worker) => {
        if (!filters.section) {
          return true;
        }

        return (
          worker.directionGroups.some((group) => group.key === filters.section) ||
          worker.rawDirections.some((direction) => categoryMatchesSection({ name: direction }, filters.section))
        );
      }),
    [filters.section, workerCards],
  );

  const groupedWorkers = useMemo(() => groupWorkersByDirection(visibleWorkerCards), [visibleWorkerCards]);
  const proCount = visibleWorkerCards.filter((worker) => worker.isPro).length;
  const highRatedCount = visibleWorkerCards.filter((worker) => Number(worker.rating || 0) >= 4.8).length;
  const averageRating = visibleWorkerCards.length
    ? (
        visibleWorkerCards.reduce((total, worker) => total + Number(worker.rating || 0), 0) / visibleWorkerCards.length
      ).toFixed(1)
    : "0.0";

  const allSectionsLabel = getAllServiceSectionsLabel(language);
  const allCitiesLabel = language === "ky" ? "Бардык шаарлар" : language === "en" ? "All cities" : "Все города";

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:self-start">
        <section className="panel">
          <p className="section-kicker">{copy.filters}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.filtersTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{copy.filtersText}</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label">{copy.search}</label>
              <input
                className="input"
                placeholder={copy.searchPlaceholder}
                value={filters.q}
                onChange={(event) => setFilter("q", event.target.value)}
              />
            </div>

            <div>
              <label className="label">{copy.city}</label>
              <select className="input" value={filters.city} onChange={(event) => setFilter("city", event.target.value)}>
                <option value="">{allCitiesLabel}</option>
                {getLocalizedCityOptions(filters.city, language).map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{copy.section}</label>
              <select className="input" value={filters.section} onChange={(event) => handleSectionChange(event.target.value)}>
                <option value="">{allSectionsLabel}</option>
                {serviceSections.map((section) => (
                  <option key={section.key} value={section.key}>
                    {getServiceSectionLabel(section, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{copy.category}</label>
              <select className="input" value={filters.categoryId} onChange={(event) => setFilter("categoryId", event.target.value)}>
                <option value="">{copy.allCategories}</option>
                {visibleCategoryGroups.map((group) => (
                  <optgroup key={group.key} label={group.label}>
                    {group.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.displayName || translateCategoryName(category.name, language)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{copy.minRating}</label>
              <select className="input" value={filters.minRating} onChange={(event) => setFilter("minRating", event.target.value)}>
                <option value="">{copy.anyRating}</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
              </select>
            </div>

            <div>
              <label className="label">{copy.sort}</label>
              <select className="input" value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-secondary w-full" type="button" onClick={() => setSearchParams({}, { replace: true })}>
              {copy.reset}
            </button>
          </div>
        </section>

        <section className="panel">
          <p className="text-sm font-semibold text-slate-950">{copy.quickTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.quickText}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link className="btn-primary w-full sm:w-auto" to="/jobs/new">
              {copy.publishJob}
            </Link>
            <Link className="btn-secondary w-full sm:w-auto" to="/jobs">
              {copy.openJobs}
            </Link>
          </div>
        </section>
      </aside>

      <div className="space-y-4">
        <section className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">{copy.catalogKicker}</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.catalogTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{copy.catalogText}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link className="btn-secondary w-full sm:w-auto" to="/jobs">
                {copy.openJobs}
              </Link>
              <Link className="btn-primary w-full sm:w-auto" to="/jobs/new">
                {copy.publishJob}
              </Link>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {activeFilters.map((item) => (
                <button key={item.key} type="button" className="badge border-slate-200 bg-slate-50" onClick={() => setFilter(item.key, "")}>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.found}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">{visibleWorkerCards.length}</p>
              <p className="mt-1 text-sm text-slate-500">{copy.foundText}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.directionsCount}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">{groupedWorkers.length}</p>
              <p className="mt-1 text-sm text-slate-500">{copy.directionsCountText}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.proProfiles}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">{proCount}</p>
              <p className="mt-1 text-sm text-slate-500">{copy.proProfilesText}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.averageRating}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">{averageRating}</p>
              <p className="mt-1 text-sm text-slate-500">
                {highRatedCount} {copy.averageRatingText}
              </p>
            </div>
          </div>

          {groupedWorkers.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {groupedWorkers.map((group) => (
                <a key={group.key} className={`badge no-underline ${group.pillClass}`} href={`#direction-${group.key}`}>
                  {group.label} · {group.count}
                </a>
              ))}
            </div>
          )}
        </section>

        {loading && <p className="panel">{copy.loading}</p>}
        {error && <p className="panel text-red-600">{error}</p>}
        {!loading && !error && visibleWorkerCards.length === 0 && <p className="panel">{copy.empty}</p>}

        {!loading &&
          !error &&
          groupedWorkers.map((group) => (
            <section key={group.key} className="space-y-4" id={`direction-${group.key}`}>
              <div className={`panel ${group.surfaceClass}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${group.pillClass}`}>{group.label}</span>
                      <span className="text-sm font-medium text-slate-500">
                        {group.count} {copy.specialistsCount}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{group.description}</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.insideBlock}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {sortOptions.find((option) => option.value === filters.sort)?.label || sortOptions[0].label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.workers.map((worker, index) => (
                  <WorkerCard key={worker.id} copy={copy} index={index} language={language} worker={worker} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

export default WorkersPage;

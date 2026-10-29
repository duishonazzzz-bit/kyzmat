import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { allCitiesLabel, getLocalizedCityOptions } from "../data/kyrgyzstanCities";
import {
  buildCategoryGroups,
  categoryMatchesSection,
  getServiceSectionByKey,
  serviceSections,
} from "../data/serviceSections";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, localizeJob, translateCategoryName, translateCityName } from "../i18n/contentTranslations";

const pageCopy = {
  ru: {
    allSections: "Все разделы",
    allCategories: "Все категории",
    search: "Поиск",
    workType: "Тип",
    allWorkTypes: "Все типы",
    orderWorks: "Заказные работы",
    vacancies: "Вакансии",
    section: "Раздел услуг",
    category: "Категория",
    city: "Город",
    minBudget: "Бюджет от",
    maxBudget: "Бюджет до",
    salaryFrom: "Оплата от",
    salaryTo: "Оплата до",
    status: "Статус",
    allStatuses: "Все статусы",
    sort: "Сортировка",
    sortRecent: "Сначала новые",
    sortBudget: "По бюджету",
    sortResponses: "Сначала срочные",
    qPlaceholder: "Например: монтаж, уборка или доставка",
    vacancyQPlaceholder: "Например: сантехник, мастер, курьер или дизайнер",
    filtersTitle: "Подбор заказа",
    vacancyFiltersTitle: "Подбор вакансии",
    filtersKicker: "Фильтры",
    filtersText: "Настройте поиск по направлению, городу, бюджету и статусу, чтобы собрать подходящую ленту задач.",
    vacancyFiltersText: "Настройте поиск по направлению, городу, оплате и статусу, чтобы найти подходящие вакансии.",
    reset: "Сбросить фильтры",
    activeSearch: "Поиск",
    activeWorkType: "Тип",
    activeSection: "Раздел",
    activeCategory: "Категория",
    activeCity: "Город",
    from: "От",
    to: "До",
    statusLabel: "Статус",
    statusOpen: "Открыт",
    statusInProgress: "В работе",
    statusCompleted: "Завершён",
    statusCancelled: "Отменён",
    loading: "Загружаем заказы...",
    loadingVacancies: "Загружаем вакансии...",
    loadError: "Не удалось загрузить заказы",
    vacancyLoadError: "Не удалось загрузить вакансии",
    responseSent: "Отклик отправлен заказчику.",
    responseError: "Не удалось отправить отклик.",
    sectionSummary: "Актуальные заявки клиентов по Кыргызстану",
    title: "Заказы для исполнителей",
    subtitle: "Открывайте подходящие задачи, сравнивайте бюджет и условия, отправляйте отклик и переходите к общению с заказчиком.",
    vacancySectionSummary: "Вакансии и долгосрочные предложения по Кыргызстану",
    vacancyTitle: "Вакансии для исполнителей",
    vacancySubtitle: "Здесь будут собраны постоянные предложения, смены и долгосрочные работы для специалистов.",
    openCount: "Открытые",
    avgBudget: "Средний бюджет",
    avgSalary: "Средняя оплата",
    totalFound: "Найдено",
    jobsLabel: "заказов по текущим фильтрам",
    vacanciesLabel: "вакансий по текущим фильтрам",
    publishJob: "Разместить задачу",
    publishVacancy: "Разместить вакансию",
    noJobs: "По текущим фильтрам заказы пока не найдены.",
    noVacancies: "По текущим фильтрам вакансии пока не найдены.",
    customerJobs: "Мои заказы",
    customerVacancies: "Мои вакансии",
  },
  ky: {
    allSections: "Бардык бөлүмдөр",
    allCategories: "Бардык категориялар",
    search: "Издөө",
    workType: "Түрү",
    allWorkTypes: "Бардык түрлөр",
    orderWorks: "Заказдык иштер",
    vacancies: "Вакансиялар",
    section: "Кызмат бөлүмү",
    category: "Категория",
    city: "Шаар",
    minBudget: "Бюджет баштап",
    maxBudget: "Бюджет чейин",
    salaryFrom: "Төлөм баштап",
    salaryTo: "Төлөм чейин",
    status: "Статус",
    allStatuses: "Бардык статустар",
    sort: "Иреттөө",
    sortRecent: "Адегенде жаңысы",
    sortBudget: "Бюджет боюнча",
    sortResponses: "Адегенде шашылыш",
    qPlaceholder: "Мисалы: монтаж, тазалоо же жеткирүү",
    vacancyQPlaceholder: "Мисалы: сантехник, уста, курьер же дизайнер",
    filtersTitle: "Тапшырма тандоо",
    vacancyFiltersTitle: "Вакансия тандоо",
    filtersKicker: "Чыпкалар",
    filtersText: "Туура тапшырмаларды табуу үчүн багыт, шаар, бюджет жана статус боюнча издөөнү тууралаңыз.",
    vacancyFiltersText: "Ылайыктуу вакансияларды табуу үчүн багыт, шаар, төлөм жана статус боюнча издөөнү тууралаңыз.",
    reset: "Чыпкаларды тазалоо",
    activeSearch: "Издөө",
    activeWorkType: "Түрү",
    activeSection: "Бөлүм",
    activeCategory: "Категория",
    activeCity: "Шаар",
    from: "Баштап",
    to: "Чейин",
    statusLabel: "Статус",
    statusOpen: "Ачык",
    statusInProgress: "Иште",
    statusCompleted: "Аяктаган",
    statusCancelled: "Жокко чыгарылган",
    loading: "Тапшырмалар жүктөлүүдө...",
    loadingVacancies: "Вакансиялар жүктөлүүдө...",
    loadError: "Тапшырмаларды жүктөө мүмкүн болгон жок",
    vacancyLoadError: "Вакансияларды жүктөө мүмкүн болгон жок",
    responseSent: "Жооп кардарга жөнөтүлдү.",
    responseError: "Жооп жөнөтүү мүмкүн болгон жок.",
    sectionSummary: "Кыргызстан боюнча кардарлардын актуалдуу тапшырмалары",
    title: "Аткаруучулар үчүн тапшырмалар",
    subtitle: "Ылайыктуу тапшырмаларды ачыңыз, бюджет менен шарттарды салыштырыңыз, жооп жиберип кардар менен сүйлөшүүнү баштаңыз.",
    vacancySectionSummary: "Кыргызстан боюнча вакансиялар жана узак мөөнөттүү сунуштар",
    vacancyTitle: "Аткаруучулар үчүн вакансиялар",
    vacancySubtitle: "Бул жерде адистер үчүн туруктуу сунуштар, сменалар жана узак мөөнөттүү иштер чогулат.",
    openCount: "Ачык",
    avgBudget: "Орточо бюджет",
    avgSalary: "Орточо төлөм",
    totalFound: "Табылды",
    jobsLabel: "учурдагы чыпкалар боюнча тапшырма",
    vacanciesLabel: "учурдагы чыпкалар боюнча вакансия",
    publishJob: "Тапшырма жайгаштыруу",
    publishVacancy: "Вакансия жайгаштыруу",
    noJobs: "Бул чыпкалар боюнча азырынча тапшырмалар табылган жок.",
    noVacancies: "Бул чыпкалар боюнча азырынча вакансиялар табылган жок.",
    customerJobs: "Менин тапшырмаларым",
    customerVacancies: "Менин вакансияларым",
  },
  en: {
    allSections: "All sections",
    allCategories: "All categories",
    search: "Search",
    workType: "Type",
    allWorkTypes: "All types",
    orderWorks: "Custom jobs",
    vacancies: "Vacancies",
    section: "Service section",
    category: "Category",
    city: "City",
    minBudget: "Budget from",
    maxBudget: "Budget to",
    salaryFrom: "Pay from",
    salaryTo: "Pay to",
    status: "Status",
    allStatuses: "All statuses",
    sort: "Sorting",
    sortRecent: "Newest first",
    sortBudget: "By budget",
    sortResponses: "Urgent first",
    qPlaceholder: "For example: installation, cleaning, or delivery",
    vacancyQPlaceholder: "For example: plumber, handyman, courier, or designer",
    filtersTitle: "Find a job",
    vacancyFiltersTitle: "Find a vacancy",
    filtersKicker: "Filters",
    filtersText:
      "Adjust the feed by section, city, budget, and status to find the right requests faster.",
    vacancyFiltersText:
      "Adjust the feed by section, city, pay, and status to find suitable vacancies faster.",
    reset: "Reset filters",
    activeSearch: "Search",
    activeWorkType: "Type",
    activeSection: "Section",
    activeCategory: "Category",
    activeCity: "City",
    from: "From",
    to: "To",
    statusLabel: "Status",
    statusOpen: "Open",
    statusInProgress: "In progress",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    loading: "Loading jobs...",
    loadingVacancies: "Loading vacancies...",
    loadError: "Unable to load jobs",
    vacancyLoadError: "Unable to load vacancies",
    responseSent: "Your response has been sent to the customer.",
    responseError: "Unable to send response.",
    sectionSummary: "Live customer requests across Kyrgyzstan",
    title: "Jobs for specialists",
    subtitle:
      "Open suitable requests, compare budgets and conditions, send responses, and move into direct communication with the customer.",
    vacancySectionSummary: "Vacancies and long-term opportunities across Kyrgyzstan",
    vacancyTitle: "Vacancies for specialists",
    vacancySubtitle: "Permanent offers, shifts, and long-term work for specialists will be collected here.",
    openCount: "Open",
    avgBudget: "Average budget",
    avgSalary: "Average pay",
    totalFound: "Found",
    jobsLabel: "jobs matching current filters",
    vacanciesLabel: "vacancies matching current filters",
    publishJob: "Post a request",
    publishVacancy: "Post a vacancy",
    noJobs: "No jobs found for the current filters.",
    noVacancies: "No vacancies found for the current filters.",
    customerJobs: "My jobs",
    customerVacancies: "My vacancies",
  },
};

const sectionLabels = {
  repair: { ru: "Ремонт и строительство", ky: "Оңдоо жана курулуш", en: "Repair and construction" },
  home: { ru: "Услуги по дому", ky: "Үй кызматтары", en: "Home services" },
  beauty: { ru: "Красота и здоровье", ky: "Сулуулук жана ден соолук", en: "Beauty and wellness" },
  education: { ru: "Репетиторы и обучение", ky: "Репетиторлор жана окутуу", en: "Tutors and education" },
  it: { ru: "IT и онлайн-услуги", ky: "IT жана онлайн кызматтар", en: "IT and online services" },
  legal: { ru: "Юридические и финансовые", ky: "Юридикалык жана финансылык", en: "Legal and financial" },
  auto: { ru: "Автоуслуги", ky: "Авто кызматтар", en: "Auto services" },
  logistics: { ru: "Перевозки и курьеры", ky: "Жеткирүү жана ташуу", en: "Logistics and couriers" },
  pets: { ru: "Услуги для животных", ky: "Жаныбарлар үчүн кызматтар", en: "Pet services" },
  sport: { ru: "Спорт и тренеры", ky: "Спорт жана машыктыруучулар", en: "Sports and trainers" },
  psychology: { ru: "Психология и коучинг", ky: "Психология жана коучинг", en: "Psychology and coaching" },
  events: { ru: "Праздники и мероприятия", ky: "Майрамдар жана иш-чаралар", en: "Events and entertainment" },
  creative: { ru: "Творчество и хобби", ky: "Чыгармачылык жана хобби", en: "Creative and hobbies" },
  clothing: { ru: "Пошив и ремонт одежды", ky: "Кийим тигүү жана оңдоо", en: "Tailoring and clothing repair" },
  business: { ru: "Бизнес и услуги для компаний", ky: "Бизнес жана компанияларга кызматтар", en: "Business services" },
  security: { ru: "Безопасность и системы", ky: "Коопсуздук жана системалар", en: "Security and systems" },
  niche: { ru: "Узкоспециализированные услуги", ky: "Тар адистешкен кызматтар", en: "Specialized services" },
  other: { ru: "Другие услуги", ky: "Башка кызматтар", en: "Other services" },
};

function getLocalizedSectionLabel(sectionKey, language, fallback = "") {
  return sectionLabels[sectionKey]?.[language] || fallback;
}

function normalizeSort(value) {
  if (value === "budget") {
    return "budget_desc";
  }

  if (value === "responses") {
    return "urgent_first";
  }

  if (["recent", "budget_asc", "budget_desc", "urgent_first"].includes(value)) {
    return value;
  }

  return "recent";
}

function JobsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") || "",
      workType: searchParams.get("workType") || "",
      section: searchParams.get("section") || "",
      categoryId: searchParams.get("categoryId") || "",
      city: searchParams.get("city") || "",
      minBudget: searchParams.get("minBudget") || "",
      maxBudget: searchParams.get("maxBudget") || "",
      status: searchParams.get("status") || "",
      customerId: searchParams.get("customerId") || "",
      workerId: searchParams.get("workerId") || "",
      sort: normalizeSort(searchParams.get("sort") || "recent"),
    }),
    [searchParams],
  );

  const isVacancyMode = filters.workType === "vacancy";

  const visibleJobs = useMemo(
    () =>
      jobs
      .map((job) => localizeJob(job, language))
      .filter((job) => {
        if (!filters.section) {
          return true;
        }

        return categoryMatchesSection({ name: job.category_name }, filters.section);
      }),
    [jobs, filters.section, filters.workType, language],
  );

  const insights = useMemo(() => {
    const openCount = visibleJobs.filter((job) => job.status === "open").length;
    const averageBudget = visibleJobs.length
      ? Math.round(visibleJobs.reduce((total, job) => total + Number(job.budget || 0), 0) / visibleJobs.length)
      : 0;

    return {
      openCount,
      averageBudget,
    };
  }, [visibleJobs]);

  const updateFilter = (name, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === "" || value === null || value === undefined) {
      nextParams.delete(name);
    } else {
      nextParams.set(name, value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([key, value]) => !["section", "workType"].includes(key) && value !== "" && value !== null && value !== undefined,
        ),
      );
      if (filters.workType) {
        params.jobType = filters.workType;
      }
      const { data } = await api.get("/jobs", { params });
      setJobs(data);
    } catch (err) {
      setError(err.response?.data?.message || (isVacancyMode ? copy.vacancyLoadError : copy.loadError));
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
    loadJobs();
  }, [
    filters.q,
    filters.workType,
    filters.categoryId,
    filters.city,
    filters.minBudget,
    filters.maxBudget,
    filters.status,
    filters.customerId,
    filters.workerId,
    filters.sort,
    filters.section,
    isVacancyMode,
  ]);

  const activeFilters = [
    filters.q ? { key: "q", label: `${copy.activeSearch}: ${filters.q}` } : null,
    filters.workType
      ? {
          key: "workType",
          label: `${copy.activeWorkType}: ${filters.workType === "vacancy" ? copy.vacancies : copy.orderWorks}`,
        }
      : null,
    filters.section
      ? {
          key: "section",
          label: `${copy.activeSection}: ${getLocalizedSectionLabel(filters.section, language, getServiceSectionByKey(filters.section)?.label || filters.section)}`,
        }
      : null,
    filters.categoryId
      ? {
          key: "categoryId",
          label: `${copy.activeCategory}: ${
            translateCategoryName(
              categories.find((category) => String(category.id) === String(filters.categoryId))?.name || filters.categoryId,
              language,
            )
          }`,
        }
      : null,
    filters.city ? { key: "city", label: `${copy.activeCity}: ${translateCityName(filters.city, language)}` } : null,
    filters.minBudget ? { key: "minBudget", label: `${copy.from} ${formatMoney(filters.minBudget, language)}` } : null,
    filters.maxBudget ? { key: "maxBudget", label: `${copy.to} ${formatMoney(filters.maxBudget, language)}` } : null,
    filters.status ? { key: "status", label: `${copy.statusLabel}: ${copy[`status${filters.status.replace(/(^|_)([a-z])/g, (_, __, ch) => ch.toUpperCase())}`] || filters.status}` } : null,
  ].filter(Boolean);

  const visibleCategoryGroups = useMemo(() => {
    const filteredCategories = categories.filter((category) => categoryMatchesSection(category, filters.section));
    return buildCategoryGroups(filteredCategories, language).map((group) => ({
      ...group,
      label: getLocalizedSectionLabel(group.key, language, group.label),
    }));
  }, [categories, filters.section, language]);

  const localizedSections = useMemo(
    () =>
      serviceSections.map((section) => ({
        ...section,
        label: getLocalizedSectionLabel(section.key, language, section.label),
      })),
    [language],
  );

  const handleSectionChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    const selectedCategory = categories.find((category) => String(category.id) === String(filters.categoryId));

    if (!value) {
      nextParams.delete("section");
    } else {
      nextParams.set("section", value);
    }

    if (!categoryMatchesSection(selectedCategory, value)) {
      nextParams.delete("categoryId");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const respondToJob = async (payload) => {
    try {
      await api.post("/jobs/respond", payload);
      await loadJobs();
      alert(copy.responseSent);
    } catch (err) {
      alert(err.response?.data?.message || copy.responseError);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:self-start">
        <section className="panel">
          <p className="section-kicker">{copy.filtersKicker}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{isVacancyMode ? copy.vacancyFiltersTitle : copy.filtersTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{isVacancyMode ? copy.vacancyFiltersText : copy.filtersText}</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label">{copy.search}</label>
              <input
                className="input"
                placeholder={isVacancyMode ? copy.vacancyQPlaceholder : copy.qPlaceholder}
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
              />
            </div>

            <div>
              <label className="label">{copy.workType}</label>
              <select className="input" value={filters.workType} onChange={(event) => updateFilter("workType", event.target.value)}>
                <option value="">{copy.allWorkTypes}</option>
                <option value="order">{copy.orderWorks}</option>
                <option value="vacancy">{copy.vacancies}</option>
              </select>
            </div>

            <div>
              <label className="label">{copy.section}</label>
              <select className="input" value={filters.section} onChange={(event) => handleSectionChange(event.target.value)}>
                <option value="">{copy.allSections}</option>
                {localizedSections.map((section) => (
                  <option key={section.key} value={section.key}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{copy.category}</label>
              <select className="input" value={filters.categoryId} onChange={(event) => updateFilter("categoryId", event.target.value)}>
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
              <label className="label">{copy.city}</label>
              <select className="input" value={filters.city} onChange={(event) => updateFilter("city", event.target.value)}>
                <option value="">{language === "ky" ? "Бардык шаарлар" : language === "en" ? "All cities" : allCitiesLabel}</option>
                {getLocalizedCityOptions(filters.city, language).map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="label">{isVacancyMode ? copy.salaryFrom : copy.minBudget}</label>
                <input
                  className="input"
                  min="0"
                  type="number"
                  value={filters.minBudget}
                  onChange={(event) => updateFilter("minBudget", event.target.value)}
                />
              </div>

              <div>
                <label className="label">{isVacancyMode ? copy.salaryTo : copy.maxBudget}</label>
                <input
                  className="input"
                  min="0"
                  type="number"
                  value={filters.maxBudget}
                  onChange={(event) => updateFilter("maxBudget", event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">{copy.status}</label>
              <select className="input" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                <option value="">{copy.allStatuses}</option>
                <option value="open">{copy.statusOpen}</option>
                <option value="in_progress">{copy.statusInProgress}</option>
                <option value="completed">{copy.statusCompleted}</option>
                <option value="cancelled">{copy.statusCancelled}</option>
              </select>
            </div>

            <div>
              <label className="label">{copy.sort}</label>
              <select className="input" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
                <option value="recent">{copy.sortRecent}</option>
                <option value="budget_desc">{copy.sortBudget}</option>
                <option value="urgent_first">{copy.sortResponses}</option>
              </select>
            </div>

            <button className="btn-secondary w-full" type="button" onClick={resetFilters}>
              {copy.reset}
            </button>
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <div className="panel">
          <p className="section-kicker">{isVacancyMode ? copy.vacancySectionSummary : copy.sectionSummary}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{isVacancyMode ? copy.vacancyTitle : copy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{isVacancyMode ? copy.vacancySubtitle : copy.subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {activeFilters.map((item) => (
              <button
                key={item.key}
                type="button"
                className="badge cursor-pointer transition hover:border-[#d5b2bc] hover:bg-[#fff2f5]"
                onClick={() => updateFilter(item.key, "")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.openCount}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{insights.openCount}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{isVacancyMode ? copy.avgSalary : copy.avgBudget}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(insights.averageBudget, language)}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.totalFound}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{visibleJobs.length}</p>
              <p className="mt-1 text-sm text-slate-500">{isVacancyMode ? copy.vacanciesLabel : copy.jobsLabel}</p>
            </article>
          </div>

          {(user?.role === "customer" || user?.role === "admin") ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link className="btn-primary" to={isVacancyMode ? "/jobs/new?jobType=vacancy" : "/jobs/new?jobType=order"}>
                {isVacancyMode ? copy.publishVacancy : copy.publishJob}
              </Link>
              {user?.id ? (
                <Link className="btn-secondary" to={`/jobs?customerId=${user.id}${isVacancyMode ? "&workType=vacancy" : "&workType=order"}`}>
                  {isVacancyMode ? copy.customerVacancies : copy.customerJobs}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {loading ? <section className="panel text-slate-600">{isVacancyMode ? copy.loadingVacancies : copy.loading}</section> : null}
        {!loading && error ? <section className="panel text-red-600">{error}</section> : null}
        {!loading && !error && visibleJobs.length === 0 ? <section className="panel text-slate-600">{isVacancyMode ? copy.noVacancies : copy.noJobs}</section> : null}

        <div className="space-y-4">
          {visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              canRespond={user?.role === "worker" || user?.role === "admin"}
              job={job}
              onRespond={respondToJob}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default JobsPage;

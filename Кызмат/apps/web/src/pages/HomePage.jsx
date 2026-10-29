import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { RatingInline } from "../components/RatingDisplay";
import UserAvatar from "../components/UserAvatar";
import WorkerStatusBadges from "../components/WorkerStatusBadges";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getLocalizedCityOptions } from "../data/kyrgyzstanCities";
import { getServiceSectionLabel, serviceSections } from "../data/serviceSections";
import { formatMoney, localizeJob, localizeWorker, translateCityName } from "../i18n/contentTranslations";
import { getWorkerVerificationMeta, normalizeWorkerResume } from "../utils/workerResume";

const featuredKeys = ["repair", "home", "education", "it", "auto", "logistics", "beauty", "legal"];

const sectionImages = {
  repair: "/images/categories/repair.jpg",
  home: "/images/categories/cleaning.jpg",
  education: "/images/categories/tutors.jpg",
  it: "/images/categories/it.jpg",
  auto: "/images/categories/auto.jpg",
  logistics: "/images/categories/moving.jpg",
  beauty: "/images/categories/beauty.jpg",
  legal: "/images/categories/legal.jpg",
};

const copyByLanguage = {
  ru: {
    platform: "Платформа услуг по Кыргызстану",
    title: "Проверенные специалисты для дома, бизнеса и срочных задач",
    subtitle:
      "KYZMAT помогает быстро найти исполнителя: вы видите профиль, рейтинг, отзывы и можете сразу перейти к общению.",
    searchPlaceholder: "Какую услугу или какого специалиста вы ищете?",
    allCities: "Все города",
    findWorker: "Найти специалиста",
    cityHint: "Город выбирается из готового списка, чтобы подбор был точнее.",
    processTitle: "Как проходит подбор",
    processText: "Простой путь от заявки до выбора исполнителя.",
    process1: "Опишите задачу или выберите специалиста в каталоге.",
    process2: "Получите отклики с ценой, сроками и условиями.",
    process3: "Сравните профили, отзывы и предложения.",
    process4: "Выберите исполнителя и продолжайте общение в чате.",
    free: "Бесплатно для клиента",
    catalogTitle: "Сейчас в каталоге",
    openCatalog: "Открыть каталог",
    categories: "Направления",
    jobs: "Открытые задачи",
    popularKicker: "Популярные услуги",
    popularTitle: "Направления, с которых чаще всего начинается поиск",
    openAllDirections: "Открыть все направления",
    jobsKicker: "Лента заказов",
    jobsTitle: "Новые запросы клиентов",
    jobsAction: "Все заказы",
    workersKicker: "Рекомендованные специалисты",
    workersTitle: "Исполнители с высоким рейтингом",
    workersAction: "Каталог специалистов",
    budget: "Бюджет",
    noJobs: "Открытые заказы появятся здесь после публикации клиентами.",
    noWorkers: "Сильные анкеты специалистов появятся здесь после новых откликов и активности.",
    publishJob: "Опубликовать задачу",
    openJobs: "Смотреть заказы",
    startUsing: "Начать пользоваться",
    cityFallback: "Город не указан",
    orderWorks: "Заказные работы",
    orderWorksText: "Разовые задачи от клиентов: ремонт, доставка, уборка, IT и другие услуги.",
    vacancies: "Вакансии",
    vacanciesText: "Долгосрочная работа и постоянные предложения для исполнителей.",
    searchOrders: "Найти заказ",
    searchVacancies: "Найти вакансию",
    orderSearchPlaceholder: "Какую заказную работу ищете?",
    vacancySearchPlaceholder: "Какую вакансию ищете?",
    trustFast: "Быстрый подбор",
    trustFastText: "заказы и вакансии в одном месте",
    trustChat: "Чат без лишних шагов",
    trustChatText: "общение сразу после отклика",
    trustMap: "Адрес и маршрут",
    trustMapText: "точка на карте для выездных работ",
  },
  ky: {
    platform: "Кыргызстан боюнча кызматтар платформасы",
    title: "Үйгө, бизнеске жана шашылыш иштерге текшерилген адистер",
    subtitle:
      "KYZMAT аткаруучуну тез табууга жардам берет: профиль, рейтинг, пикирлер көрүнүп турат жана дароо сүйлөшүүгө өтсөңүз болот.",
    searchPlaceholder: "Кайсы кызматты же кайсы адисти издеп жатасыз?",
    allCities: "Бардык шаарлар",
    findWorker: "Адис табуу",
    cityHint: "Тандоо так болушу үчүн шаар даяр тизмеден тандалат.",
    processTitle: "Тандоо кандай өтөт",
    processText: "Өтүнмөдөн аткаруучуну тандоого чейинки жөнөкөй жол.",
    process1: "Тапшырманы сүрөттөп бериңиз же каталогдон адисти тандаңыз.",
    process2: "Баасы, мөөнөтү жана шарттары менен жоопторду алыңыз.",
    process3: "Профилдерди, пикирлерди жана сунуштарды салыштырыңыз.",
    process4: "Аткаруучуну тандап, чатта сүйлөшүүнү улантыңыз.",
    free: "Кардар үчүн акысыз",
    catalogTitle: "Азыр каталогдо",
    openCatalog: "Каталогду ачуу",
    categories: "Багыттар",
    jobs: "Ачык тапшырмалар",
    popularKicker: "Популярдуу кызматтар",
    popularTitle: "Издөө көп учурда ушул багыттардан башталат",
    openAllDirections: "Бардык багыттарды ачуу",
    jobsKicker: "Заказ лентасы",
    jobsTitle: "Кардарлардын жаңы суроо-талаптары",
    jobsAction: "Бардык заказдар",
    workersKicker: "Сунушталган адистер",
    workersTitle: "Жогорку рейтингдеги аткаруучулар",
    workersAction: "Адистер каталогу",
    budget: "Бюджет",
    noJobs: "Ачык заказдар кардарлар жарыялагандан кийин ушул жерде көрүнөт.",
    noWorkers: "Күчтүү адис анкеталары жаңы жооптор жана активдүүлүк менен ушул жерге чыгат.",
    publishJob: "Тапшырма жарыялоо",
    openJobs: "Заказдарды көрүү",
    startUsing: "Колдонууну баштоо",
    cityFallback: "Шаар көрсөтүлгөн эмес",
    orderWorks: "Заказдык иштер",
    orderWorksText: "Кардарлардын бир жолку тапшырмалары: оңдоо, жеткирүү, тазалоо, IT жана башка кызматтар.",
    vacancies: "Вакансиялар",
    vacanciesText: "Аткаруучулар үчүн туруктуу жумуш жана узак мөөнөттүү сунуштар.",
    searchOrders: "Заказ табуу",
    searchVacancies: "Вакансия табуу",
    orderSearchPlaceholder: "Кандай заказдык иш издеп жатасыз?",
    vacancySearchPlaceholder: "Кандай вакансия издеп жатасыз?",
    trustFast: "Тез тандоо",
    trustFastText: "заказдар жана вакансиялар бир жерде",
    trustChat: "Ашыкча кадамсыз чат",
    trustChatText: "жооптон кийин дароо сүйлөшүү",
    trustMap: "Дарек жана маршрут",
    trustMapText: "чыгуу иштерине картадагы чекит",
  },
  en: {
    platform: "Service marketplace across Kyrgyzstan",
    title: "Verified specialists for home, business, and urgent requests",
    subtitle:
      "KYZMAT helps you find the right specialist faster: you see the profile, rating, reviews, and can move straight into chat.",
    searchPlaceholder: "What service or specialist are you looking for?",
    allCities: "All cities",
    findWorker: "Find specialist",
    cityHint: "Choose a city from the ready-made list for more accurate results.",
    processTitle: "How matching works",
    processText: "A simple path from request to choosing a specialist.",
    process1: "Describe the task or choose a specialist in the catalog.",
    process2: "Receive responses with price, timing, and terms.",
    process3: "Compare profiles, reviews, and offers.",
    process4: "Choose a specialist and continue in chat.",
    free: "Free for customers",
    catalogTitle: "Now in the catalog",
    openCatalog: "Open catalog",
    categories: "Directions",
    jobs: "Open jobs",
    popularKicker: "Popular services",
    popularTitle: "The directions where most searches begin",
    openAllDirections: "Open all directions",
    jobsKicker: "Job feed",
    jobsTitle: "New customer requests",
    jobsAction: "All jobs",
    workersKicker: "Recommended specialists",
    workersTitle: "Top-rated specialists",
    workersAction: "Specialists catalog",
    budget: "Budget",
    noJobs: "Open jobs published by customers will appear here.",
    noWorkers: "Strong specialist profiles will appear here as new responses and activity come in.",
    publishJob: "Post a request",
    openJobs: "Browse jobs",
    startUsing: "Get started",
    cityFallback: "City not specified",
    orderWorks: "Custom jobs",
    orderWorksText: "One-time customer tasks: repair, delivery, cleaning, IT, and other services.",
    vacancies: "Vacancies",
    vacanciesText: "Long-term work and steady opportunities for specialists.",
    searchOrders: "Find a job",
    searchVacancies: "Find a vacancy",
    orderSearchPlaceholder: "What custom job are you looking for?",
    vacancySearchPlaceholder: "What vacancy are you looking for?",
    trustFast: "Fast matching",
    trustFastText: "jobs and vacancies in one place",
    trustChat: "Direct chat",
    trustChatText: "message right after a response",
    trustMap: "Address and route",
    trustMapText: "map point for on-site work",
  },
};

const processCopyByLanguage = {
  ru: {
    title: "Как проходит подбор",
    text: "Простой путь от заявки до выбора исполнителя.",
    steps: [
      "Опишите задачу или выберите специалиста в каталоге.",
      "Получите отклики с ценой, сроками и условиями.",
      "Сравните профили, отзывы и предложения.",
      "Выберите исполнителя и продолжайте общение в чате.",
    ],
    free: "Бесплатно для клиента",
  },
  ky: {
    title: "Тандоо кандай өтөт",
    text: "Өтүнмөдөн аткаруучуну тандоого чейинки жөнөкөй жол.",
    steps: [
      "Тапшырманы сүрөттөп бериңиз же каталогдон адисти тандаңыз.",
      "Баасы, мөөнөтү жана шарттары менен жоопторду алыңыз.",
      "Профилдерди, пикирлерди жана сунуштарды салыштырыңыз.",
      "Аткаруучуну тандап, чатта сүйлөшүүнү улантыңыз.",
    ],
    free: "Кардар үчүн акысыз",
  },
  en: {
    title: "How matching works",
    text: "A simple path from request to choosing a specialist.",
    steps: [
      "Describe the task or choose a specialist in the catalog.",
      "Receive responses with price, timing, and terms.",
      "Compare profiles, reviews, and offers.",
      "Choose a specialist and continue in chat.",
    ],
    free: "Free for customers",
  },
};

const processContentByLanguage = {
  ru: {
    title: "Как проходит подбор",
    text: "Простой путь от заявки до выбора исполнителя.",
    steps: [
      {
        title: "Опишите задачу или выберите специалиста.",
        description: "Можно сразу разместить заказ или открыть каталог и подобрать подходящего исполнителя вручную.",
      },
      {
        title: "Получите отклики с ценой и сроками.",
        description: "Исполнители отправят предложения, а вы увидите стоимость, сроки и удобный формат работы.",
      },
      {
        title: "Сравните профили и отзывы.",
        description: "Оцените рейтинг, опыт и комментарии клиентов, чтобы выбрать наиболее подходящего специалиста.",
      },
      {
        title: "Выберите исполнителя и продолжайте в чате.",
        description: "После выбора можно сразу обсудить адрес, время выезда и все детали заказа в одном месте.",
      },
    ],
    free: "Бесплатно для клиента",
  },
  ky: {
    title: "Тандоо кандай өтөт",
    text: "Өтүнмөдөн аткаруучуну тандоого чейинки жөнөкөй жол.",
    steps: [
      {
        title: "Тапшырманы жазыңыз же адисти тандаңыз.",
        description: "Заказды дароо жарыялай аласыз же каталогдон ылайыктуу аткаруучуну өзүңүз тандай аласыз.",
      },
      {
        title: "Баасы жана мөөнөтү менен жооп алыңыз.",
        description: "Аткаруучулар сунуш жөнөтүшөт, сиз болсо баасын, мөөнөтүн жана иштөө шартын көрөсүз.",
      },
      {
        title: "Профилдерди жана пикирлерди салыштырыңыз.",
        description: "Рейтингин, тажрыйбасын жана кардарлардын пикирлерин карап, эң ылайыктуу адисти тандаңыз.",
      },
      {
        title: "Аткаруучуну тандап, чатта улантыңыз.",
        description: "Тандоодон кийин дароо дарек, убакыт жана иштин бардык майда-чүйдөсүн талкуулай аласыз.",
      },
    ],
    free: "Кардар үчүн акысыз",
  },
  en: {
    title: "How matching works",
    text: "A simple path from request to choosing a specialist.",
    steps: [
      {
        title: "Describe the task or choose a specialist.",
        description: "You can post a request right away or open the catalog and select a suitable specialist manually.",
      },
      {
        title: "Receive responses with price and timing.",
        description: "Specialists send offers, and you immediately see pricing, deadlines, and working terms.",
      },
      {
        title: "Compare profiles and reviews.",
        description: "Check ratings, experience, and customer feedback to choose the best specialist for your task.",
      },
      {
        title: "Choose a specialist and continue in chat.",
        description: "After selection, you can discuss the address, schedule, and final details in one place.",
      },
    ],
    free: "Free for customers",
  },
};

const processTextByLanguage = {
  ru: {
    title: "Как проходит подбор",
    text: "Простой путь от заявки до выбора исполнителя.",
    steps: [
      "Опишите задачу или выберите специалиста в каталоге.",
      "Получите отклики с ценой, сроками и условиями.",
      "Сравните профили, отзывы и предложения.",
      "Выберите исполнителя и продолжайте общение в чате.",
    ],
    free: "Бесплатно для клиента",
  },
  ky: {
    title: "Тандоо кандай өтөт",
    text: "Өтүнмөдөн аткаруучуну тандоого чейинки жөнөкөй жол.",
    steps: [
      "Тапшырманы сүрөттөп бериңиз же каталогдон адисти тандаңыз.",
      "Баасы, мөөнөтү жана шарттары менен жоопторду алыңыз.",
      "Профилдерди, пикирлерди жана сунуштарды салыштырыңыз.",
      "Аткаруучуну тандап, чатта сүйлөшүүнү улантыңыз.",
    ],
    free: "Кардар үчүн акысыз",
  },
  en: {
    title: "How matching works",
    text: "A simple path from request to choosing a specialist.",
    steps: [
      "Describe the task or choose a specialist in the catalog.",
      "Receive responses with price, timing, and terms.",
      "Compare profiles, reviews, and offers.",
      "Choose a specialist and continue in chat.",
    ],
    free: "Free for customers",
  },
};

const processUiCopyByLanguage = {
  ru: {
    title: "Как проходит подбор",
    text: "Простой путь от заявки до выбора исполнителя.",
    steps: [
      "Опишите задачу или выберите специалиста в каталоге.",
      "Получите отклики с ценой, сроками и условиями.",
      "Сравните профили, отзывы и предложения.",
      "Выберите исполнителя и продолжайте общение в чате.",
    ],
    free: "Бесплатно для клиента",
  },
  ky: {
    title: "Тандоо кандай өтөт",
    text: "Өтүнмөдөн аткаруучуну тандоого чейинки жөнөкөй жол.",
    steps: [
      "Тапшырманы сүрөттөп бериңиз же каталогдон адисти тандаңыз.",
      "Баасы, мөөнөтү жана шарттары менен жоопторду алыңыз.",
      "Профилдерди, пикирлерди жана сунуштарды салыштырыңыз.",
      "Аткаруучуну тандап, чатта сүйлөшүүнү улантыңыз.",
    ],
    free: "Кардар үчүн акысыз",
  },
  en: {
    title: "How matching works",
    text: "A simple path from request to choosing a specialist.",
    steps: [
      "Describe the task or choose a specialist in the catalog.",
      "Receive responses with price, timing, and terms.",
      "Compare profiles, reviews, and offers.",
      "Choose a specialist and continue in chat.",
    ],
    free: "Free for customers",
  },
};

function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = copyByLanguage[language] || copyByLanguage.ru;
  const processCopy = processUiCopyByLanguage[language] || processUiCopyByLanguage.ru;
  const navigate = useNavigate();
  const [serviceQuery, setServiceQuery] = useState("");
  const [city, setCity] = useState("Бишкек");
  const [workSearchType, setWorkSearchType] = useState("order");
  const [activeProcessStep, setActiveProcessStep] = useState(-1);
  const [categories, setCategories] = useState([]);
  const [featuredWorkers, setFeaturedWorkers] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const [categoriesResult, workersResult, jobsResult] = await Promise.allSettled([
        api.get("/categories"),
        api.get("/workers", { params: { minRating: 4 } }),
        api.get("/jobs", { params: { status: "open", sort: "recent" } }),
      ]);

      if (!isMounted) return;

      if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value.data || []);
      if (workersResult.status === "fulfilled") setFeaturedWorkers((workersResult.value.data || []).slice(0, 4));
      if (jobsResult.status === "fulfilled") setRecentJobs((jobsResult.value.data || []).slice(0, 4));
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const searchSpecialists = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (serviceQuery.trim()) params.set("q", serviceQuery.trim());
    if (city.trim()) params.set("city", city.trim());
    params.set("status", "open");
    params.set("workType", workSearchType);
    navigate(`/jobs?${params.toString()}`);
  };

  const featuredSections = useMemo(
    () =>
      featuredKeys
        .map((key) => serviceSections.find((section) => section.key === key))
        .filter(Boolean)
        .map((section) => ({
          key: section.key,
          label: getServiceSectionLabel(section, language),
          image: sectionImages[section.key] || sectionImages.repair,
        })),
    [language],
  );

  const workers = useMemo(
    () =>
      featuredWorkers.map((item) => {
        const worker = localizeWorker(item, language);
        const resume = normalizeWorkerResume(worker.workerResume);
        return {
          ...worker,
          resume,
          verificationMeta: getWorkerVerificationMeta(resume.verificationStatus, worker.isPro, language),
        };
      }),
    [featuredWorkers, language],
  );

  const localizedJobs = useMemo(() => recentJobs.map((job) => localizeJob(job, language)), [language, recentJobs]);
  const heroTrustItems = [
    { value: copy.trustFast, label: copy.trustFastText },
    { value: copy.trustChat, label: copy.trustChatText },
    { value: copy.trustMap, label: copy.trustMapText },
  ];
  const processSteps = processCopy.steps;

  const orderCta =
    user?.role === "customer" || user?.role === "admin"
      ? { to: "/jobs/new", label: copy.publishJob }
      : user
        ? { to: "/jobs", label: copy.openJobs }
        : { to: "/register", label: copy.startUsing };

  return (
    <div className="space-y-10">
      <section className="panel relative overflow-hidden px-4 pb-4 pt-6 sm:px-8 sm:pb-6 sm:pt-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8d1530]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#ead3d9]/40 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div className="max-w-2xl">
            <p className="section-kicker">{copy.platform}</p>
            <h1 className="mt-4 text-[2.35rem] font-black leading-[0.98] tracking-[-0.065em] text-slate-950 sm:text-6xl">{copy.title}</h1>
            <p className="subtitle">{copy.subtitle}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {heroTrustItems.map((item) => (
                <div key={item.value} className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_40px_-34px_rgba(56,18,30,0.35)]">
                  <p className="text-sm font-extrabold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { key: "order", title: copy.orderWorks, text: copy.orderWorksText, number: "01" },
                { key: "vacancy", title: copy.vacancies, text: copy.vacanciesText, number: "02" },
              ].map((item) => {
                const isActive = workSearchType === item.key;
                return (
                  <button
                    key={item.key}
                    className={`group relative overflow-hidden rounded-[28px] border p-5 text-left transition hover:-translate-y-0.5 ${
                      isActive
                        ? "border-[#8d1530] bg-[linear-gradient(135deg,#fff6f8,#ffffff)] shadow-[0_22px_60px_-34px_rgba(141,21,48,0.45)]"
                        : "border-slate-200 bg-white/80 hover:border-[#d8a3b0]"
                    }`}
                    type="button"
                    onClick={() => setWorkSearchType(item.key)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`badge ${isActive ? "border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]" : ""}`}>
                        {item.title}
                      </span>
                      <span className={`text-xs font-black tracking-[0.18em] ${isActive ? "text-[#8d1530]" : "text-slate-300"}`}>
                        {item.number}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{item.text}</p>
                    <span className={`mt-4 block h-1.5 rounded-full transition ${isActive ? "bg-[#8d1530]" : "bg-slate-100 group-hover:bg-[#ead3d9]"}`} />
                  </button>
                );
              })}
            </div>

            <form className="mt-4 rounded-[30px] border border-[#ead3d9] bg-white/86 p-3 shadow-[0_18px_50px_-36px_rgba(56,18,30,0.35)]" onSubmit={searchSpecialists}>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
                <input
                  className="input border-transparent bg-white"
                  placeholder={workSearchType === "vacancy" ? copy.vacancySearchPlaceholder : copy.orderSearchPlaceholder}
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                />
                <select className="input border-transparent bg-white" value={city} onChange={(event) => setCity(event.target.value)}>
                  <option value="">{copy.allCities}</option>
                  {getLocalizedCityOptions(city, language).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <button className="btn-primary h-full w-full rounded-2xl" type="submit">
                  {workSearchType === "vacancy" ? copy.searchVacancies : copy.searchOrders}
                </button>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">{copy.cityHint}</p>
            </form>
          </div>

          <div className="home-process-panel rounded-[32px] border p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-950">{processCopy.title}</p>
                <p className="mt-1 max-w-xs text-sm text-slate-600">{processCopy.text}</p>
              </div>
              <span className="badge border-[#ead3d9] bg-white/85 text-[#8d1530]">{processCopy.free}</span>
            </div>
            <div className="mt-5 space-y-4">
              {processSteps.map((step, index) => (
                <div key={`${index}-${step}`} className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-slate-950 shadow-[0_14px_30px_-22px_rgba(56,18,30,0.38)]">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-[1.05rem] leading-8 text-slate-700 sm:text-[1.12rem]">{step}</p>
                </div>
              ))}
            </div>
            {false && <div className="hidden mt-5 space-y-3">
              {processSteps.map((step, index) => {
                const isActive = activeProcessStep === index;

                return (
                  <article key={`${index}-${step.title}`} className={`home-process-cell ${isActive ? "is-active" : ""}`}>
                    <button
                      className="home-process-cell__trigger"
                      type="button"
                      onClick={() => setActiveProcessStep((current) => (current === index ? -1 : index))}
                    >
                      <span className="home-process-cell__number">{index + 1}</span>
                      <span className={`home-process-cell__preview ${isActive ? "is-open" : ""}`}>{step.title}</span>
                      <span aria-hidden="true" className="home-process-cell__toggle">
                        {isActive ? "−" : "+"}
                      </span>
                    </button>
                    {isActive ? <p className="home-process-cell__content">{step.description}</p> : null}
                  </article>
                );
              })}
            </div>}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">{copy.popularKicker}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.popularTitle}</h2>
          </div>
          <Link className="text-sm font-semibold text-[#8d1530]" to="/workers">
            {copy.openAllDirections}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredSections.map((section, index) => (
            <button key={section.key} type="button" className="group relative min-h-[220px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-left transition hover:-translate-y-1" onClick={() => navigate(`/workers?section=${section.key}`)}>
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${section.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-slate-900/25 to-slate-950/85" />
              <div className="relative flex h-full flex-col">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/35 bg-white/85 text-sm font-extrabold ${index % 2 === 0 ? "text-[#8d1530]" : "text-[#7a2431]"}`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-auto">
                  <h3 className="text-xl font-bold text-white">{section.label}</h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="panel">
          <div className="flex items-end justify-between gap-4 border-b border-[rgba(141,21,48,0.08)] pb-5">
            <div>
              <p className="section-kicker">{copy.jobsKicker}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.jobsTitle}</h2>
            </div>
            <Link className="inline-flex shrink-0 items-center rounded-full border border-[rgba(141,21,48,0.1)] bg-white px-4 py-2 text-sm font-semibold text-[#8d1530] transition hover:border-[rgba(141,21,48,0.2)] hover:bg-[#fff8fa]" to="/jobs">
              {copy.jobsAction}
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {localizedJobs.length ? localizedJobs.map((job) => (
              <Link key={job.id} className="block rounded-3xl border border-slate-200 bg-white/80 p-4 transition hover:border-slate-300" to={`/jobs/${job.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="badge border-[#ead3d9] bg-[#fff6f8] text-[#8d1530]">{job.category_name}</span>
                    <h3 className="mt-4 break-words text-[1.28rem] font-bold leading-[1.12] tracking-[-0.03em] text-slate-950 sm:text-[1.45rem]">{job.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{job.city || copy.cityFallback}</p>
                  </div>
                  <div className="rounded-[26px] bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.budget}</p>
                    <p className="mt-2 text-[1.9rem] font-bold text-slate-950">{formatMoney(job.budget, language)}</p>
                  </div>
                </div>
              </Link>
            )) : <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">{copy.noJobs}</div>}
          </div>
        </section>

        <section className="panel">
          <div className="flex items-end justify-between gap-4 border-b border-[rgba(141,21,48,0.08)] pb-5">
            <div>
              <p className="section-kicker">{copy.workersKicker}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.workersTitle}</h2>
            </div>
            <Link className="inline-flex shrink-0 items-center rounded-full border border-[rgba(141,21,48,0.12)] bg-[#fff8fa] px-4 py-2 text-sm font-semibold text-[#8d1530] transition hover:border-[rgba(141,21,48,0.22)] hover:bg-white" to="/workers">
              {copy.workersAction}
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {workers.length ? workers.map((worker, index) => (
              <article key={worker.id} className="worker-card">
                <div className="flex flex-col gap-4">
                  <div className="flex min-h-[32px] justify-end">
                    <WorkerStatusBadges className="justify-end" isPro={worker.isPro} verificationMeta={worker.verificationMeta} verificationStatus={worker.resume.verificationStatus} />
                  </div>
                  <div className="flex min-w-0 items-start gap-4">
                    <UserAvatar className={`h-[84px] w-[84px] shrink-0 rounded-[28px] ${index % 2 === 0 ? "bg-[#f7e7ea] text-[#8d1530]" : "bg-[#efe4da] text-[#7a2431]"}`} name={worker.fullName} src={worker.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-[1.18rem] font-extrabold leading-[1.12] tracking-[-0.035em] text-slate-950 sm:text-[1.55rem]">{worker.fullName}</h3>
                      <p className="mt-2 text-[0.95rem] font-medium text-slate-500">{translateCityName(worker.city, language) || copy.cityFallback}</p>
                    </div>
                  </div>
                </div>
                {worker.resume.headline && <p className="mt-5 min-h-[96px] text-[1.02rem] leading-8 text-slate-700">{worker.resume.headline}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <RatingInline className="badge border-slate-200 bg-slate-50" rating={worker.rating || 0} reviews={worker.totalReviews || 0} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link className="btn-secondary !rounded-[22px] !px-4 !py-3 text-center" to={`/workers/${worker.id}`}>{copy.openCatalog}</Link>
                  <Link className="btn-primary !rounded-[22px] !px-4 !py-3 text-center" to={`/chat?withUserId=${worker.id}`}>{copy.findWorker}</Link>
                </div>
              </article>
            )) : <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">{copy.noWorkers}</div>}
          </div>
        </section>
      </div>

      <section className="flex flex-wrap gap-3">
        <Link className="btn-primary" to={orderCta.to}>{orderCta.label}</Link>
        <Link className="btn-secondary" to="/workers">{copy.openCatalog}</Link>
      </section>
    </div>
  );
}

export default HomePage;

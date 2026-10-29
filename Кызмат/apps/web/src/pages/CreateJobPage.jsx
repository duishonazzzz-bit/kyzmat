import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { getLocalizedCityOptions } from "../data/kyrgyzstanCities";
import {
  buildCategoryGroups,
  categoryMatchesSection,
  filterCategoriesBySection,
  findServiceSectionByCategoryName,
  serviceSections,
} from "../data/serviceSections";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryName } from "../i18n/contentTranslations";

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

const pageCopy = {
  ru: {
    title: "Публикация заказа или вакансии",
    orderTitle: "Публикация заказа",
    vacancyTitle: "Публикация вакансии",
    subtitle: "Выберите тип публикации и опишите задачу подробно: так специалисты быстрее поймут условия и отправят более точные предложения.",
    orderSubtitle: "Опишите задачу подробно: так специалисты быстрее поймут объем работ и отправят более точные предложения.",
    vacancySubtitle: "Опишите вакансию подробно: обязанности, оплату, график и условия работы.",
    jobTypeLabel: "Категория публикации",
    orderType: "Заказная работа",
    orderTypeText: "Разовая задача с бюджетом, адресом и откликами исполнителей.",
    vacancyType: "Вакансия",
    vacancyTypeText: "Долгосрочная работа, смена или постоянное предложение для специалистов.",
    basicsStep: "Основное",
    basicsTitle: "Что нужно сделать",
    basicsText: "Название и описание помогают исполнителям быстро понять задачу.",
    categoryStep: "Категория и оплата",
    categoryText: "Выберите направление, категорию, город и укажите бюджет или оплату.",
    routeStep: "Адрес и маршрут",
    routeText: "Точный адрес помогает исполнителю заранее построить маршрут.",
    optionsStep: "Условия",
    optionsText: "Отметьте срочность, безопасную сделку и дополнительные параметры.",
    allSections: "Все разделы",
    titleLabel: "Название заказа",
    vacancyTitleLabel: "Название вакансии",
    descriptionLabel: "Описание",
    sectionLabel: "Раздел услуг",
    categoryLabel: "Категория",
    selectCategory: "Выберите категорию",
    budgetLabel: "Бюджет",
    salaryLabel: "Оплата / зарплата",
    cityLabel: "Город",
    addressLabel: "Точный адрес",
    addressPlaceholder: "Улица, дом, офис, квартира или точка встречи",
    loadingAddress: "Подбираем адрес...",
    googleSuggestions: "Подсказки Google Maps",
    addressSuggestions: "Подсказки адресов",
    dueDateLabel: "Срок выполнения",
    locationNoteLabel: "Комментарий к адресу",
    locationNotePlaceholder: "Подъезд, этаж, код двери, ориентир, парковка или другие важные детали",
    latitudeLabel: "Широта",
    longitudeLabel: "Долгота",
    radiusLabel: "Радиус поиска (км)",
    findPoint: "Определить точку по адресу",
    useLocation: "Определить мою геолокацию",
    urgent: "Срочный заказ",
    escrow: "Безопасная сделка с резервированием средств",
    submit: "Опубликовать заказ",
    submitting: "Публикуем заказ...",
    submitVacancy: "Опубликовать вакансию",
    submittingVacancy: "Публикуем вакансию...",
    titleError: "Укажите понятное название заказа, не короче 5 символов.",
    descriptionError: "Добавьте более подробное описание, минимум 10 символов.",
    budgetError: "Укажите корректный бюджет.",
    categoryError: "Выберите категорию услуги.",
    cityError: "Выберите город.",
    addressError: "Укажите точный адрес, чтобы исполнитель мог построить маршрут.",
    dueDateError: "Проверьте дату выполнения.",
    latitudeError: "Проверьте координаты точки на карте.",
    longitudeError: "Проверьте координаты точки на карте.",
    radiusError: "Укажите корректный радиус поиска.",
    formError: "Проверьте заполнение формы заказа.",
    publishError: "Не удалось опубликовать заказ.",
    publishVacancyError: "Не удалось опубликовать вакансию.",
    geoUnsupported: "Геолокация не поддерживается этим браузером",
    geoFailed: "Не удалось определить текущее местоположение.",
    currentPointFound: "Точка на карте определена по вашему текущему местоположению.",
    enterAddressFirst: "Сначала укажите адрес заказа.",
    findingPoint: "Определяем точку по адресу...",
    pointFound: "Адрес найден. Исполнитель увидит точку на карте и сможет построить маршрут внутри сервиса.",
    pointError: "Не удалось определить адрес на карте.",
    addressSelected: "Адрес выбран из подсказок.",
  },
  ky: {
    title: "Тапшырма же вакансия жарыялоо",
    orderTitle: "Тапшырманы жарыялоо",
    vacancyTitle: "Вакансияны жарыялоо",
    subtitle: "Жарыянын түрүн тандап, шарттарын кеңири жазыңыз: ошондо адистер так сунуш жөнөтүшөт.",
    orderSubtitle: "Тапшырманы кеңири сүрөттөңүз: ошондо аткаруучулар иштин көлөмүн тезирээк түшүнүп, так сунуштарды жөнөтүшөт.",
    vacancySubtitle: "Вакансияны кеңири сүрөттөңүз: милдеттер, төлөм, график жана иш шарттары.",
    jobTypeLabel: "Жарыя категориясы",
    orderType: "Заказдык иш",
    orderTypeText: "Бюджети, дареги жана аткаруучулардын жооптору бар бир жолку тапшырма.",
    vacancyType: "Вакансия",
    vacancyTypeText: "Адистер үчүн узак мөөнөттүү иш, смена же туруктуу сунуш.",
    basicsStep: "Негизги",
    basicsTitle: "Эмне кылуу керек",
    basicsText: "Аталыш жана сүрөттөмө аткаруучуларга тапшырманы тез түшүнүүгө жардам берет.",
    categoryStep: "Категория жана төлөм",
    categoryText: "Багытты, категорияны, шаарды тандап, бюджетти же төлөмдү көрсөтүңүз.",
    routeStep: "Дарек жана маршрут",
    routeText: "Так дарек аткаруучуга маршрутту алдын ала түзүүгө жардам берет.",
    optionsStep: "Шарттар",
    optionsText: "Шашылыштыкты, коопсуз келишимди жана кошумча параметрлерди белгилеңиз.",
    allSections: "Бардык бөлүмдөр",
    titleLabel: "Тапшырманын аталышы",
    vacancyTitleLabel: "Вакансиянын аталышы",
    descriptionLabel: "Сыпаттама",
    sectionLabel: "Кызмат бөлүмү",
    categoryLabel: "Категория",
    selectCategory: "Категорияны тандаңыз",
    budgetLabel: "Бюджет",
    salaryLabel: "Төлөм / айлык",
    cityLabel: "Шаар",
    addressLabel: "Так дарек",
    addressPlaceholder: "Көчө, үй, кеңсе, батир же жолугушуу жери",
    loadingAddress: "Дарек изделүүдө...",
    googleSuggestions: "Google Maps сунуштары",
    addressSuggestions: "Дарек сунуштары",
    dueDateLabel: "Аткаруу мөөнөтү",
    locationNoteLabel: "Дарек боюнча комментарий",
    locationNotePlaceholder: "Подъезд, кабат, эшик коду, багыт, унаа токтотмо же башка маанилүү маалымат",
    latitudeLabel: "Кеңдик",
    longitudeLabel: "Узундук",
    radiusLabel: "Издөө радиусу (км)",
    findPoint: "Дарек боюнча чекитти аныктоо",
    useLocation: "Менин геолокациямды аныктоо",
    urgent: "Шашылыш тапшырма",
    escrow: "Каражатты резервдөө менен коопсуз келишим",
    submit: "Тапшырманы жарыялоо",
    submitting: "Тапшырма жарыяланууда...",
    submitVacancy: "Вакансияны жарыялоо",
    submittingVacancy: "Вакансия жарыяланууда...",
    titleError: "Түшүнүктүү аталышты жазыңыз, кеминде 5 белги болсун.",
    descriptionError: "Кененирээк сүрөттөмө кошуңуз, кеминде 10 белги болсун.",
    budgetError: "Туура бюджет көрсөтүңүз.",
    categoryError: "Кызмат категориясын тандаңыз.",
    cityError: "Шаарды тандаңыз.",
    addressError: "Аткаруучу маршрут кура алышы үчүн так даректи көрсөтүңүз.",
    dueDateError: "Аткаруу датасын текшериңиз.",
    latitudeError: "Картадагы чекиттин координаттарын текшериңиз.",
    longitudeError: "Картадагы чекиттин координаттарын текшериңиз.",
    radiusError: "Туура издөө радиусун көрсөтүңүз.",
    formError: "Тапшырма формасынын толтурулушун текшериңиз.",
    publishError: "Тапшырманы жарыялоо мүмкүн болгон жок.",
    publishVacancyError: "Вакансияны жарыялоо мүмкүн болгон жок.",
    geoUnsupported: "Бул браузер геолокацияны колдобойт",
    geoFailed: "Учурдагы жайгашкан жериңизди аныктоо мүмкүн болгон жок.",
    currentPointFound: "Картадагы чекит сиздин учурдагы жайгашкан жериңиз боюнча аныкталды.",
    enterAddressFirst: "Алгач тапшырманын дарегин көрсөтүңүз.",
    findingPoint: "Дарек боюнча чекит аныкталууда...",
    pointFound: "Дарек табылды. Аткаруучу картадан чекитти көрүп, кызматтын ичинде эле маршрут кура алат.",
    pointError: "Даректи картадан аныктоо мүмкүн болгон жок.",
    addressSelected: "Дарек сунуштардан тандалды.",
  },
  en: {
    title: "Post a job or vacancy",
    orderTitle: "Post a job",
    vacancyTitle: "Post a vacancy",
    subtitle:
      "Choose the publication type and describe the conditions clearly so specialists can respond accurately.",
    orderSubtitle:
      "Describe the task in detail so specialists understand the scope faster and send more accurate offers.",
    vacancySubtitle: "Describe the vacancy in detail: duties, pay, schedule, and working conditions.",
    jobTypeLabel: "Publication category",
    orderType: "Custom job",
    orderTypeText: "A one-time task with budget, address, and specialist responses.",
    vacancyType: "Vacancy",
    vacancyTypeText: "Long-term work, a shift, or a permanent offer for specialists.",
    basicsStep: "Basics",
    basicsTitle: "What needs to be done",
    basicsText: "A clear title and description help specialists understand the request faster.",
    categoryStep: "Category and pay",
    categoryText: "Choose the direction, category, city, and budget or pay.",
    routeStep: "Address and route",
    routeText: "An exact address helps the specialist plan the route in advance.",
    optionsStep: "Terms",
    optionsText: "Mark urgency, secure deal, and additional settings.",
    allSections: "All sections",
    titleLabel: "Job title",
    vacancyTitleLabel: "Vacancy title",
    descriptionLabel: "Description",
    sectionLabel: "Service section",
    categoryLabel: "Category",
    selectCategory: "Choose a category",
    budgetLabel: "Budget",
    salaryLabel: "Pay / salary",
    cityLabel: "City",
    addressLabel: "Exact address",
    addressPlaceholder: "Street, building, office, apartment, or meeting point",
    loadingAddress: "Looking for the address...",
    googleSuggestions: "Google Maps suggestions",
    addressSuggestions: "Address suggestions",
    dueDateLabel: "Due date",
    locationNoteLabel: "Address comment",
    locationNotePlaceholder:
      "Entrance, floor, door code, landmark, parking, or any other important details",
    latitudeLabel: "Latitude",
    longitudeLabel: "Longitude",
    radiusLabel: "Search radius (km)",
    findPoint: "Find point by address",
    useLocation: "Use my geolocation",
    urgent: "Urgent job",
    escrow: "Secure deal with funds reservation",
    submit: "Publish job",
    submitting: "Publishing job...",
    submitVacancy: "Publish vacancy",
    submittingVacancy: "Publishing vacancy...",
    titleError: "Enter a clear job title with at least 5 characters.",
    descriptionError: "Add a more detailed description with at least 10 characters.",
    budgetError: "Enter a valid budget.",
    categoryError: "Choose a service category.",
    cityError: "Choose a city.",
    addressError: "Enter the exact address so the specialist can build a route.",
    dueDateError: "Check the due date.",
    latitudeError: "Check the map point latitude.",
    longitudeError: "Check the map point longitude.",
    radiusError: "Enter a valid search radius.",
    formError: "Check the job form fields.",
    publishError: "Unable to publish the job.",
    publishVacancyError: "Unable to publish the vacancy.",
    geoUnsupported: "Geolocation is not supported by this browser",
    geoFailed: "Unable to detect your current location.",
    currentPointFound: "The map point was set from your current location.",
    enterAddressFirst: "Enter the job address first.",
    findingPoint: "Finding point by address...",
    pointFound:
      "Address found. The specialist will see the point on the map and can build a route inside the service.",
    pointError: "Unable to find this address on the map.",
    addressSelected: "Address selected from suggestions.",
  },
};

function getLocalizedSectionLabel(sectionKey, language, fallback = "") {
  return sectionLabels[sectionKey]?.[language] || fallback;
}

function CreateJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const [categories, setCategories] = useState([]);
  const [serviceSection, setServiceSection] = useState("");
  const initialJobType = searchParams.get("jobType") === "vacancy" ? "vacancy" : "order";
  const [form, setForm] = useState({
    jobType: initialJobType,
    title: "",
    description: "",
    budget: "",
    categoryId: "",
    city: "Бишкек",
    address: "",
    locationNote: "",
    dueDate: "",
    latitude: "",
    longitude: "",
    radiusKm: "10",
    isUrgent: false,
    escrowRequired: true,
  });
  const [error, setError] = useState("");
  const [locationInfo, setLocationInfo] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [suggestionsProvider, setSuggestionsProvider] = useState("none");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const isVacancy = form.jobType === "vacancy";
  const visibleCategories = filterCategoriesBySection(categories, serviceSection);
  const visibleCategoryGroups = useMemo(
    () =>
      buildCategoryGroups(visibleCategories, language).map((group) => ({
        ...group,
        label: getLocalizedSectionLabel(group.key, language, group.label),
      })),
    [language, visibleCategories],
  );
  const localizedSections = useMemo(
    () =>
      serviceSections.map((section) => ({
        ...section,
        label: getLocalizedSectionLabel(section.key, language, section.label),
      })),
    [language],
  );

  const validationMessages = useMemo(
    () => ({
      title: copy.titleError,
      description: copy.descriptionError,
      budget: copy.budgetError,
      categoryId: copy.categoryError,
      city: copy.cityError,
      address: copy.addressError,
      dueDate: copy.dueDateError,
      latitude: copy.latitudeError,
      longitude: copy.longitudeError,
      radiusKm: copy.radiusError,
    }),
    [copy],
  );

  const extractCreateJobError = (requestError) => {
    const issues = requestError?.response?.data?.errors;

    if (Array.isArray(issues) && issues.length > 0) {
      const field = issues[0]?.path?.[0];
      return validationMessages[field] || copy.formError;
    }

    return requestError?.response?.data?.message || (form.jobType === "vacancy" ? copy.publishVacancyError : copy.publishError);
  };

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const query = form.address.trim();

    if (query.length < 3) {
      setAddressSuggestions([]);
      setSuggestionsProvider("none");
      setLoadingSuggestions(false);
      return undefined;
    }

    let isCancelled = false;
    setLoadingSuggestions(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const { data } = await api.get("/maps/autocomplete", {
          params: {
            input: query,
            city: form.city,
            limit: 5,
          },
        });

        if (isCancelled) {
          return;
        }

        setAddressSuggestions(data.suggestions || []);
        setSuggestionsProvider(data.provider || "none");
      } catch {
        if (isCancelled) {
          return;
        }

        setAddressSuggestions([]);
        setSuggestionsProvider("none");
      } finally {
        if (!isCancelled) {
          setLoadingSuggestions(false);
        }
      }
    }, 320);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.address, form.city]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "categoryId") {
      const selectedCategory = categories.find((category) => String(category.id) === String(value));
      const matchedSection = selectedCategory ? findServiceSectionByCategoryName(selectedCategory.name) : null;

      setForm((prev) => ({ ...prev, categoryId: value }));

      if (matchedSection) {
        setServiceSection(matchedSection.key);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    if (["city", "address", "locationNote", "latitude", "longitude"].includes(name)) {
      setLocationInfo("");
    }
    if (name === "address") {
      setError("");
    }
  };

  const handleSectionChange = (event) => {
    const nextSection = event.target.value;
    const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId));

    setServiceSection(nextSection);
    setError("");

    if (!categoryMatchesSection(selectedCategory, nextSection)) {
      setForm((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(copy.geoUnsupported);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude.toFixed(6)),
          longitude: String(position.coords.longitude.toFixed(6)),
        }));
        setLocationInfo(copy.currentPointFound);
      },
      () => setError(copy.geoFailed),
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  const findAddressOnMap = async () => {
    if (!form.address.trim()) {
      setError(copy.enterAddressFirst);
      return null;
    }

    setError("");
    setLocationInfo(copy.findingPoint);

    try {
      const { data } = await api.get("/maps/geocode", {
        params: {
          city: form.city,
          address: form.address,
        },
      });

      setForm((prev) => ({
        ...prev,
        latitude: String(Number(data.latitude).toFixed(6)),
        longitude: String(Number(data.longitude).toFixed(6)),
      }));
      setLocationInfo(copy.pointFound);
      return data;
    } catch (requestError) {
      const message = requestError.response?.data?.message || copy.pointError;
      setError(message);
      setLocationInfo("");
      return null;
    }
  };

  const applyAddressSuggestion = (suggestion) => {
    setForm((prev) => ({
      ...prev,
      address: suggestion.text,
      latitude: "",
      longitude: "",
    }));
    setAddressSuggestions([]);
    setLocationInfo(copy.addressSelected);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setLocationInfo("");

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        locationNote: form.locationNote.trim(),
        budget: Number(form.budget),
        categoryId: Number(form.categoryId),
        radiusKm: form.radiusKm ? Number(form.radiusKm) : undefined,
      };

      if (payload.title.length < 5) {
        setError(validationMessages.title);
        return;
      }

      if (payload.description.length < 10) {
        setError(validationMessages.description);
        return;
      }

      if (!payload.categoryId) {
        setError(validationMessages.categoryId);
        return;
      }

      if (!Number.isFinite(payload.budget) || payload.budget <= 0) {
        setError(validationMessages.budget);
        return;
      }

      if (payload.address.length < 5) {
        setError(validationMessages.address);
        return;
      }

      let latitude = form.latitude ? Number(form.latitude) : undefined;
      let longitude = form.longitude ? Number(form.longitude) : undefined;

      if (latitude === undefined || longitude === undefined) {
        const point = await findAddressOnMap();
        latitude = point ? Number(point.latitude) : undefined;
        longitude = point ? Number(point.longitude) : undefined;
      }

      await api.post("/jobs", {
        ...payload,
        jobType: form.jobType,
        latitude,
        longitude,
        locationNote: payload.locationNote || undefined,
      });
      navigate(`/jobs?workType=${form.jobType}`);
    } catch (requestError) {
      setError(extractCreateJobError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="panel overflow-hidden p-0">
        <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#fff7f5_0%,#fff_48%,#f7e8ec_100%)] p-5 sm:rounded-[28px] sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#8d1530]/10 blur-3xl" />
          <p className="section-kicker">{copy.jobTypeLabel}</p>
          <div className="relative mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <h1 className="title">{isVacancy ? copy.vacancyTitle : copy.orderTitle || copy.title}</h1>
              <p className="subtitle">{isVacancy ? copy.vacancySubtitle : copy.orderSubtitle || copy.subtitle}</p>
            </div>
            <div className="rounded-[24px] border border-[#ead3d9] bg-white/85 p-3 shadow-[0_18px_50px_-34px_rgba(141,21,48,0.35)]">
              <select className="input bg-white" name="jobType" value={form.jobType} onChange={handleChange}>
                <option value="order">{copy.orderType}</option>
                <option value="vacancy">{copy.vacancyType}</option>
              </select>
              <p className="mt-3 px-1 text-sm leading-6 text-slate-600">{isVacancy ? copy.vacancyTypeText : copy.orderTypeText}</p>
            </div>
          </div>
        </div>

        <form className="grid gap-5 p-4 sm:p-6 lg:p-8" onSubmit={handleSubmit}>
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 sm:p-5">
            <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">01</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.basicsTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy.basicsText}</p>
            <div className="mt-4 grid gap-4">
        <div className="sm:col-span-2">
          <label className="label">{isVacancy ? copy.vacancyTitleLabel : copy.titleLabel}</label>
          <input className="input" minLength={5} name="title" required value={form.title} onChange={handleChange} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">{copy.descriptionLabel}</label>
          <textarea
            required
            className="input min-h-32"
            minLength={10}
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 sm:p-5">
            <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">02</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.categoryStep}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy.categoryText}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{copy.sectionLabel}</label>
          <select className="input" value={serviceSection} onChange={handleSectionChange}>
            <option value="">{copy.allSections}</option>
            {localizedSections.map((section) => (
              <option key={section.key} value={section.key}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{copy.categoryLabel}</label>
          <select className="input" name="categoryId" required value={form.categoryId} onChange={handleChange}>
            <option value="">{copy.selectCategory}</option>
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
          <label className="label">{isVacancy ? copy.salaryLabel : copy.budgetLabel}</label>
          <input className="input" min="1" name="budget" required type="number" value={form.budget} onChange={handleChange} />
        </div>

        <div>
          <label className="label">{copy.cityLabel}</label>
          <select className="input" name="city" required value={form.city} onChange={handleChange}>
            {getLocalizedCityOptions(form.city, language).map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 sm:p-5">
            <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">03</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.routeStep}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy.routeText}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">{copy.addressLabel}</label>
          <div className="relative">
            <input
              required
              autoComplete="off"
              className="input"
              minLength={5}
              name="address"
              placeholder={copy.addressPlaceholder}
              value={form.address}
              onChange={handleChange}
            />
            {(loadingSuggestions || addressSuggestions.length > 0) ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 rounded-2xl border border-[rgba(141,21,48,0.12)] bg-white p-2 shadow-[0_18px_40px_-24px_rgba(56,18,30,0.28)]">
                {loadingSuggestions ? <p className="px-3 py-2 text-sm text-slate-500">{copy.loadingAddress}</p> : null}

                {!loadingSuggestions && addressSuggestions.length > 0 ? (
                  <>
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.placeId || suggestion.text}-${index}`}
                        className="flex w-full items-start rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[#fcf4f1]"
                        type="button"
                        onClick={() => applyAddressSuggestion(suggestion)}
                      >
                        {suggestion.text}
                      </button>
                    ))}
                    <p className="px-3 pt-2 text-xs font-medium text-slate-400">
                      {suggestionsProvider === "google" ? copy.googleSuggestions : copy.addressSuggestions}
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <label className="label">{copy.dueDateLabel}</label>
          <input className="input" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">{copy.locationNoteLabel}</label>
          <textarea
            className="input min-h-24"
            name="locationNote"
            placeholder={copy.locationNotePlaceholder}
            value={form.locationNote}
            onChange={handleChange}
          />
        </div>

        <input name="latitude" type="hidden" value={form.latitude} readOnly />
        <input name="longitude" type="hidden" value={form.longitude} readOnly />

        <div>
          <label className="label">{copy.radiusLabel}</label>
          <input className="input" min="1" name="radiusKm" type="number" value={form.radiusKm} onChange={handleChange} />
        </div>

        <div className="flex items-end">
          <button className="btn-secondary w-full" type="button" onClick={findAddressOnMap}>
            {copy.findPoint}
          </button>
        </div>

        <div className="flex items-end">
          <button className="btn-secondary w-full" type="button" onClick={fillCurrentLocation}>
            {copy.useLocation}
          </button>
        </div>

        {locationInfo ? <p className="sm:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{locationInfo}</p> : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 sm:p-5">
            <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">04</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">{copy.optionsStep}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy.optionsText}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
          <input checked={form.isUrgent} name="isUrgent" type="checkbox" onChange={handleChange} />
          {copy.urgent}
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
          <input checked={form.escrowRequired} name="escrowRequired" type="checkbox" onChange={handleChange} />
          {copy.escrow}
        </label>
            </div>
          </div>

        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[26px] border border-[#ead3d9] bg-white/95 p-3 shadow-[0_22px_70px_-40px_rgba(56,18,30,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="px-2 text-sm font-semibold text-slate-600">{isVacancy ? copy.vacancyTypeText : copy.orderTypeText}</p>
          <button className="btn-primary w-full sm:w-auto" disabled={loading} type="submit">
          {loading
            ? isVacancy
              ? copy.submittingVacancy
              : copy.submitting
            : isVacancy
              ? copy.submitVacancy
              : copy.submit}
          </button>
        </div>
      </form>
      </div>
    </section>
  );
}

export default CreateJobPage;

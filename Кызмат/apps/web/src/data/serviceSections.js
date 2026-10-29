import { translateCategoryName } from "../i18n/contentTranslations";

export const allServiceSectionsLabel = "Все разделы";

const allServiceSectionsByLanguage = {
  ru: "Все разделы",
  ky: "Бардык бөлүмдөр",
  en: "All sections",
};

export const serviceSections = [
  {
    key: "repair",
    label: "Ремонт и строительство",
    labelRu: "Ремонт и строительство",
    labelKy: "Оңдоо жана курулуш",
    labelEn: "Repair and construction",
    matchers: ["ремонт", "строительство", "отделочные", "сантехника", "электрика", "плиточные", "столярные", "плотницкие", "сварка", "кровельные", "фасадные", "окна и двери", "установка и ремонт техники", "сборка мебели", "проектирование и дизайн"],
  },
  {
    key: "home",
    label: "Услуги по дому",
    labelRu: "Услуги по дому",
    labelKy: "Үй кызматтары",
    labelEn: "Home services",
    matchers: ["уборка", "генеральная уборка", "мытье окон", "глажка", "стирка", "домработницы", "сиделки", "няни", "помощь по хозяйству"],
  },
  {
    key: "beauty",
    label: "Красота и здоровье",
    labelRu: "Красота и здоровье",
    labelKy: "Сулуулук жана ден соолук",
    labelEn: "Beauty and wellness",
    matchers: ["маникюр", "педикюр", "парикмахерские", "косметология", "массаж", "визаж", "эпиляция", "татуаж", "спа"],
  },
  {
    key: "education",
    label: "Репетиторы и обучение",
    labelRu: "Репетиторы и обучение",
    labelKy: "Репетиторлор жана окутуу",
    labelEn: "Tutors and education",
    matchers: ["репетиторы", "школьные предметы", "иностранные языки", "подготовка к экзаменам", "музыка", "танцы", "профессиональные курсы", "онлайн-обучение", "обучение программированию"],
  },
  {
    key: "it",
    label: "IT, фриланс и онлайн-услуги",
    labelRu: "IT, фриланс и онлайн-услуги",
    labelKy: "IT, фриланс жана онлайн кызматтар",
    labelEn: "IT, freelance and online services",
    matchers: ["it", "программирование", "создание сайтов", "дизайн (графический и веб)", "копирайтинг", "маркетинг", "реклама", "seo", "администрирование", "тестирование по", "crm", "nfc", "bim", "cad", "радиостанций"],
  },
  {
    key: "legal",
    label: "Юридические и финансовые услуги",
    labelRu: "Юридические и финансовые услуги",
    labelKy: "Юридикалык жана каржылык кызматтар",
    labelEn: "Legal and financial services",
    matchers: ["юристы", "адвокаты", "составление документов", "бухгалтерия", "налоги", "страхование", "консультации по бизнесу"],
  },
  {
    key: "auto",
    label: "Автоуслуги",
    labelRu: "Автоуслуги",
    labelKy: "Авто кызматтар",
    labelEn: "Auto services",
    matchers: ["автоинструкторы", "ремонт автомобилей", "диагностика авто", "шиномонтаж", "тюнинг", "помощь на дороге"],
  },
  {
    key: "logistics",
    label: "Перевозки и курьеры",
    labelRu: "Перевозки и курьеры",
    labelKy: "Жеткирүү жана ташуу",
    labelEn: "Logistics and couriers",
    matchers: ["доставка", "курьерская доставка", "грузоперевозки", "переезды", "грузчики", "перевозка мебели", "доставка еды"],
  },
  {
    key: "pets",
    label: "Услуги для животных",
    labelRu: "Услуги для животных",
    labelKy: "Жаныбарлар үчүн кызматтар",
    labelEn: "Pet services",
    matchers: ["выгул собак", "передержка животных", "груминг", "дрессировка", "ветеринарные"],
  },
  {
    key: "sport",
    label: "Спорт и тренеры",
    labelRu: "Спорт и тренеры",
    labelKy: "Спорт жана машыктыруучулар",
    labelEn: "Sports and trainers",
    matchers: ["персональные тренеры", "фитнес", "йога", "единоборства", "реабилитация", "лфк"],
  },
  {
    key: "psychology",
    label: "Психология и коучинг",
    labelRu: "Психология и коучинг",
    labelKy: "Психология жана коучинг",
    labelEn: "Psychology and coaching",
    matchers: ["психологи", "психотерапевты", "коучи", "профориентация"],
  },
  {
    key: "events",
    label: "Праздники и мероприятия",
    labelRu: "Праздники и мероприятия",
    labelKy: "Майрамдар жана иш-чаралар",
    labelEn: "Events and entertainment",
    matchers: ["ведущие", "аниматоры", "музыканты для мероприятий", "диджеи", "фотографы", "видеографы", "оформление мероприятий"],
  },
  {
    key: "creative",
    label: "Творчество и хобби",
    labelRu: "Творчество и хобби",
    labelKy: "Чыгармачылык жана хобби",
    labelEn: "Creative and hobbies",
    matchers: ["художники", "дизайнеры", "рукоделие", "изготовление на заказ"],
  },
  {
    key: "clothing",
    label: "Пошив и ремонт одежды",
    labelRu: "Пошив и ремонт одежды",
    labelKy: "Кийим тигүү жана оңдоо",
    labelEn: "Tailoring and clothing repair",
    matchers: ["пошив одежды", "ремонт одежды", "ателье", "дизайн одежды"],
  },
  {
    key: "business",
    label: "Бизнес и услуги для компаний",
    labelRu: "Бизнес и услуги для компаний",
    labelKy: "Бизнес жана компанияларга кызматтар",
    labelEn: "Business services",
    matchers: ["подбор персонала", "консалтинг", "тендеры", "автоматизация бизнеса", "crm и it-внедрение"],
  },
  {
    key: "security",
    label: "Безопасность и системы",
    labelRu: "Безопасность и системы",
    labelKy: "Коопсуздук жана системалар",
    labelEn: "Security and systems",
    matchers: ["установка сигнализации", "видеонаблюдение", "пожарная безопасность", "контроль доступа"],
  },
  {
    key: "niche",
    label: "Узкоспециализированные услуги",
    labelRu: "Узкоспециализированные услуги",
    labelKy: "Тар адистешкен кызматтар",
    labelEn: "Niche services",
    matchers: ["настройка телескопов", "программирование радиостанций", "nfc-метки", "аромадиффузоры", "bim и cad", "производство изделий"],
  },
];

const otherSectionLabels = {
  ru: "Другие услуги",
  ky: "Башка кызматтар",
  en: "Other services",
};

const sectionMatchPriority = {
  home: 1,
  beauty: 2,
  education: 3,
  legal: 4,
  auto: 5,
  logistics: 6,
  pets: 7,
  business: 8,
  clothing: 9,
  sport: 10,
  psychology: 11,
  events: 12,
  creative: 13,
  security: 14,
  niche: 15,
  repair: 16,
  it: 17,
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function getAllServiceSectionsLabel(language = "ru") {
  return allServiceSectionsByLanguage[language] || allServiceSectionsByLanguage.ru;
}

export function getLocalizedText(ru, ky, en, language = "ru") {
  if (language === "ky") return ky;
  if (language === "en") return en;
  return ru;
}

export function getServiceSectionByKey(sectionKey) {
  return serviceSections.find((section) => section.key === sectionKey) || null;
}

export function getServiceSectionLabel(sectionOrKey, language = "ru") {
  const section = typeof sectionOrKey === "string" ? getServiceSectionByKey(sectionOrKey) : sectionOrKey;
  if (!section) return "";
  if (language === "ky") return section.labelKy || section.label;
  if (language === "en") return section.labelEn || section.label;
  return section.labelRu || section.label;
}

export function findServiceSectionByCategoryName(categoryName) {
  const normalizedName = normalize(categoryName);
  if (!normalizedName) return null;

  const matches = serviceSections.filter((section) =>
    section.matchers.some((matcher) => normalizedName.includes(normalize(matcher))),
  );

  if (!matches.length) return null;

  return matches.sort((left, right) => {
    const leftPriority = sectionMatchPriority[left.key] ?? 999;
    const rightPriority = sectionMatchPriority[right.key] ?? 999;
    return leftPriority - rightPriority;
  })[0];
}

export function categoryMatchesSection(category, sectionKey) {
  if (!sectionKey) return true;
  return findServiceSectionByCategoryName(category?.name || category)?.key === sectionKey;
}

export function filterCategoriesBySection(categories, sectionKey) {
  return (categories || []).filter((category) => categoryMatchesSection(category, sectionKey));
}

export function buildCategoryGroups(categories, language = "ru") {
  const groups = new Map();

  serviceSections.forEach((section) => {
    groups.set(section.key, {
      key: section.key,
      label: getServiceSectionLabel(section, language),
      labelRu: section.labelRu,
      labelKy: section.labelKy,
      labelEn: section.labelEn,
      categories: [],
    });
  });

  const otherGroup = {
    key: "other",
    label: otherSectionLabels[language] || otherSectionLabels.ru,
    labelRu: otherSectionLabels.ru,
    labelKy: otherSectionLabels.ky,
    labelEn: otherSectionLabels.en,
    categories: [],
  };

  (categories || []).forEach((category) => {
    const localizedCategory = {
      ...category,
      displayName: translateCategoryName(category.name, language),
    };
    const matchedSection = findServiceSectionByCategoryName(category.name);
    if (matchedSection) {
      groups.get(matchedSection.key)?.categories.push(localizedCategory);
      return;
    }
    otherGroup.categories.push(localizedCategory);
  });

  const orderedGroups = [...groups.values()].filter((group) => group.categories.length > 0);
  if (otherGroup.categories.length > 0) orderedGroups.push(otherGroup);
  return orderedGroups;
}

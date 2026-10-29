const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./pool");
const { serializeWorkerResume } = require("../utils/worker-resume");
const { env } = require("../config/env");

const DEMO_PASSWORD = "пароль1234";
const SUBSCRIPTION_DURATION_DAYS = 30;
const EFFECTIVE_DEMO_PASSWORD = env.demoSeedPassword || DEMO_PASSWORD;
const CREDENTIALS_LOG_PATH = path.resolve(__dirname, "../../../../logs/dev-demo-accounts.json");
const demoCategoryNames = [
  "ремонт",
  "ремонт квартир и домов",
  "отделочные работы",
  "сантехника",
  "электрика",
  "плиточные работы",
  "столярные и плотницкие работы",
  "сварка",
  "кровельные работы",
  "фасадные работы",
  "окна и двери",
  "установка и ремонт техники",
  "сборка мебели",
  "проектирование и дизайн",
  "уборка",
  "уборка квартир и домов",
  "генеральная уборка",
  "мытье окон",
  "глажка и стирка",
  "домработницы",
  "сиделки",
  "няни",
  "помощь по хозяйству",
  "маникюр и педикюр",
  "парикмахерские услуги",
  "косметология",
  "массаж",
  "визаж",
  "эпиляция",
  "татуаж",
  "спа-процедуры",
  "доставка",
  "переезды",
  "IT",
  "дизайн",
  "репетиторы",
  "строительство",
  "школьные предметы",
  "иностранные языки",
  "подготовка к экзаменам",
  "музыка",
  "танцы",
  "профессиональные курсы",
  "онлайн-обучение",
  "обучение программированию",
  "программирование",
  "создание сайтов",
  "дизайн (графический и веб)",
  "копирайтинг и тексты",
  "маркетинг и реклама",
  "SEO",
  "администрирование",
  "тестирование ПО",
  "юристы",
  "адвокаты",
  "составление документов",
  "бухгалтерия",
  "налоги и отчетность",
  "консультации по бизнесу",
  "страхование",
  "автоинструкторы",
  "ремонт автомобилей",
  "диагностика авто",
  "шиномонтаж",
  "тюнинг",
  "помощь на дороге",
  "курьерская доставка",
  "грузоперевозки",
  "грузчики",
  "перевозка мебели",
  "доставка еды и товаров",
  "выгул собак",
  "передержка животных",
  "груминг",
  "дрессировка",
  "ветеринарные услуги",
  "персональные тренеры",
  "фитнес",
  "йога",
  "единоборства",
  "реабилитация",
  "ЛФК",
  "психологи",
  "психотерапевты",
  "коучи",
  "профориентация",
  "ведущие",
  "аниматоры",
  "музыканты для мероприятий",
  "диджеи",
  "фотографы",
  "видеографы",
  "оформление мероприятий",
  "художники",
  "дизайнеры",
  "рукоделие",
  "изготовление на заказ",
  "пошив одежды",
  "ремонт одежды",
  "ателье",
  "дизайн одежды",
  "подбор персонала",
  "консалтинг",
  "тендеры",
  "автоматизация бизнеса",
  "CRM и IT-внедрение",
  "установка сигнализации",
  "видеонаблюдение",
  "пожарная безопасность",
  "контроль доступа",
  "настройка телескопов",
  "программирование радиостанций",
  "NFC-метки",
  "аромадиффузоры",
  "BIM и CAD",
  "производство изделий",
];

const demoUsers = [
  {
    key: "customer-main",
    role: "customer",
    username: "заказчик",
    email: "customer.demo@kyzmat.local",
    phone: "+996700000101",
    fullName: "Айжан Сатыбалдиева",

    fullNameKy: "Айжан Сатыбалдиева",

    fullNameEn: "Aizhan Satybaldieva",
    city: "Бишкек",
    bio: "Публикую бытовые и семейные задачи, тестирую сценарии заказчика на платформе.",
    skills: [],
  },
  {
    key: "customer-office",
    role: "customer",
    email: "customer.office@kyzmat.local",
    phone: "+996700000102",
    fullName: "Кубаныч Усенов",

    fullNameKy: "Кубаныч Усенов",

    fullNameEn: "Kubanych Usenov",
    city: "Бишкек",
    bio: "Размещаю заказы для офиса, коммерческих помещений и регулярного обслуживания.",
    skills: [],
  },
  {
    key: "customer-osh",
    role: "customer",
    email: "customer.osh@kyzmat.local",
    phone: "+996700000103",
    fullName: "Нуржамал Токторова",

    fullNameKy: "Нуржамал Токторова",

    fullNameEn: "Nurzhamal Toktorova",
    city: "Ош",
    bio: "Ищу исполнителей для ремонта, доставки и бытовых задач в южных регионах.",
    skills: [],
  },
  {
    key: "admin-main",
    role: "admin",
    username: "Админ",
    email: "admin.demo@kyzmat.local",
    phone: "+996700000104",
    fullName: "Айбек Админов",

    fullNameKy: "Айбек Админов",

    fullNameEn: "Aibek Adminov",
    city: "Бишкек",
    bio: "Следит за платформой, пользователями, качеством заказов и демонстрационными данными.",
    skills: ["модерация", "аналитика", "поддержка"],
  },
  {
    key: "worker-main",
    role: "worker",
    username: "исполнитель",
    email: "worker.demo@kyzmat.local",
    phone: "+996700000201",
    fullName: "Азамат Токторов",

    fullNameKy: "Азамат Токторов",

    fullNameEn: "Azamat Toktorov",
    city: "Бишкек",
    bio: "Сантехник и мастер по бытовому ремонту. Беру срочные выезды, замену смесителей, сборку мебели и мелкие домашние задачи.",
    skills: ["сантехника", "мелкий ремонт", "сборка мебели", "подключение техники"],
    workerResume: {
      headline: "Сантехник и мастер на выезд для квартир и небольших офисов",
      experienceYears: 6,
      serviceModes: ["выезд", "у клиента"],
      serviceAreas: ["Бишкек", "Чуйская область"],
      education: "Профильные курсы по сантехническому монтажу и бытовому ремонту.",
      achievements: "Более 300 бытовых заявок: течи, смесители, сифоны, раковины, навеска и сборка мебели.",
      languages: ["русский", "кыргызский"],
      availability: "Каждый день с 09:00 до 22:00, срочные выезды в тот же день.",
      pricingNote: "Диагностика входит в стоимость, мелкие расходники могу привезти с собой.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/azamat-toktorov"],
    },
  },
  {
    key: "worker-electric",
    role: "worker",
    username: "электрик",
    email: "worker.electric@kyzmat.local",
    phone: "+996700000202",
    fullName: "Руслан Жунушев",

    fullNameKy: "Руслан Жунушев",

    fullNameEn: "Ruslan Junushev",
    city: "Бишкек",
    bio: "Частный электрик: автоматы, розетки, светильники, поиск короткого замыкания и аварийные выезды по городу.",
    skills: ["электрика", "автоматы", "розетки", "освещение"],
    workerResume: {
      headline: "Электрик для квартир, офисов и срочных аварийных заявок",
      experienceYears: 8,
      serviceModes: ["выезд", "срочный выезд"],
      serviceAreas: ["Бишкек", "Кант", "Токмок"],
      education: "Электромонтажный колледж, регулярная практика по щиткам и внутренней проводке.",
      achievements: "Собрал и обслужил десятки квартирных щитов, устраняю проблемы с освещением и перегрузками.",
      languages: ["русский", "кыргызский"],
      availability: "С 08:00 до 23:00, аварийные заявки беру вне очереди.",
      pricingNote: "Перед началом работ озвучиваю смету и список материалов.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/ruslan-junushev"],
    },
  },
  {
    key: "worker-cleaning",
    role: "worker",
    username: "клининг",
    email: "worker.cleaning@kyzmat.local",
    phone: "+996700000203",
    fullName: "Айпери Осмонова",

    fullNameKy: "Айпери Осмонова",

    fullNameEn: "Aiperi Osmonova",
    city: "Бишкек",
    bio: "Клинер для квартир и офисов. Делаю генеральную уборку, уборку после ремонта и регулярное поддержание чистоты.",
    skills: ["уборка", "клининг", "генеральная уборка", "уборка после ремонта"],
    workerResume: {
      headline: "Клинер для квартир, офисов и уборки после ремонта",
      experienceYears: 5,
      serviceModes: ["выезд", "у клиента"],
      serviceAreas: ["Бишкек", "Чуйская область"],
      education: "Обучение по профессиональной бытовой химии и безопасной уборке поверхностей.",
      achievements: "Работала с квартирами, салонами и офисами до 200 м2, умею быстро подготавливать помещение к открытию.",
      languages: ["русский", "кыргызский"],
      availability: "Ежедневно с 08:00 до 20:00, крупные объекты по предварительной записи.",
      pricingNote: "Привожу свои средства и инвентарь, стоимость зависит от площади и степени загрязнения.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/aiperi-osmonova"],
    },
  },
  {
    key: "worker-courier",
    role: "worker",
    username: "курьер",
    email: "worker.courier@kyzmat.local",
    phone: "+996700000204",
    fullName: "Нурсултан Асанов",

    fullNameKy: "Нурсултан Асанов",

    fullNameEn: "Nursultan Asanov",
    city: "Бишкек",
    bio: "Курьер по городу: документы, покупки, срочные доставки, сопровождение небольших грузов и доставка в аэропорт.",
    skills: ["доставка", "курьер", "документы", "срочная доставка"],
    workerResume: {
      headline: "Городской курьер для срочных документов и небольших грузов",
      experienceYears: 4,
      serviceModes: ["выезд", "по городу"],
      serviceAreas: ["Бишкек", "Манас", "Чуйская область"],
      education: "Опыт работы в городской доставке и курьерских сервисах.",
      achievements: "Сопровождаю срочные документы, доставляю заказы день в день, работаю аккуратно с хрупкими покупками.",
      languages: ["русский", "кыргызский"],
      availability: "Каждый день с 07:30 до 23:30.",
      pricingNote: "Срочные заказы рассчитываю отдельно в зависимости от расстояния и времени.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/nursultan-asanov"],
    },
  },
  {
    key: "worker-it",
    role: "worker",
    username: "айти-мастер",
    email: "worker.it@kyzmat.local",
    phone: "+996700000205",
    fullName: "Эрмек Сыдыков",

    fullNameKy: "Эрмек Сыдыков",

    fullNameEn: "Ermek Sydykov",
    city: "Бишкек",
    bio: "Настраиваю Wi-Fi, роутеры, камеры, ноутбуки, принтеры и небольшую офисную IT-инфраструктуру.",
    skills: ["IT", "wifi", "принтеры", "камеры", "компьютеры"],
    workerResume: {
      headline: "IT-специалист для дома, малого бизнеса и офисов",
      experienceYears: 7,
      serviceModes: ["выезд", "онлайн", "у клиента"],
      serviceAreas: ["Бишкек", "онлайн по Кыргызстану"],
      education: "Высшее техническое образование, практика в сервисном и корпоративном IT.",
      achievements: "Настроил десятки офисных сетей, камер и рабочих мест, объясняю простым языком без лишней терминологии.",
      languages: ["русский", "кыргызский", "английский"],
      availability: "Будни с 09:00 до 21:00, онлайн-консультации и удаленное подключение вечером.",
      pricingNote: "Могу приехать со своим инструментом, при необходимости помогу подобрать технику.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/ermek-sydykov"],
    },
  },
  {
    key: "worker-finish",
    role: "worker",
    username: "отделочник",
    email: "worker.finish@kyzmat.local",
    phone: "+996700000206",
    fullName: "Мирлан Устаев",

    fullNameKy: "Мирлан Устаев",

    fullNameEn: "Mirlan Ustaev",
    city: "Ош",
    bio: "Отделочник по квартирам и домам: шпаклевка, покраска, ламинат, откосы и чистовые работы под ключ.",
    skills: ["отделка", "покраска", "ламинат", "строительство"],
    workerResume: {
      headline: "Отделочник для чистовых работ и локального ремонта",
      experienceYears: 9,
      serviceModes: ["выезд", "у клиента"],
      serviceAreas: ["Ош", "Ошская область", "Араван"],
      education: "Практический опыт в частных ремонтах и отделке жилых помещений.",
      achievements: "Веду объекты аккуратно и поэтапно: стены, потолок, пол, декоративные элементы и подготовка под сдачу.",
      languages: ["русский", "кыргызский"],
      availability: "С понедельника по субботу с 09:00 до 19:00.",
      pricingNote: "Составляю понятную смету и могу помочь с расчетом материалов.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/mirlan-ustaev"],
    },
  },
  {
    key: "worker-design",
    role: "worker",
    username: "дизайнер",
    email: "worker.design@kyzmat.local",
    phone: "+996700000207",
    fullName: "Камила Тургунова",

    fullNameKy: "Камила Тургунова",

    fullNameEn: "Kamila Turgunova",
    city: "Бишкек",
    bio: "Делаю лендинги, баннеры, меню, посты для соцсетей и упаковку визуала для малого бизнеса.",
    skills: ["дизайн", "баннеры", "лендинги", "соцсети", "айдентика"],
    workerResume: {
      headline: "Дизайнер для малого бизнеса, соцсетей и быстрых запусков",
      experienceYears: 6,
      serviceModes: ["онлайн", "у клиента"],
      serviceAreas: ["Бишкек", "онлайн по Кыргызстану"],
      education: "Курсы по графическому дизайну и web-лендингам, проектная работа с кофейнями и студиями.",
      achievements: "Помогаю быстро собрать понятный визуал: баннеры, прайсы, меню, лендинги и простую айдентику.",
      languages: ["русский", "кыргызский", "английский"],
      availability: "На связи ежедневно, правки обычно в тот же день.",
      pricingNote: "Фиксирую объем работ до старта, работаю по этапам и показываю промежуточные варианты.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/kamila-turgunova"],
    },
  },
  {
    key: "worker-tutor",
    role: "worker",
    username: "репетитор",
    email: "worker.tutor@kyzmat.local",
    phone: "+996700000208",
    fullName: "Гульзат Абдыкеримова",

    fullNameKy: "Гульзат Абдыкеримова",

    fullNameEn: "Gulzat Abdykerimova",
    city: "Каракол",
    bio: "Репетитор по математике и русскому языку. Провожу онлайн-уроки и занятия офлайн для школьников 5-11 классов.",
    skills: ["репетитор", "математика", "русский язык", "онлайн-занятия"],
    workerResume: {
      headline: "Репетитор для школьников: математика, русский язык, подготовка к контрольным",
      experienceYears: 10,
      serviceModes: ["онлайн", "у клиента"],
      serviceAreas: ["Каракол", "Иссык-Кульская область", "онлайн по Кыргызстану"],
      education: "Педагогическое образование, опыт в школе и индивидуальной подготовке.",
      achievements: "Помогаю подтянуть базу, подготовиться к экзаменам и выстроить спокойный учебный режим без перегруза.",
      languages: ["русский", "кыргызский"],
      availability: "По будням после 15:00 и по выходным.",
      pricingNote: "Первое короткое знакомство и оценка уровня бесплатно.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/gulzat-abdykerimova"],
    },
  },
  {
    key: "worker-mover",
    role: "worker",
    username: "грузчик",
    email: "worker.moving@kyzmat.local",
    phone: "+996700000209",
    fullName: "Бакыт Кенжебеков",

    fullNameKy: "Бакыт Кенжебеков",

    fullNameEn: "Bakyt Kenzhebekov",
    city: "Бишкек",
    bio: "Помогаю с переездами, разгрузкой, подъемом мебели и аккуратной перевозкой бытовых вещей по городу.",
    skills: ["переезд", "грузчик", "доставка", "подъем мебели"],
    workerResume: {
      headline: "Грузчик и помощник при переездах по Бишкеку",
      experienceYears: 5,
      serviceModes: ["выезд", "у клиента"],
      serviceAreas: ["Бишкек", "Чуйская область"],
      education: "Практика в квартирных и офисных переездах, помощь с упаковкой и заносом.",
      achievements: "Работаю аккуратно с мебелью и бытовой техникой, могу выехать с напарником.",
      languages: ["русский", "кыргызский"],
      availability: "Каждый день с 08:00 до 22:00.",
      pricingNote: "Стоимость зависит от этажа, объема и наличия лифта.",
      portfolioLinks: ["https://example.com/kyzmat/portfolio/bakyt-kenjebekov"],
    },
  },
];

const preparedDemoUsers = demoUsers.map((user) =>
  user.role === "worker"
    ? {
        ...user,
        avatarUrl: user.avatarUrl || "/images/avatars/worker-default.svg",
        workerResume: {
          ...(user.workerResume || {}),
          verificationStatus: user.workerResume?.verificationStatus || (user.isPro ? "top" : "verified"),
          verificationItems: user.workerResume?.verificationItems || [
            "Фото профиля загружено",
            "Телефон подтвержден",
            "Анкета заполнена",
          ],
          verificationNote:
            user.workerResume?.verificationNote ||
            "Профиль проверен командой KYZMAT: контакты заполнены, фото добавлено, анкета подробно оформлена.",
          responseTime: user.workerResume?.responseTime || "Обычно отвечает в течение 10-20 минут",
          portfolioHighlights: user.workerResume?.portfolioHighlights || [
            "Показывает примеры похожих работ до начала заказа",
            "Согласовывает объем и стоимость заранее",
            "Поддерживает связь с клиентом до завершения заказа",
          ],
        },
      }
    : user,
);

const demoJobs = [
  {
    key: "sink-leak",
    customerKey: "customer-main",
    categoryName: "ремонт",
    title: "Устранить течь под кухонной мойкой",
    description:
      "Под мойкой капает соединение, иногда появляется неприятный запах. Нужна диагностика, замена гибкой подводки или сифона и аккуратная герметизация.",
    budget: 3500,
    city: "Бишкек",
    dueInDays: 1,
    isUrgent: true,
    radiusKm: 8,
    responses: [
      {
        workerKey: "worker-main",
        proposedPrice: 3200,
        etaDays: 1,
        message: "Подъеду сегодня вечером с инструментом и сразу привезу базовые расходники.",
      },
      {
        workerKey: "worker-electric",
        proposedPrice: 3600,
        etaDays: 1,
        message: "Могу приехать завтра утром, если нужен допосмотр кухни и коммуникаций.",
      },
    ],
    selectedWorkerKey: "worker-main",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-main",
        rating: 5,
        comment: "Приехал быстро, все объяснил и устранил течь за один визит.",
      },
    ],
  },
  {
    key: "office-cleaning",
    customerKey: "customer-office",
    categoryName: "уборка",
    title: "Генеральная уборка офиса 90 м2",
    description:
      "Нужна уборка после рабочей недели: полы, санузел, кухонная зона, пыль на поверхностях и стеклянные перегородки. Лучше выехать утром.",
    budget: 7500,
    city: "Бишкек",
    dueInDays: 2,
    radiusKm: 12,
    responses: [
      {
        workerKey: "worker-cleaning",
        proposedPrice: 7200,
        etaDays: 1,
        message: "Приеду со своими средствами, могу вывести двух человек на объект.",
      },
      {
        workerKey: "worker-main",
        proposedPrice: 7600,
        etaDays: 1,
        message: "Помогу, если нужен выезд в ближайшее утро.",
      },
    ],
    selectedWorkerKey: "worker-cleaning",
    finalStatus: "in_progress",
  },
  {
    key: "apartment-cleaning",
    customerKey: "customer-main",
    categoryName: "уборка",
    title: "Генеральная уборка квартиры 64 м2",
    description:
      "Нужна влажная уборка всех комнат, кухня и санузел, пыль на поверхностях, мойка полов и базовая уборка после небольшой перестановки.",
    budget: 4800,
    city: "Бишкек",
    dueInDays: 1,
    radiusKm: 10,
    responses: [
      {
        workerKey: "worker-cleaning",
        proposedPrice: 4500,
        etaDays: 1,
        message: "Свободна завтра с утра, приеду со своими средствами и инвентарем.",
      },
      {
        workerKey: "worker-main",
        proposedPrice: 4900,
        etaDays: 1,
        message: "Могу помочь, если нужен выезд в тот же день.",
      },
    ],
    selectedWorkerKey: "worker-cleaning",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-cleaning",
        rating: 5,
        comment: "Очень аккуратно убрала квартиру и приехала вовремя со всем своим.",
      },
    ],
  },
  {
    key: "airport-delivery",
    customerKey: "customer-main",
    categoryName: "доставка",
    title: "Срочно доставить документы в аэропорт Манас",
    description:
      "Нужно забрать папку в центре Бишкека и отвезти в аэропорт в течение двух часов. Документы важные, нужен аккуратный и быстрый курьер.",
    budget: 1800,
    city: "Бишкек",
    dueInDays: 0,
    isUrgent: true,
    radiusKm: 20,
    responses: [
      {
        workerKey: "worker-courier",
        proposedPrice: 1700,
        etaDays: 1,
        message: "Готов выехать сразу после подтверждения, хорошо знаю маршрут до аэропорта.",
      },
      {
        workerKey: "worker-mover",
        proposedPrice: 2000,
        etaDays: 1,
        message: "Могу забрать документы по пути на другой заказ и быстро доставить.",
      },
    ],
    selectedWorkerKey: "worker-courier",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-courier",
        rating: 5,
        comment: "Доставил вовремя и сразу прислал подтверждение получения.",
      },
    ],
  },
  {
    key: "wifi-office",
    customerKey: "customer-office",
    categoryName: "IT",
    title: "Настроить Wi-Fi и принтер в небольшом офисе",
    description:
      "Интернет работает нестабильно, еще нужно подключить сетевой принтер на несколько ноутбуков и показать, как дальше им пользоваться.",
    budget: 4200,
    city: "Бишкек",
    dueInDays: 3,
    radiusKm: 7,
    responses: [
      {
        workerKey: "worker-it",
        proposedPrice: 4000,
        etaDays: 1,
        message: "За один выезд настрою роутер, принтер и проверю скорость по кабинетам.",
      },
    ],
    selectedWorkerKey: "worker-it",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-office",
        revieweeKey: "worker-it",
        rating: 5,
        comment: "Все настроил понятно и без лишней суеты, интернет перестал падать.",
      },
    ],
  },
  {
    key: "wall-finish",
    customerKey: "customer-osh",
    categoryName: "строительство",
    title: "Подготовить стены и покрасить комнату 18 м2",
    description:
      "Нужно прошпаклевать стены после снятия старых обоев и покрасить комнату в светлый бежевый цвет. Материалы частично уже есть.",
    budget: 24000,
    city: "Ош",
    dueInDays: 5,
    radiusKm: 15,
    responses: [
      {
        workerKey: "worker-finish",
        proposedPrice: 22500,
        etaDays: 4,
        message: "Могу приехать на замер, помогу досчитать материалы и начну на этой неделе.",
      },
    ],
    selectedWorkerKey: "worker-finish",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-osh",
        revieweeKey: "worker-finish",
        rating: 4,
        comment: "Сделал аккуратно, уложился в сроки и помог с расчетом материалов.",
      },
    ],
  },
  {
    key: "landing-design",
    customerKey: "customer-main",
    categoryName: "IT",
    title: "Сделать лендинг для кофейни",
    description:
      "Нужен аккуратный одностраничный сайт: меню, адрес, форма заявки, карта и несколько баннеров для запуска рекламы.",
    budget: 20000,
    city: "Бишкек",
    dueInDays: 7,
    radiusKm: 30,
    responses: [
      {
        workerKey: "worker-design",
        proposedPrice: 18500,
        etaDays: 5,
        message: "Сделаю дизайн, адаптивный лендинг и подготовлю графику для соцсетей.",
      },
      {
        workerKey: "worker-it",
        proposedPrice: 19000,
        etaDays: 6,
        message: "Могу закрыть верстку и базовую интеграцию формы заявки.",
      },
    ],
    selectedWorkerKey: "worker-design",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-design",
        rating: 5,
        comment: "Сильный визуал и понятный процесс работы, все правки внесла быстро.",
      },
    ],
  },
  {
    key: "move-apartment",
    customerKey: "customer-office",
    categoryName: "доставка",
    title: "Помочь с квартирным переездом в пределах города",
    description:
      "Нужно вынести коробки, диван и пару шкафов, аккуратно перевезти и поднять на третий этаж. Лифт есть только в новом доме.",
    budget: 6500,
    city: "Бишкек",
    dueInDays: 3,
    radiusKm: 10,
    responses: [
      {
        workerKey: "worker-mover",
        proposedPrice: 6200,
        etaDays: 1,
        message: "Приеду с напарником, быстро погрузим и занесем без повреждений.",
      },
      {
        workerKey: "worker-courier",
        proposedPrice: 7000,
        etaDays: 1,
        message: "Могу помочь с небольшим переездом и координацией по маршруту.",
      },
    ],
    selectedWorkerKey: "worker-mover",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-office",
        revieweeKey: "worker-mover",
        rating: 5,
        comment: "Очень аккуратно перенесли мебель и уложились быстрее, чем ожидали.",
      },
    ],
  },
  {
    key: "electric-panel",
    customerKey: "customer-main",
    categoryName: "ремонт",
    title: "Заменить автоматы и проверить щиток",
    description:
      "В квартире периодически выбивает автомат при включении бытовой техники. Нужен мастер, который проверит нагрузку и заменит автоматы при необходимости.",
    budget: 6000,
    city: "Бишкек",
    dueInDays: 2,
    radiusKm: 8,
    responses: [
      {
        workerKey: "worker-electric",
        proposedPrice: 5700,
        etaDays: 1,
        message: "Проверю щиток, распределю нагрузку и при необходимости сразу заменю автоматы.",
      },
      {
        workerKey: "worker-main",
        proposedPrice: 6100,
        etaDays: 1,
        message: "Могу посмотреть сегодня, если потребуется замена, помогу купить комплектующие.",
      },
    ],
    selectedWorkerKey: "worker-electric",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-electric",
        rating: 5,
        comment: "Разобрался с проблемой в щитке и подробно объяснил, что было не так.",
      },
    ],
  },
  {
    key: "plumbing-bathroom",
    customerKey: "customer-office",
    categoryName: "сантехника",
    title: "Заменить смеситель и проверить давление воды",
    description:
      "В ванной течет старый смеситель, а напор воды стал слабее. Нужен мастер, который снимет старый смеситель, поставит новый и проверит соединения.",
    budget: 5200,
    city: "Бишкек",
    dueInDays: 2,
    radiusKm: 8,
    responses: [
      {
        workerKey: "worker-main",
        proposedPrice: 4800,
        etaDays: 1,
        message: "Могу приехать завтра, заменить смеситель и проверить подводку с давлением.",
      },
    ],
    selectedWorkerKey: "worker-main",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-office",
        revieweeKey: "worker-main",
        rating: 5,
        comment: "Сделал аккуратно, проверил соединения и подсказал по напору воды.",
      },
    ],
  },
  {
    key: "electric-lighting",
    customerKey: "customer-main",
    categoryName: "электрика",
    title: "Установить люстру и заменить две розетки",
    description:
      "После ремонта нужно повесить люстру в гостиной и заменить две старые розетки. Нужен аккуратный мастер с инструментом.",
    budget: 4300,
    city: "Бишкек",
    dueInDays: 1,
    radiusKm: 7,
    responses: [
      {
        workerKey: "worker-electric",
        proposedPrice: 4100,
        etaDays: 1,
        message: "Сделаю за один визит, проверю крепление и безопасность после монтажа.",
      },
    ],
    selectedWorkerKey: "worker-electric",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-electric",
        rating: 5,
        comment: "Все поставил ровно и быстро, после работы оставил порядок.",
      },
    ],
  },
  {
    key: "tutor-math",
    customerKey: "customer-osh",
    categoryName: "репетиторы",
    title: "Нужен репетитор по математике для 8 класса",
    description:
      "Ищу спокойного преподавателя для регулярных занятий два раза в неделю. Нужно подтянуть алгебру и геометрию, можно онлайн.",
    budget: 6000,
    city: "Каракол",
    dueInDays: 3,
    radiusKm: 30,
    responses: [
      {
        workerKey: "worker-tutor",
        proposedPrice: 5800,
        etaDays: 1,
        message: "Проведу вводное занятие, оценю уровень и составлю понятный план занятий.",
      },
    ],
    selectedWorkerKey: "worker-tutor",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-osh",
        revieweeKey: "worker-tutor",
        rating: 5,
        comment: "Очень спокойно объясняет и быстро нашла подход к ребенку.",
      },
    ],
  },
  {
    key: "design-menu",
    customerKey: "customer-office",
    categoryName: "дизайн",
    title: "Сделать меню и баннеры для кофейни",
    description:
      "Нужен дизайнер для обновления меню, баннера у входа и нескольких сторис-макетов для Instagram. Стиль уже примерно понятен.",
    budget: 12000,
    city: "Бишкек",
    dueInDays: 4,
    radiusKm: 20,
    responses: [
      {
        workerKey: "worker-design",
        proposedPrice: 11500,
        etaDays: 3,
        message: "Подготовлю визуальную концепцию, меню, печатный баннер и макеты для соцсетей.",
      },
    ],
    selectedWorkerKey: "worker-design",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-office",
        revieweeKey: "worker-design",
        rating: 5,
        comment: "Получился очень чистый и стильный дизайн, все файлы отдала удобно и вовремя.",
      },
    ],
  },
  {
    key: "moving-house",
    customerKey: "customer-main",
    categoryName: "переезды",
    title: "Нужна помощь с переездом двух комнат",
    description:
      "Нужно вынести коробки, стол, комод и детскую кровать, перевезти по городу и поднять на второй этаж. Нужны крепкие ребята и аккуратность.",
    budget: 9000,
    city: "Бишкек",
    dueInDays: 2,
    radiusKm: 12,
    responses: [
      {
        workerKey: "worker-mover",
        proposedPrice: 8500,
        etaDays: 1,
        message: "Организую переезд с напарником, аккуратно погрузим и занесем мебель по новому адресу.",
      },
    ],
    selectedWorkerKey: "worker-mover",
    finalStatus: "completed",
    reviews: [
      {
        reviewerKey: "customer-main",
        revieweeKey: "worker-mover",
        rating: 5,
        comment: "Очень спокойно и бережно перевезли вещи, ничего не повредили.",
      },
    ],
  },
];
const demoSubscriptions = [
  { userKey: "customer-main", planSlug: "customer-business-monthly" },
  { userKey: "worker-main", planSlug: "worker-pro-monthly" },
  { userKey: "worker-electric", planSlug: "worker-pro-quarterly" },
  { userKey: "worker-cleaning", planSlug: "worker-pro-monthly" },
  { userKey: "worker-it", planSlug: "worker-pro-monthly" },
  { userKey: "worker-design", planSlug: "worker-pro-quarterly" },
];

const demoServiceOrders = [
  {
    userKey: "worker-main",
    serviceSlug: "worker-profile-boost",
    note: "Демо-продвижение профиля специалиста",
    status: "completed",
  },
  {
    userKey: "worker-electric",
    serviceSlug: "worker-priority-response",
    note: "Приоритетный отклик на заявку по электрике",
    status: "ordered",
  },
  {
    userKey: "customer-main",
    serviceSlug: "customer-urgent-promo",
    note: "Продвижение срочной бытовой заявки",
    status: "completed",
  },
  {
    userKey: "customer-main",
    serviceSlug: "priority-support",
    note: "Доступ к ускоренной поддержке по подписке",
    status: "ordered",
  },
];

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

async function getRoleIds() {
  const result = await pool.query("SELECT id, name FROM roles");
  return result.rows.reduce((accumulator, row) => {
    accumulator[row.name] = row.id;
    return accumulator;
  }, {});
}

async function ensureDemoCategories() {
  for (const name of demoCategoryNames) {
    await pool.query(
      `INSERT INTO categories(name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING`,
      [name],
    );
  }
}

async function getCategories() {
  const result = await pool.query("SELECT id, name FROM categories");
  return result.rows.reduce((accumulator, row) => {
    accumulator[row.name.toLowerCase()] = row.id;
    return accumulator;
  }, {});
}

async function ensureDemoUser(user, roleIds, passwordHash) {
  const normalizedEmail = user.email ? user.email.toLowerCase() : null;
  const normalizedUsername = user.username ? user.username.trim().toLowerCase() : null;
  const serializedResume =
    user.role === "worker"
      ? serializeWorkerResume(user.workerResume)
      : serializeWorkerResume();
  const avatarUrl = user.avatarUrl || null;

  const existingResult = await pool.query(
    `SELECT u.id
     FROM users u
     WHERE LOWER(COALESCE(u.email, '')) = LOWER($1)
        OR LOWER(COALESCE(u.username, '')) = LOWER($2)
        OR ($3::text IS NOT NULL AND u.phone = $3::text)
     LIMIT 1`,
    [normalizedEmail || "", normalizedUsername || "", user.phone || null],
  );

  if (existingResult.rowCount) {
    const updatedResult = await pool.query(
      `UPDATE users
       SET role_id = $1,
           full_name = $2,
           full_name_ky = $3,
           full_name_en = $4,
           username = $5,
           email = $6,
           phone = $7,
           password_hash = $8,
           city = $9,
           bio = $10,
           avatar_url = $11,
           skills = $12,
           worker_resume = $13,
           is_pro = FALSE,
           updated_at = NOW()
       WHERE id = $14
       RETURNING id, email, phone, username, full_name, full_name_ky, full_name_en, city`,
      [
        roleIds[user.role],
        user.fullName,
        user.fullNameKy || null,
        user.fullNameEn || null,
        normalizedUsername,
        normalizedEmail,
        user.phone || null,
        passwordHash,
        user.city || null,
        user.bio || null,
        avatarUrl,
        user.skills || [],
        serializedResume,
        existingResult.rows[0].id,
      ],
    );

    return updatedResult.rows[0];
  }

  const insertedResult = await pool.query(
    `INSERT INTO users (
      role_id,
      full_name,
      full_name_ky,
      full_name_en,
      username,
      email,
      phone,
      password_hash,
      city,
      bio,
      avatar_url,
      skills,
      worker_resume,
      is_pro
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, FALSE)
    RETURNING id, email, phone, username, full_name, full_name_ky, full_name_en, city`,
    [
      roleIds[user.role],
      user.fullName,
      user.fullNameKy || null,
      user.fullNameEn || null,
      normalizedUsername,
      normalizedEmail,
      user.phone || null,
      passwordHash,
      user.city || null,
      user.bio || null,
      avatarUrl,
      user.skills || [],
      serializedResume,
    ],
  );

  return insertedResult.rows[0];
}

function buildDemoAddress(city) {
  const normalizedCity = String(city || "").trim().toLowerCase();

  if (normalizedCity === "бишкек") {
    return "проспект Чуй, 127";
  }

  if (normalizedCity === "ош") {
    return "улица Ленина, 312";
  }

  if (normalizedCity === "каракол") {
    return "улица Токтогула, 271";
  }

  return `${city}, центральная улица, 15`;
}

function buildDemoLocationNote(job) {
  return job.locationNote || "Подъезд и точный ориентир заказчик уточнит в чате.";
}

async function ensureDemoJob(job, userIdsByKey, categoriesByName) {
  const categoryId = categoriesByName[job.categoryName.toLowerCase()];
  if (!categoryId) {
    throw new Error(`Category not found for demo seed: ${job.categoryName}`);
  }

  const selectedWorkerId =
    job.selectedWorkerKey && job.finalStatus !== "open" ? userIdsByKey[job.selectedWorkerKey] : null;
  const dueDate = addDays(new Date(), job.dueInDays ?? 0).toISOString().slice(0, 10);
  const address = job.address || buildDemoAddress(job.city);
  const locationNote = buildDemoLocationNote(job);

  const existingResult = await pool.query(
    `SELECT id
     FROM jobs
     WHERE customer_id = $1 AND title = $2
     LIMIT 1`,
    [userIdsByKey[job.customerKey], job.title],
  );

  if (existingResult.rowCount) {
    const updatedResult = await pool.query(
      `UPDATE jobs
       SET worker_id = $1,
           category_id = $2,
           title = $3,
           description = $4,
           budget = $5,
           city = $6,
           address = $7,
           location_note = $8,
           due_date = $9,
           radius_km = $10,
           is_urgent = $11,
           status = $12,
           escrow_status = 'not_required',
           updated_at = NOW()
       WHERE id = $13
       RETURNING id`,
      [
        selectedWorkerId,
        categoryId,
        job.title,
        job.description,
        job.budget,
        job.city,
        address,
        locationNote,
        dueDate,
        job.radiusKm || null,
        Boolean(job.isUrgent),
        job.finalStatus || "open",
        existingResult.rows[0].id,
      ],
    );

    return updatedResult.rows[0].id;
  }

  const insertedResult = await pool.query(
    `INSERT INTO jobs (
      customer_id,
      worker_id,
      category_id,
      title,
      description,
      budget,
      city,
      address,
      location_note,
      due_date,
      radius_km,
      is_urgent,
      status,
      escrow_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'not_required')
    RETURNING id`,
    [
      userIdsByKey[job.customerKey],
      selectedWorkerId,
      categoryId,
      job.title,
      job.description,
      job.budget,
      job.city,
      address,
      locationNote,
      dueDate,
      job.radiusKm || null,
      Boolean(job.isUrgent),
      job.finalStatus || "open",
    ],
  );

  return insertedResult.rows[0].id;
}

async function ensureDemoResponse(jobId, response, selectedWorkerId) {
  const workerId = response.workerId;
  const nextStatus =
    selectedWorkerId && workerId === selectedWorkerId
      ? "accepted"
      : selectedWorkerId
        ? "rejected"
        : "pending";

  const existingResult = await pool.query(
    `SELECT id
     FROM responses
     WHERE job_id = $1 AND worker_id = $2
     LIMIT 1`,
    [jobId, workerId],
  );

  if (existingResult.rowCount) {
    await pool.query(
      `UPDATE responses
       SET message = $1,
           proposed_price = $2,
           eta_days = $3,
           status = $4
       WHERE id = $5`,
      [
        response.message || null,
        response.proposedPrice,
        response.etaDays || null,
        nextStatus,
        existingResult.rows[0].id,
      ],
    );
    return;
  }

  await pool.query(
    `INSERT INTO responses (job_id, worker_id, message, proposed_price, eta_days, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      jobId,
      workerId,
      response.message || null,
      response.proposedPrice,
      response.etaDays || null,
      nextStatus,
    ],
  );
}

async function ensureDemoReview(jobId, review) {
  const existingResult = await pool.query(
    `SELECT id
     FROM reviews
     WHERE job_id = $1 AND reviewer_id = $2
     LIMIT 1`,
    [jobId, review.reviewerId],
  );

  if (existingResult.rowCount) {
    await pool.query(
      `UPDATE reviews
       SET reviewee_id = $1,
           rating = $2,
           comment = $3,
           created_at = NOW()
       WHERE id = $4`,
      [review.revieweeId, review.rating, review.comment || null, existingResult.rows[0].id],
    );
    return;
  }

  await pool.query(
    `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)`,
    [jobId, review.reviewerId, review.revieweeId, review.rating, review.comment || null],
  );
}

async function refreshUserRating(userId) {
  await pool.query(
    `UPDATE users
     SET rating = COALESCE((SELECT AVG(rating)::numeric(3, 2) FROM reviews WHERE reviewee_id = $1), 0),
         total_reviews = (SELECT COUNT(*)::int FROM reviews WHERE reviewee_id = $1),
         updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

async function ensureDemoSubscription(subscription, userIdsByKey) {
  const userId = userIdsByKey[subscription.userKey];
  const planResult = await pool.query(
    `SELECT id, price, currency
     FROM subscription_plans
     WHERE slug = $1
     LIMIT 1`,
    [subscription.planSlug],
  );

  if (!planResult.rowCount) {
    throw new Error(`Subscription plan not found: ${subscription.planSlug}`);
  }

  const plan = planResult.rows[0];
  const startsAt = new Date();
  const endsAt = addDays(startsAt, SUBSCRIPTION_DURATION_DAYS);

  await pool.query(
    `UPDATE user_subscriptions
     SET status = 'cancelled'
     WHERE user_id = $1 AND status = 'active' AND plan_id <> $2`,
    [userId, plan.id],
  );

  const existingResult = await pool.query(
    `SELECT id
     FROM user_subscriptions
     WHERE user_id = $1 AND plan_id = $2 AND status = 'active'
     LIMIT 1`,
    [userId, plan.id],
  );

  if (existingResult.rowCount) {
    await pool.query(
      `UPDATE user_subscriptions
       SET amount_paid = $1,
           currency = $2,
           starts_at = $3,
           ends_at = $4
       WHERE id = $5`,
      [plan.price, plan.currency, startsAt.toISOString(), endsAt.toISOString(), existingResult.rows[0].id],
    );
  } else {
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, amount_paid, currency, starts_at, ends_at)
       VALUES ($1, $2, 'active', $3, $4, $5, $6)`,
      [userId, plan.id, plan.price, plan.currency, startsAt.toISOString(), endsAt.toISOString()],
    );
  }

  await pool.query(
    `UPDATE users
     SET is_pro = TRUE, updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

async function ensureDemoServiceOrder(serviceOrder, userIdsByKey) {
  const userId = userIdsByKey[serviceOrder.userKey];
  const serviceResult = await pool.query(
    `SELECT id, price, currency, billing_type
     FROM platform_services
     WHERE slug = $1
     LIMIT 1`,
    [serviceOrder.serviceSlug],
  );

  if (!serviceResult.rowCount) {
    throw new Error(`Platform service not found: ${serviceOrder.serviceSlug}`);
  }

  const service = serviceResult.rows[0];
  const price = service.billing_type === "subscription_included" ? 0 : Number(service.price || 0);

  const existingResult = await pool.query(
    `SELECT id
     FROM service_orders
     WHERE user_id = $1 AND service_id = $2 AND COALESCE(note, '') = $3
     LIMIT 1`,
    [userId, service.id, serviceOrder.note || ""],
  );

  if (existingResult.rowCount) {
    await pool.query(
      `UPDATE service_orders
       SET status = $1,
           price = $2,
           currency = $3,
           note = $4
       WHERE id = $5`,
      [
        serviceOrder.status || "ordered",
        price,
        service.currency,
        serviceOrder.note || null,
        existingResult.rows[0].id,
      ],
    );
    return;
  }

  await pool.query(
    `INSERT INTO service_orders (service_id, user_id, status, price, currency, note)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      service.id,
      userId,
      serviceOrder.status || "ordered",
      price,
      service.currency,
      serviceOrder.note || null,
    ],
  );
}

function writeDemoCredentialsLog() {
  if (!env.logDemoCredentials) {
    return;
  }

  fs.mkdirSync(path.dirname(CREDENTIALS_LOG_PATH), { recursive: true });
  fs.writeFileSync(
    CREDENTIALS_LOG_PATH,
    `${JSON.stringify(
      preparedDemoUsers.map((user) => ({
        role: user.role,
        fullName: user.fullName,
        city: user.city,
        username: user.username || null,
        email: user.email || null,
        phone: user.phone || null,
        password: EFFECTIVE_DEMO_PASSWORD,
      })),
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function ensureDevDemoData() {
  if (!env.demoSeedPassword) {
    throw new Error("DEMO_SEED_PASSWORD is required when SEED_DEMO_DATA=true");
  }

  const roleIds = await getRoleIds();
  await ensureDemoCategories();
  const categoriesByName = await getCategories();
  const passwordHash = await bcrypt.hash(EFFECTIVE_DEMO_PASSWORD, 10);
  const userIdsByKey = {};

  for (const user of preparedDemoUsers) {
    const savedUser = await ensureDemoUser(user, roleIds, passwordHash);
    userIdsByKey[user.key] = savedUser.id;
  }

  for (const job of demoJobs) {
    const jobId = await ensureDemoJob(job, userIdsByKey, categoriesByName);
    const selectedWorkerId = job.selectedWorkerKey ? userIdsByKey[job.selectedWorkerKey] : null;

    for (const response of job.responses || []) {
      await ensureDemoResponse(
        jobId,
        {
          workerId: userIdsByKey[response.workerKey],
          message: response.message,
          proposedPrice: response.proposedPrice,
          etaDays: response.etaDays,
        },
        selectedWorkerId,
      );
    }

    for (const review of job.reviews || []) {
      await ensureDemoReview(jobId, {
        reviewerId: userIdsByKey[review.reviewerKey],
        revieweeId: userIdsByKey[review.revieweeKey],
        rating: review.rating,
        comment: review.comment,
      });
    }
  }

  for (const worker of preparedDemoUsers.filter((user) => user.role === "worker")) {
    await refreshUserRating(userIdsByKey[worker.key]);
  }

  for (const subscription of demoSubscriptions) {
    await ensureDemoSubscription(subscription, userIdsByKey);
  }

  for (const serviceOrder of demoServiceOrders) {
    await ensureDemoServiceOrder(serviceOrder, userIdsByKey);
  }

  writeDemoCredentialsLog();
}

module.exports = {
  DEMO_PASSWORD,
  ensureDevDemoData,
};

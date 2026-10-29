const cityTranslations = {
  "Айдаркен": { ky: "Айдаркен", en: "Aydarken" },
  "Балыкчы": { ky: "Балыкчы", en: "Balykchy" },
  "Баткен": { ky: "Баткен", en: "Batken" },
  "Базар-Коргон": { ky: "Базар-Коргон", en: "Bazar-Korgon" },
  "Бишкек": { ky: "Бишкек", en: "Bishkek" },
  "Гульчо": { ky: "Гүлчө", en: "Gulcho" },
  "Джалал-Абад": { ky: "Жалал-Абад", en: "Jalal-Abad" },
  "Кадамжай": { ky: "Кадамжай", en: "Kadamjai" },
  "Кайыңды": { ky: "Кайыңды", en: "Kayyngdy" },
  "Кант": { ky: "Кант", en: "Kant" },
  "Кара-Балта": { ky: "Кара-Балта", en: "Kara-Balta" },
  "Кара-Куль": { ky: "Кара-Көл", en: "Kara-Kul" },
  "Кара-Суу": { ky: "Кара-Суу", en: "Kara-Suu" },
  "Каракол": { ky: "Каракол", en: "Karakol" },
  "Кемин": { ky: "Кемин", en: "Kemin" },
  "Кербен": { ky: "Кербен", en: "Kerben" },
  "Кочкор-Ата": { ky: "Кочкор-Ата", en: "Kochkor-Ata" },
  "Кок-Жангак": { ky: "Көк-Жаңгак", en: "Kok-Jangak" },
  "Кызыл-Кия": { ky: "Кызыл-Кыя", en: "Kyzyl-Kiya" },
  "Майлуу-Суу": { ky: "Майлуу-Суу", en: "Mailuu-Suu" },
  "Манас": { ky: "Манас", en: "Manas" },
  "Нарын": { ky: "Нарын", en: "Naryn" },
  "Ноокат": { ky: "Ноокат", en: "Nookat" },
  "Орловка": { ky: "Орловка", en: "Orlovka" },
  "Ош": { ky: "Ош", en: "Osh" },
  "Раззаков": { ky: "Раззаков", en: "Razzakov" },
  "Сулюкта": { ky: "Сүлүктү", en: "Sulukta" },
  "Талас": { ky: "Талас", en: "Talas" },
  "Таш-Кумыр": { ky: "Таш-Көмүр", en: "Tash-Kumyr" },
  "Токмок": { ky: "Токмок", en: "Tokmok" },
  "Токтогул": { ky: "Токтогул", en: "Toktogul" },
  "Узген": { ky: "Өзгөн", en: "Uzgen" },
  "Чолпон-Ата": { ky: "Чолпон-Ата", en: "Cholpon-Ata" },
  "Шопоков": { ky: "Шопоков", en: "Shopokov" },
  "Чуйская область": { ky: "Чүй облусу", en: "Chuy Region" },
  "Ошская область": { ky: "Ош облусу", en: "Osh Region" },
  "Иссык-Кульская область": { ky: "Ысык-Көл облусу", en: "Issyk-Kul Region" },
  "Иссык-Кульская область": { ky: "Ысык-Көл облусу", en: "Issyk-Kul Region" },
  "онлайн по Кыргызстану": { ky: "Кыргызстан боюнча онлайн", en: "Online across Kyrgyzstan" },
  "Араван": { ky: "Араван", en: "Aravan" },
  "Ат-Башы": { ky: "Ат-Башы", en: "At-Bashy" },
  "Баетов": { ky: "Баетов", en: "Baetov" },
  "Беловодское": { ky: "Беловодское", en: "Belovodskoye" },
  "Боконбаево": { ky: "Бөкөнбаев", en: "Bokonbayevo" },
  "Бостери": { ky: "Бостери", en: "Bosteri" },
  "Дароот-Коргон": { ky: "Дароот-Коргон", en: "Daroot-Korgon" },
  "Ивановка": { ky: "Ивановка", en: "Ivanovka" },
  "Кочкор": { ky: "Кочкор", en: "Kochkor" },
  "Кызыл-Адыр": { ky: "Кызыл-Адыр", en: "Kyzyl-Adyr" },
  "Кызыл-Суу": { ky: "Кызыл-Суу", en: "Kyzyl-Suu" },
  "Лебединовка": { ky: "Лебединовка", en: "Lebedinovka" },
  "Массы": { ky: "Массы", en: "Massy" },
  "Покровка": { ky: "Покровка", en: "Pokrovka" },
  "Сокулук": { ky: "Сокулук", en: "Sokuluk" },
  "Сузак": { ky: "Сузак", en: "Suzak" },
  "Тюп": { ky: "Түп", en: "Tyup" },
  "Чаек": { ky: "Чаек", en: "Chaek" },
};

const categoryTranslations = {
  "ремонт": { ky: "оңдоо", en: "repair" },
  "ремонт квартир и домов": { ky: "батирлерди жана үйлөрдү оңдоо", en: "apartment and house renovation" },
  "отделочные работы": { ky: "ички жасалгалоо иштери", en: "finishing works" },
  "сантехника": { ky: "сантехника", en: "plumbing" },
  "электрика": { ky: "электрика", en: "electrical work" },
  "плиточные работы": { ky: "плитка иштери", en: "tiling works" },
  "столярные и плотницкие работы": { ky: "жыгач уста иштери", en: "carpentry and joinery" },
  "сварка": { ky: "ширетүү", en: "welding" },
  "кровельные работы": { ky: "чатыр иштери", en: "roofing works" },
  "фасадные работы": { ky: "фасад иштери", en: "facade works" },
  "окна и двери": { ky: "терезелер жана эшиктер", en: "windows and doors" },
  "установка и ремонт техники": { ky: "техниканы орнотуу жана оңдоо", en: "appliance installation and repair" },
  "сборка мебели": { ky: "эмерек чогултуу", en: "furniture assembly" },
  "проектирование и дизайн": { ky: "долбоорлоо жана дизайн", en: "planning and design" },
  "уборка": { ky: "тазалоо", en: "cleaning" },
  "уборка квартир и домов": { ky: "батир жана үй тазалоо", en: "home and apartment cleaning" },
  "генеральная уборка": { ky: "жалпы тазалоо", en: "deep cleaning" },
  "мытье окон": { ky: "терезе жуу", en: "window cleaning" },
  "глажка и стирка": { ky: "үтүктөө жана кир жуу", en: "ironing and laundry" },
  "домработницы": { ky: "үй кызматкерлери", en: "housekeepers" },
  "сиделки": { ky: "кароочулар", en: "caregivers" },
  "няни": { ky: "нянялар", en: "nannies" },
  "помощь по хозяйству": { ky: "үй иштерине жардам", en: "household help" },
  "маникюр и педикюр": { ky: "маникюр жана педикюр", en: "manicure and pedicure" },
  "парикмахерские услуги": { ky: "чач тарач кызматтары", en: "hairdressing services" },
  "косметология": { ky: "косметология", en: "cosmetology" },
  "массаж": { ky: "массаж", en: "massage" },
  "визаж": { ky: "визаж", en: "makeup" },
  "эпиляция": { ky: "эпиляция", en: "hair removal" },
  "татуаж": { ky: "татуаж", en: "permanent makeup" },
  "спа-процедуры": { ky: "спа-процедуралар", en: "spa treatments" },
  "доставка": { ky: "жеткирүү", en: "delivery" },
  "переезды": { ky: "көчүрүү", en: "moving" },
  "IT": { ky: "IT", en: "IT" },
  "дизайн": { ky: "дизайн", en: "design" },
  "репетиторы": { ky: "репетиторлор", en: "tutors" },
  "строительство": { ky: "курулуш", en: "construction" },
  "школьные предметы": { ky: "мектеп сабактары", en: "school subjects" },
  "иностранные языки": { ky: "чет тилдер", en: "foreign languages" },
  "подготовка к экзаменам": { ky: "экзаменге даярдоо", en: "exam preparation" },
  "музыка": { ky: "музыка", en: "music" },
  "танцы": { ky: "бий", en: "dance" },
  "профессиональные курсы": { ky: "кесиптик курстар", en: "professional courses" },
  "онлайн-обучение": { ky: "онлайн окутуу", en: "online learning" },
  "обучение программированию": { ky: "программалоону үйрөтүү", en: "programming lessons" },
  "программирование": { ky: "программалоо", en: "programming" },
  "создание сайтов": { ky: "сайт жасоо", en: "website creation" },
  "дизайн (графический и веб)": { ky: "дизайн (графикалык жана веб)", en: "design (graphic and web)" },
  "копирайтинг и тексты": { ky: "копирайтинг жана тексттер", en: "copywriting and content" },
  "маркетинг и реклама": { ky: "маркетинг жана жарнама", en: "marketing and advertising" },
  "SEO": { ky: "SEO", en: "SEO" },
  "администрирование": { ky: "администрлөө", en: "administration" },
  "тестирование ПО": { ky: "ПО тестирлөө", en: "software testing" },
  "юристы": { ky: "юристтер", en: "lawyers" },
  "адвокаты": { ky: "адвокаттар", en: "attorneys" },
  "составление документов": { ky: "документ даярдоо", en: "document drafting" },
  "бухгалтерия": { ky: "бухгалтерия", en: "accounting" },
  "налоги и отчетность": { ky: "салык жана отчеттуулук", en: "taxes and reporting" },
  "консультации по бизнесу": { ky: "бизнес боюнча кеңеш", en: "business consulting" },
  "страхование": { ky: "камсыздандыруу", en: "insurance" },
  "автоинструкторы": { ky: "айдоочулук инструкторлор", en: "driving instructors" },
  "ремонт автомобилей": { ky: "унаа оңдоо", en: "car repair" },
  "диагностика авто": { ky: "унаа диагностикасы", en: "car diagnostics" },
  "шиномонтаж": { ky: "шина монтажы", en: "tire service" },
  "тюнинг": { ky: "тюнинг", en: "tuning" },
  "помощь на дороге": { ky: "жолдогу жардам", en: "roadside assistance" },
  "курьерская доставка": { ky: "курьердик жеткирүү", en: "courier delivery" },
  "грузоперевозки": { ky: "жүк ташуу", en: "cargo transportation" },
  "грузчики": { ky: "жүк ташуучулар", en: "loaders" },
  "перевозка мебели": { ky: "эмерек ташуу", en: "furniture transport" },
  "доставка еды и товаров": { ky: "тамак жана товар жеткирүү", en: "food and goods delivery" },
  "выгул собак": { ky: "ит сейилдетүү", en: "dog walking" },
  "передержка животных": { ky: "жаныбар кармоо", en: "pet boarding" },
  "груминг": { ky: "груминг", en: "grooming" },
  "дрессировка": { ky: "үйрөтүү", en: "training" },
  "ветеринарные услуги": { ky: "ветеринардык кызматтар", en: "veterinary services" },
  "персональные тренеры": { ky: "жеке машыктыруучулар", en: "personal trainers" },
  "фитнес": { ky: "фитнес", en: "fitness" },
  "йога": { ky: "йога", en: "yoga" },
  "единоборства": { ky: "бир күрөш түрлөрү", en: "martial arts" },
  "реабилитация": { ky: "реабилитация", en: "rehabilitation" },
  "ЛФК": { ky: "ДЭШ", en: "physical therapy" },
  "психологи": { ky: "психологдор", en: "psychologists" },
  "психотерапевты": { ky: "психотерапевттер", en: "psychotherapists" },
  "коучи": { ky: "коучтар", en: "coaches" },
  "профориентация": { ky: "кесипке багыт берүү", en: "career guidance" },
  "ведущие": { ky: "алып баруучулар", en: "hosts" },
  "аниматоры": { ky: "аниматорлор", en: "animators" },
  "музыканты для мероприятий": { ky: "иш-чара музыканттары", en: "event musicians" },
  "диджеи": { ky: "диджейлер", en: "DJs" },
  "фотографы": { ky: "фотографтар", en: "photographers" },
  "видеографы": { ky: "видеографтар", en: "videographers" },
  "оформление мероприятий": { ky: "иш-чара жасалгалоо", en: "event decoration" },
  "художники": { ky: "сүрөтчүлөр", en: "artists" },
  "дизайнеры": { ky: "дизайнерлер", en: "designers" },
  "рукоделие": { ky: "кол өнөрчүлүк", en: "handmade crafts" },
  "изготовление на заказ": { ky: "заказ менен жасоо", en: "custom-made production" },
  "пошив одежды": { ky: "кийим тигүү", en: "clothing tailoring" },
  "ремонт одежды": { ky: "кийим оңдоо", en: "clothing repair" },
  "ателье": { ky: "ателье", en: "atelier" },
  "дизайн одежды": { ky: "кийим дизайны", en: "fashion design" },
  "подбор персонала": { ky: "кадр тандоо", en: "recruitment" },
  "консалтинг": { ky: "консалтинг", en: "consulting" },
  "тендеры": { ky: "тендерлер", en: "tenders" },
  "автоматизация бизнеса": { ky: "бизнести автоматташтыруу", en: "business automation" },
  "CRM и IT-внедрение": { ky: "CRM жана IT киргизүү", en: "CRM and IT implementation" },
  "установка сигнализации": { ky: "сигнализация орнотуу", en: "alarm installation" },
  "видеонаблюдение": { ky: "видеокөзөмөл", en: "video surveillance" },
  "пожарная безопасность": { ky: "өрт коопсуздугу", en: "fire safety" },
  "контроль доступа": { ky: "кире берүүнү көзөмөлдөө", en: "access control" },
  "настройка телескопов": { ky: "телескоп жөндөө", en: "telescope setup" },
  "программирование радиостанций": { ky: "радиостанция программалоо", en: "radio programming" },
  "NFC-метки": { ky: "NFC белгилери", en: "NFC tags" },
  "аромадиффузоры": { ky: "аромадиффузорлор", en: "aroma diffusers" },
  "BIM и CAD": { ky: "BIM жана CAD", en: "BIM and CAD" },
  "производство изделий": { ky: "буюм өндүрүү", en: "product manufacturing" },
  "мелкий ремонт": { ky: "майда оңдоо", en: "minor repairs" },
  "подключение техники": { ky: "техниканы туташтыруу", en: "appliance connection" },
  "автоматы": { ky: "автоматтар", en: "breaker panels" },
  "розетки": { ky: "розеткалар", en: "sockets" },
  "освещение": { ky: "жарыктандыруу", en: "lighting" },
  "клининг": { ky: "клининг", en: "cleaning service" },
  "уборка после ремонта": { ky: "оңдоодон кийинки тазалоо", en: "post-renovation cleaning" },
  "курьер": { ky: "курьер", en: "courier" },
  "документы": { ky: "документтер", en: "documents" },
  "срочная доставка": { ky: "шашылыш жеткирүү", en: "urgent delivery" },
  "wifi": { ky: "Wi‑Fi", en: "Wi‑Fi" },
  "принтеры": { ky: "принтерлер", en: "printers" },
  "камеры": { ky: "камералар", en: "cameras" },
  "компьютеры": { ky: "компьютерлер", en: "computers" },
  "отделка": { ky: "ички жасалгалоо", en: "finishing" },
  "покраска": { ky: "боёо", en: "painting" },
  "ламинат": { ky: "ламинат", en: "laminate flooring" },
  "баннеры": { ky: "баннерлер", en: "banners" },
  "лендинги": { ky: "лендингдер", en: "landing pages" },
  "соцсети": { ky: "соцтармактар", en: "social media" },
  "айдентика": { ky: "айдентика", en: "brand identity" },
  "репетитор": { ky: "репетитор", en: "tutor" },
  "математика": { ky: "математика", en: "mathematics" },
  "русский язык": { ky: "орус тили", en: "Russian language" },
  "онлайн-занятия": { ky: "онлайн сабактар", en: "online lessons" },
  "переезд": { ky: "көчүү", en: "moving" },
  "подъем мебели": { ky: "эмерек көтөрүү", en: "furniture lifting" },
};

const subscriptionTranslations = {
  "worker-pro-monthly": {
    name: { ky: "Адис үчүн PRO айлык", en: "Worker PRO Monthly" },
    description: {
      ky: "Каталогдо жогору көрүнгүсү жана тезирээк жооп алгысы келген адистер үчүн.",
      en: "For specialists who want stronger catalog visibility and faster responses.",
    },
    features: {
      ru: [
        "PRO-значок в каталоге",
        "Приоритетное размещение среди исполнителей",
        "Подробная аналитика профиля",
        "Доступ к включенным сервисам поддержки",
      ],
      ky: [
        "Каталогдо PRO белгиси",
        "Аткаруучулардын арасында артыкчылыктуу жайгашуу",
        "Профиль боюнча кеңири аналитика",
        "Киргизилген колдоо сервистерине жетүү",
      ],
      en: [
        "PRO badge in the catalog",
        "Priority placement among specialists",
        "Detailed profile analytics",
        "Access to included support services",
      ],
    },
  },
  "worker-pro-quarterly": {
    name: { ky: "Адис үчүн PRO кварталдык", en: "Worker PRO Quarterly" },
    description: {
      ky: "Үнөмдүү кварталдык тариф жана издөөдөгү артыкчылык алган адистер үчүн.",
      en: "An extended quarterly specialist plan with savings and search priority.",
    },
    features: {
      ru: [
        "Все преимущества месячного PRO",
        "Больше доверия за счет длительного тарифа",
        "Приоритет на срочных заказах",
        "Включенные сервисы без доплаты",
      ],
      ky: [
        "Айлык PRO тарифинин бардык артыкчылыктары",
        "Узак тарифтин эсебинен көбүрөөк ишеним",
        "Шашылыш заказдарда артыкчылык",
        "Кошумча төлөмсүз киргизилген сервистер",
      ],
      en: [
        "All monthly PRO benefits",
        "More trust thanks to a longer plan",
        "Priority on urgent jobs",
        "Included services at no extra cost",
      ],
    },
  },
  "customer-business-monthly": {
    name: { ky: "Кардар үчүн Business айлык", en: "Customer Business Monthly" },
    description: {
      ky: "Аткаруучуларды тезирээк тандап, тапшырмаларды күчөтүп чыгаргысы келген кардарлар үчүн.",
      en: "For customers who need faster specialist matching and stronger job promotion.",
    },
    features: {
      ru: [
        "Приоритетный показ новых заказов",
        "Быстрый подбор релевантных исполнителей",
        "Выделение срочных задач",
        "Доступ к включенным сервисам поддержки",
      ],
      ky: [
        "Жаңы заказдарды артыкчылыктуу көрсөтүү",
        "Ылайыктуу аткаруучуларды тез тандоо",
        "Шашылыш тапшырмаларды өзгөчө көрсөтүү",
        "Киргизилген колдоо сервистерине жетүү",
      ],
      en: [
        "Priority display for new jobs",
        "Faster matching with relevant specialists",
        "Highlighting urgent tasks",
        "Access to included support services",
      ],
    },
  },
  "customer-business-quarterly": {
    name: { ky: "Кардар үчүн Business кварталдык", en: "Customer Business Quarterly" },
    description: {
      ky: "Көп жарыялоочу жана кеңейтилген колдоо керек болгон кардарлар үчүн кварталдык тариф.",
      en: "A quarterly customer plan for frequent posting and extended support.",
    },
    features: {
      ru: [
        "Все преимущества месячного Business",
        "Экономия на регулярных публикациях",
        "Помощь с оформлением задач",
        "Включенные сервисы без доплаты",
      ],
      ky: [
        "Айлык Business тарифинин бардык артыкчылыктары",
        "Туруктуу жарыялоолордо үнөмдөө",
        "Тапшырмаларды туура толтурууга жардам",
        "Кошумча төлөмсүз киргизилген сервистер",
      ],
      en: [
        "All monthly Business benefits",
        "Savings on regular postings",
        "Help with creating job descriptions",
        "Included services at no extra cost",
      ],
    },
  },
  "kyzmat-plus-yearly": {
    name: { ky: "KYZMAT Plus жылдык", en: "KYZMAT Plus Yearly" },
    description: {
      ky: "Платформанын бардык активдүү колдонуучулары үчүн универсалдуу жылдык жазылуу.",
      en: "A universal yearly subscription for active users of any platform role.",
    },
    features: {
      ru: [
        "Подходит и заказчику, и исполнителю",
        "Годовой PRO-статус",
        "Доступ к включенным сервисам",
        "Приоритетная поддержка платформы",
      ],
      ky: [
        "Кардарга да, аткаруучуга да ылайыктуу",
        "Жылдык PRO статус",
        "Киргизилген сервистерге жетүү",
        "Платформанын артыкчылыктуу колдоосу",
      ],
      en: [
        "Works for both customers and specialists",
        "Year-long PRO status",
        "Access to included services",
        "Priority platform support",
      ],
    },
  },
};

const serviceTranslations = {
  "worker-profile-boost": {
    name: {
      ru: "Поднятие профиля в каталоге на 7 дней",
      ky: "Профилди каталогдо 7 күнгө көтөрүү",
      en: "Profile boost in catalog for 7 days",
    },
    description: {
      ru: "Разово поднимает карточку специалиста в выдаче по городу и навыкам.",
      ky: "Адистин карточкасын шаар жана көндүмдөр боюнча издөөдө бир жолу жогору чыгарат.",
      en: "Boosts a specialist profile in city and skill search results for a one-time period.",
    },
    benefits: {
      ru: ["Лучшая заметность в каталоге", "Подходит для быстрого набора заказов", "Акцент на профиле специалиста"],
      ky: ["Каталогдо жакшыраак көрүнөт", "Тез заказ алуу үчүн ылайыктуу", "Адистин профилине көңүл бурат"],
      en: ["Better visibility in the catalog", "Good for quickly getting more jobs", "Highlights the specialist profile"],
    },
  },
  "worker-priority-response": {
    name: {
      ru: "Приоритетный отклик на заказ",
      ky: "Заказга артыкчылыктуу жооп",
      en: "Priority response to a job",
    },
    description: {
      ru: "Помогает отклику исполнителя выделиться в карточке заказа.",
      ky: "Аткаруучунун жообун заказ карточкасында өзгөчө көрсөтүүгө жардам берет.",
      en: "Helps a specialist response stand out inside the job card.",
    },
    benefits: {
      ru: ["Выделение в списке откликов", "Хорошо для срочных задач", "Разовая покупка под конкретную заявку"],
      ky: ["Жооптор тизмесинде өзгөчө көрсөтүлөт", "Шашылыш иштер үчүн ыңгайлуу", "Белгилүү бир заказ үчүн бир жолку сатып алуу"],
      en: ["Highlighted in the response list", "Useful for urgent jobs", "One-time purchase for a specific request"],
    },
  },
  "customer-urgent-promo": {
    name: {
      ru: "Продвижение срочного заказа",
      ky: "Шашылыш заказды жылдыруу",
      en: "Promote an urgent job",
    },
    description: {
      ru: "Поднимает заказ в подборках и делает его заметнее для специалистов.",
      ky: "Заказды подборкаларда жогору чыгарып, адистер үчүн байкаларлык кылат.",
      en: "Raises a job in selections and makes it more visible to specialists.",
    },
    benefits: {
      ru: ["Выше шанс получить отклики быстрее", "Подходит для срочных бытовых задач", "Разовая услуга без подписки"],
      ky: ["Жоопторду тезирээк алуу мүмкүнчүлүгү жогору", "Шашылыш тиричилик иштерине ылайыктуу", "Жазылуусуз бир жолку кызмат"],
      en: ["Better chance of getting responses faster", "Good for urgent household tasks", "One-time service without a subscription"],
    },
  },
  "customer-shortlist": {
    name: {
      ru: "Подбор 5 исполнителей менеджером",
      ky: "Менеджер тандаган 5 аткаруучу",
      en: "Manager-picked shortlist of 5 specialists",
    },
    description: {
      ru: "Менеджер платформы формирует короткий список исполнителей под ваш заказ.",
      ky: "Платформа менеджери заказыңызга ылайык аткаруучулардын кыска тизмесин түзөт.",
      en: "A platform manager prepares a shortlist of specialists for your job.",
    },
    benefits: {
      ru: ["Экономит время на подборе", "Хорошо для сложных или дорогих заказов", "Получаете готовый shortlist"],
      ky: ["Тандоого кеткен убакытты үнөмдөйт", "Татаал же кымбат заказдар үчүн жакшы", "Даяр кыска тизме аласыз"],
      en: ["Saves time on selection", "Useful for complex or high-value jobs", "You receive a ready shortlist"],
    },
  },
  "priority-support": {
    name: {
      ru: "Приоритетная поддержка платформы",
      ky: "Платформанын артыкчылыктуу колдоосу",
      en: "Priority platform support",
    },
    description: {
      ru: "Включённая сервисная опция для активной подписки: более быстрый ответ поддержки по спорным и рабочим вопросам.",
      ky: "Активдүү жазылууга кирген сервис: талаш жана жумуш маселелери боюнча колдоо тезирээк жооп берет.",
      en: "An included service option for active subscriptions: faster support responses for disputes and work questions.",
    },
    benefits: {
      ru: ["Доступно в активной подписке", "Ускоренная обработка обращений", "Для заказчика и исполнителя"],
      ky: ["Активдүү жазылууда жеткиликтүү", "Кайрылуулар тезирээк каралат", "Кардарга да, аткаруучуга да ылайыктуу"],
      en: ["Available with an active subscription", "Faster request handling", "For customers and specialists"],
    },
  },
  "safe-deal-check": {
    name: {
      ru: "Проверка безопасной сделки",
      ky: "Коопсуз бүтүмдү текшерүү",
      en: "Safe deal verification",
    },
    description: {
      ru: "Включённая услуга: приоритетная проверка условий безопасной сделки и спорных деталей заказа.",
      ky: "Кирген кызмат: коопсуз бүтүмдүн шарттарын жана заказдагы талаштуу деталдарды артыкчылыктуу текшерүү.",
      en: "An included service: priority review of safe deal terms and disputed job details.",
    },
    benefits: {
      ru: ["Доступно в активной подписке", "Помогает снизить риски сделки", "Подходит обеим сторонам"],
      ky: ["Активдүү жазылууда жеткиликтүү", "Бүтүмдүн тобокелдигин азайтууга жардам берет", "Эки тарапка тең ылайыктуу"],
      en: ["Available with an active subscription", "Helps reduce deal risks", "Useful for both sides"],
    },
  },
};

const textTranslations = {
  "Публикую бытовые и семейные задачи, тестирую сценарии заказчика на платформе.": {
    ky: "Тиричилик жана үй-бүлөлүк тапшырмаларды жарыялап, платформадагы кардар сценарийлерин текшерем.",
    en: "I post household and family tasks and test customer flows on the platform.",
  },
  "Размещаю заказы для офиса, коммерческих помещений и регулярного обслуживания.": {
    ky: "Офис, коммерциялык жайлар жана туруктуу тейлөө үчүн заказдарды жайгаштырам.",
    en: "I place jobs for offices, commercial spaces, and recurring maintenance.",
  },
  "Ищу исполнителей для ремонта, доставки и бытовых задач в южных регионах.": {
    ky: "Түштүк аймактарда оңдоо, жеткирүү жана тиричилик жумуштары үчүн аткаруучуларды издейм.",
    en: "I look for specialists for repairs, deliveries, and home tasks in the southern regions.",
  },
  "Следит за платформой, пользователями, качеством заказов и демонстрационными данными.": {
    ky: "Платформаны, колдонуучуларды, заказ сапатын жана демо маалыматты көзөмөлдөйт.",
    en: "Oversees the platform, users, job quality, and demo data.",
  },
  "Сантехник и мастер по бытовому ремонту. Беру срочные выезды, замену смесителей, сборку мебели и мелкие домашние задачи.": {
    ky: "Сантехник жана тиричилик оңдоо устасы. Шашылыш чакырууларды, кран алмаштырууну, эмерек чогултууну жана майда үй иштерин алам.",
    en: "Plumber and home repair specialist. I handle urgent visits, faucet replacement, furniture assembly, and small household tasks.",
  },
  "Сантехник и мастер на выезд для квартир и небольших офисов": {
    ky: "Батирлер жана чакан кеңселер үчүн көчмө сантехник жана уста",
    en: "On-site plumber and handyman for apartments and small offices",
  },
  "Частный электрик: автоматы, розетки, светильники, поиск короткого замыкания и аварийные выезды по городу.": {
    ky: "Жеке электрик: автоматтар, розеткалар, жарык жабдуулары, кыска туташуу көйгөйлөрү жана шаар боюнча авариялык чакыруулар.",
    en: "Independent electrician for breakers, sockets, lighting, short-circuit troubleshooting, and urgent city calls.",
  },
  "Электрик для квартир, офисов и срочных аварийных заявок": {
    ky: "Батирлер, кеңселер жана шашылыш авариялык чакыруулар үчүн электрик",
    en: "Electrician for apartments, offices, and urgent emergency calls",
  },
  "Клинер для квартир и офисов. Делаю генеральную уборку, уборку после ремонта и регулярное поддержание чистоты.": {
    ky: "Батирлер жана кеңселер үчүн клинер. Жалпы тазалоо, оңдоодон кийинки тазалоо жана туруктуу тазалыкты камсыздайм.",
    en: "Cleaner for apartments and offices. I handle deep cleaning, post-renovation cleaning, and regular upkeep.",
  },
  "Клинер для квартир, офисов и уборки после ремонта": {
    ky: "Батир, кеңсе жана оңдоодон кийинки тазалоо үчүн клинер",
    en: "Cleaner for apartments, offices, and post-renovation cleaning",
  },
  "Курьер по городу: документы, покупки, срочные доставки, сопровождение небольших грузов и доставка в аэропорт.": {
    ky: "Шаардагы курьер: документтер, сатып алуулар, шашылыш жеткирүү, чакан жүктөрдү коштоо жана аэропортко жеткирүү.",
    en: "City courier for documents, purchases, urgent deliveries, small cargo escort, and airport delivery.",
  },
  "Городской курьер для срочных документов и небольших грузов": {
    ky: "Шашылыш документтер жана чакан жүктөр үчүн шаардык курьер",
    en: "City courier for urgent documents and small cargo",
  },
  "Настраиваю Wi-Fi, роутеры, камеры, ноутбуки, принтеры и небольшую офисную IT-инфраструктуру.": {
    ky: "Wi‑Fi, роутерлерди, камераларды, ноутбуктарды, принтерлерди жана чакан кеңсе IT-инфраструктурасын жөндөйм.",
    en: "I set up Wi‑Fi, routers, cameras, laptops, printers, and small office IT infrastructure.",
  },
  "IT-специалист для дома, малого бизнеса и офисов": {
    ky: "Үй, чакан бизнес жана кеңселер үчүн IT-адис",
    en: "IT specialist for home, small business, and offices",
  },
  "Отделочник по квартирам и домам: шпаклевка, покраска, ламинат, откосы и чистовые работы под ключ.": {
    ky: "Батир жана үйлөр үчүн ички жасалгалоочу: шпаклевка, боёо, ламинат, откос жана таза бүтүрүү иштери.",
    en: "Finishing specialist for apartments and houses: putty, painting, laminate, slopes, and turnkey finishing work.",
  },
  "Отделочник для чистовых работ и локального ремонта": {
    ky: "Таза бүтүрүү иштери жана жергиликтүү оңдоо үчүн жасалгалоочу",
    en: "Finishing specialist for final works and local repair",
  },
  "Делаю лендинги, баннеры, меню, посты для соцсетей и упаковку визуала для малого бизнеса.": {
    ky: "Лендингдерди, баннерлерди, менюларды, соцтармактар үчүн постторду жана чакан бизнеске визуалдык таңгакты жасайм.",
    en: "I create landing pages, banners, menus, social media posts, and visual packaging for small businesses.",
  },
  "Дизайнер для малого бизнеса, соцсетей и быстрых запусков": {
    ky: "Чакан бизнес, соцтармактар жана ыкчам запускдар үчүн дизайнер",
    en: "Designer for small business, social media, and fast launches",
  },
  "Репетитор по математике и русскому языку. Провожу онлайн-уроки и занятия офлайн для школьников 5-11 классов.": {
    ky: "Математика жана орус тили боюнча репетитор. 5–11-класстын окуучулары үчүн онлайн жана оффлайн сабак өтөм.",
    en: "Math and Russian tutor. I teach online and offline lessons for students in grades 5–11.",
  },
  "Репетитор для школьников: математика, русский язык, подготовка к контрольным": {
    ky: "Окуучулар үчүн репетитор: математика, орус тили, көзөмөл иштерине даярдоо",
    en: "Tutor for school students: math, Russian language, and test preparation",
  },
  "Помогаю с переездами, разгрузкой, подъемом мебели и аккуратной перевозкой бытовых вещей по городу.": {
    ky: "Көчүүгө, жүк түшүрүүгө, эмерек көтөрүүгө жана тиричилик буюмдарын шаар ичинде этият ташууга жардам берем.",
    en: "I help with moving, unloading, lifting furniture, and careful transport of household belongings around the city.",
  },
  "Грузчик и помощник при переездах по Бишкеку": {
    ky: "Бишкек боюнча көчүүдө грузчик жана жардамчы",
    en: "Loader and moving assistant in Bishkek",
  },
  "выезд": { ky: "чыгуу", en: "on-site" },
  "у клиента": { ky: "кардардын жайында", en: "at client location" },
  "срочный выезд": { ky: "шашылыш чыгуу", en: "urgent call-out" },
  "по городу": { ky: "шаар боюнча", en: "across the city" },
  "онлайн": { ky: "онлайн", en: "online" },
  "русский": { ky: "орусча", en: "Russian" },
  "кыргызский": { ky: "кыргызча", en: "Kyrgyz" },
  "английский": { ky: "англисче", en: "English" },
  "Фото профиля загружено": { ky: "Профилдик сүрөт жүктөлгөн", en: "Profile photo uploaded" },
  "Телефон подтвержден": { ky: "Телефон тастыкталган", en: "Phone verified" },
  "Анкета заполнена": { ky: "Анкета толтурулган", en: "Profile completed" },
  "Профиль проверен командой KYZMAT: контакты заполнены, фото добавлено, анкета подробно оформлена.": {
    ky: "Профиль KYZMAT командасы тарабынан текшерилген: байланыштар толтурулган, сүрөт кошулган, анкета толук жазылган.",
    en: "The profile was verified by the KYZMAT team: contacts are filled in, a photo was added, and the profile is detailed.",
  },
  "Обычно отвечает в течение 10-20 минут": { ky: "Адатта 10–20 мүнөттө жооп берет", en: "Usually replies within 10–20 minutes" },
  "Профильные курсы по сантехническому монтажу и бытовому ремонту.": {
    ky: "Сантехникалык монтаж жана тиричилик оңдоосу боюнча профилдик курстар.",
    en: "Specialized training in plumbing installation and household repairs.",
  },
  "Более 300 бытовых заявок: течи, смесители, сифоны, раковины, навеска и сборка мебели.": {
    ky: "300дөн ашык тиричилик чакыруусу: агып кетүү, аралаштыргычтар, сифондор, раковиналар, асуу жана эмерек чогултуу.",
    en: "Handled more than 300 household requests: leaks, faucets, traps, sinks, mounting, and furniture assembly.",
  },
  "Каждый день с 09:00 до 22:00, срочные выезды в тот же день.": {
    ky: "Күн сайын 09:00дөн 22:00гө чейин, шашылыш чакыруулар ошол эле күнү.",
    en: "Available daily from 09:00 to 22:00, with same-day urgent visits.",
  },
  "Диагностика входит в стоимость, мелкие расходники могу привезти с собой.": {
    ky: "Диагностика баага кирет, майда чыгым материалдарын өзүм алып келе алам.",
    en: "Diagnostics are included in the price, and I can bring small consumables with me.",
  },
  "Электромонтажный колледж, регулярная практика по щиткам и внутренней проводке.": {
    ky: "Электромонтаж боюнча колледж, щиттер жана ички өткөргүчтөр боюнча туруктуу практика.",
    en: "Electrical installation college background with regular hands-on work on panels and internal wiring.",
  },
  "Собрал и обслужил десятки квартирных щитов, устраняю проблемы с освещением и перегрузками.": {
    ky: "Он чакты батирдик щиттерди чогултуп тейледим, жарыктандыруу жана ашыкча жүктөм көйгөйлөрүн чечем.",
    en: "Built and maintained dozens of apartment electrical panels, solving lighting and overload issues.",
  },
  "С 08:00 до 23:00, аварийные заявки беру вне очереди.": {
    ky: "08:00дөн 23:00гө чейин, авариялык чакырууларды кезексиз алам.",
    en: "Available from 08:00 to 23:00, with emergency requests handled as a priority.",
  },
  "Перед началом работ озвучиваю смету и список материалов.": {
    ky: "Иш баштала электе сметаны жана материалдардын тизмесин так айтам.",
    en: "I provide a clear estimate and materials list before work begins.",
  },
  "Обучение по профессиональной бытовой химии и безопасной уборке поверхностей.": {
    ky: "Кесипкөй тиричилик химиясы жана беттерди коопсуз тазалоо боюнча окуу.",
    en: "Training in professional household chemicals and safe surface cleaning.",
  },
  "Работала с квартирами, салонами и офисами до 200 м2, умею быстро подготавливать помещение к открытию.": {
    ky: "200 м2 чейин батирлер, салондор жана кеңселер менен иштегем, жайды ачылышка тез даярдай алам.",
    en: "Worked with apartments, salons, and offices up to 200 m², and can prepare a space for opening quickly.",
  },
  "Ежедневно с 08:00 до 20:00, крупные объекты по предварительной записи.": {
    ky: "Күн сайын 08:00дөн 20:00гө чейин, ири объекттер алдын ала жазылуу менен.",
    en: "Available daily from 08:00 to 20:00, with larger sites handled by prior booking.",
  },
  "Привожу свои средства и инвентарь, стоимость зависит от площади и степени загрязнения.": {
    ky: "Өзүмдүн каражаттарымды жана шаймандарымды алып келем, баа аянтка жана булгануу деңгээлине жараша болот.",
    en: "I bring my own supplies and equipment, and the price depends on the area and level of soiling.",
  },
  "Опыт работы в городской доставке и курьерских сервисах.": {
    ky: "Шаардык жеткирүү жана курьердик сервистерде иш тажрыйбам бар.",
    en: "Experience in city delivery and courier services.",
  },
  "Сопровождаю срочные документы, доставляю заказы день в день, работаю аккуратно с хрупкими покупками.": {
    ky: "Шашылыш документтерди коштоп, заказдарды ошол эле күнү жеткирем, морт сатып алуулар менен этият иштейм.",
    en: "I handle urgent documents, provide same-day delivery, and work carefully with fragile purchases.",
  },
  "Каждый день с 07:30 до 23:30.": {
    ky: "Күн сайын 07:30дан 23:30га чейин.",
    en: "Available every day from 07:30 to 23:30.",
  },
  "Срочные заказы рассчитываю отдельно в зависимости от расстояния и времени.": {
    ky: "Шашылыш заказдарды аралыкка жана убакытка жараша өзүнчө эсептейм.",
    en: "Urgent orders are priced separately depending on distance and timing.",
  },
  "Высшее техническое образование, практика в сервисном и корпоративном IT.": {
    ky: "Жогорку техникалык билим, сервистик жана корпоративдик IT тармагында практика.",
    en: "Higher technical education with experience in service and corporate IT.",
  },
  "Настроил десятки офисных сетей, камер и рабочих мест, объясняю простым языком без лишней терминологии.": {
    ky: "Ондогон кеңсе тармактарын, камераларды жана жумуш орундарын жөндөдүм, ашыкча терминсиз жөнөкөй түшүндүрөм.",
    en: "Set up dozens of office networks, cameras, and workstations, explaining everything in simple language without unnecessary jargon.",
  },
  "Будни с 09:00 до 21:00, онлайн-консультации и удаленное подключение вечером.": {
    ky: "Иш күндөрү 09:00дөн 21:00гө чейин, кечинде онлайн кеңеш жана алыстан туташуу мүмкүн.",
    en: "Available on weekdays from 09:00 to 21:00, with evening online consultations and remote support.",
  },
  "Могу приехать со своим инструментом, при необходимости помогу подобрать технику.": {
    ky: "Өз шаймандарым менен келе алам, керек болсо техника тандоого да жардам берем.",
    en: "I can arrive with my own tools and help choose equipment if needed.",
  },
  "Практический опыт в частных ремонтах и отделке жилых помещений.": {
    ky: "Жеке оңдоо жана турак жайларды жасалгалоо боюнча практикалык тажрыйба.",
    en: "Hands-on experience in private renovations and residential finishing.",
  },
  "Веду объекты аккуратно и поэтапно: стены, потолок, пол, декоративные элементы и подготовка под сдачу.": {
    ky: "Объекттерди тыкан жана этап-этабы менен жүргүзөм: дубал, шып, пол, декоративдик элементтер жана тапшырууга даярдоо.",
    en: "I handle projects carefully and step by step: walls, ceilings, floors, decorative details, and final preparation for handover.",
  },
  "С понедельника по субботу с 09:00 до 19:00.": {
    ky: "Дүйшөмбүдөн ишембиге чейин 09:00дөн 19:00гө чейин.",
    en: "Available Monday through Saturday from 09:00 to 19:00.",
  },
  "Составляю понятную смету и могу помочь с расчетом материалов.": {
    ky: "Түшүнүктүү смета түзөм жана материалдарды эсептөөгө жардам бере алам.",
    en: "I prepare a clear estimate and can help calculate materials.",
  },
  "Курсы по графическому дизайну и web-лендингам, проектная работа с кофейнями и студиями.": {
    ky: "Графикалык дизайн жана web-лендингдер боюнча курстар, кофейнялар жана студиялар менен долбоордук иш.",
    en: "Courses in graphic design and web landing pages, with project work for cafes and studios.",
  },
  "Помогаю быстро собрать понятный визуал: баннеры, прайсы, меню, лендинги и простую айдентику.": {
    ky: "Түшүнүктүү визуалды бат чогултууга жардам берем: баннерлер, прайс, меню, лендингдер жана жөнөкөй айдентика.",
    en: "I help quickly build clear visuals: banners, price lists, menus, landing pages, and simple brand identity.",
  },
  "На связи ежедневно, правки обычно в тот же день.": {
    ky: "Күн сайын байланыштамын, оңдоолор көбүнчө ошол эле күнү жасалат.",
    en: "Available every day, with revisions usually completed the same day.",
  },
  "Фиксирую объем работ до старта, работаю по этапам и показываю промежуточные варианты.": {
    ky: "Иш көлөмүн башында тактайм, этап менен иштейм жана аралык варианттарды көрсөтөм.",
    en: "I lock in the scope before starting, work in stages, and show interim versions along the way.",
  },
  "Педагогическое образование, опыт в школе и индивидуальной подготовке.": {
    ky: "Педагогикалык билим, мектепте жана жеке даярдоодо тажрыйба.",
    en: "Pedagogical education with experience in school teaching and one-on-one preparation.",
  },
  "Помогаю подтянуть базу, подготовиться к экзаменам и выстроить спокойный учебный режим без перегруза.": {
    ky: "Негизди бекемдөөгө, экзаменге даярданууга жана ашыкча жүксүз тынч окуу режимин түзүүгө жардам берем.",
    en: "I help strengthen core knowledge, prepare for exams, and build a calm study routine without overload.",
  },
  "По будням после 15:00 и по выходным.": {
    ky: "Иш күндөрү 15:00дөн кийин жана дем алышта.",
    en: "Available on weekdays after 15:00 and on weekends.",
  },
  "Первое короткое знакомство и оценка уровня бесплатно.": {
    ky: "Биринчи кыска таанышуу жана деңгээлди баалоо акысыз.",
    en: "The first short introduction and level assessment are free.",
  },
  "Практика в квартирных и офисных переездах, помощь с упаковкой и заносом.": {
    ky: "Батир жана кеңсе көчүрүүлөрүндө практика, таңгактоо жана киргизүү боюнча жардам.",
    en: "Experience in apartment and office moves, including packing and carrying items in.",
  },
  "Работаю аккуратно с мебелью и бытовой техникой, могу выехать с напарником.": {
    ky: "Эмерек жана тиричилик техникасы менен этият иштейм, керек болсо шерик менен чыга алам.",
    en: "I handle furniture and household appliances carefully and can come with a partner if needed.",
  },
  "Каждый день с 08:00 до 22:00.": {
    ky: "Күн сайын 08:00дөн 22:00гө чейин.",
    en: "Available every day from 08:00 to 22:00.",
  },
  "Стоимость зависит от этажа, объема и наличия лифта.": {
    ky: "Баасы кабатка, көлөмгө жана лифттин бар-жогуна жараша болот.",
    en: "Pricing depends on the floor, volume, and whether there is an elevator.",
  },
  "Показывает примеры похожих работ до начала заказа": { ky: "Заказ башталганга чейин окшош иштердин мисалдарын көрсөтөт", en: "Shows examples of similar work before the order begins" },
  "Согласовывает объем и стоимость заранее": { ky: "Иштин көлөмүн жана баасын алдын ала тактайт", en: "Agrees on scope and cost in advance" },
  "Поддерживает связь с клиентом до завершения заказа": { ky: "Заказ бүткөнгө чейин кардар менен байланышта болот", en: "Keeps in touch with the client until the order is completed" },
  "Приехал быстро, все объяснил и устранил течь за один визит.": { ky: "Тез келди, баарын түшүндүрүп, бир барганда эле агып жаткан жерди оңдоду.", en: "Arrived quickly, explained everything, and fixed the leak in one visit." },
  "Нужно устранить течь под мойкой и проверить соединения. Если понадобится, сразу заменить гибкую подводку или сифон.": {
    ky: "Жуучу жайдын алдындагы агып жаткан жерди токтотуп, кошулмаларды текшерүү керек. Зарыл болсо ийкем түтүктү же сифондy ошол замат алмаштыруу керек.",
    en: "Need to fix a leak under the sink and inspect the connections. If necessary, replace the flexible hose or trap right away.",
  },
  "Подъеду сегодня вечером с инструментом и сразу привезу базовые расходники.": {
    ky: "Бүгүн кечинде шаймандарым менен келип, негизги чыгым материалдарын кошо ала келем.",
    en: "I can come this evening with my tools and bring the basic consumables right away.",
  },
  "Могу приехать завтра утром, если нужен допосмотр кухни и коммуникаций.": {
    ky: "Ашкананы жана түтүктөрдү кошумча карап чыгуу керек болсо, эртең менен келе алам.",
    en: "I can come tomorrow morning if you need an additional inspection of the kitchen and connections.",
  },
  "Генеральная уборка офиса 90 м2": {
    ky: "90 м2 кеңсени жалпы тазалоо",
    en: "Deep cleaning for a 90 m² office",
  },
  "Нужна уборка после рабочей недели: полы, санузел, кухонная зона, пыль на поверхностях и стеклянные перегородки. Лучше выехать утром.": {
    ky: "Жумуш жумасынан кийин тазалоо керек: полдор, санитардык түйүн, ашкана бурчу, беттердеги чаң жана айнек тосмолор. Эртең менен келсе жакшы болот.",
    en: "Need a cleanup after the work week: floors, restroom, kitchen area, dust on surfaces, and glass partitions. Morning arrival is preferred.",
  },
  "Приеду со своими средствами, могу вывести двух человек на объект.": {
    ky: "Өз каражаттарым менен келем, объектке эки адам чыгара алам.",
    en: "I will arrive with my own supplies and can send a two-person team to the site.",
  },
  "Помогу, если нужен выезд в ближайшее утро.": {
    ky: "Эгер жакынкы эртең менен чыгуу керек болсо, жардам бере алам.",
    en: "I can help if you need someone to come out the next morning.",
  },
  "Генеральная уборка квартиры 64 м2": {
    ky: "64 м2 батирди жалпы тазалоо",
    en: "Deep cleaning for a 64 m² apartment",
  },
  "Нужна влажная уборка всех комнат, кухня и санузел, пыль на поверхностях, мойка полов и базовая уборка после небольшой перестановки.": {
    ky: "Бардык бөлмөлөрдү нымдуу тазалоо керек: ашкана, санитардык түйүн, беттердеги чаң, пол жуу жана чакан орун алмаштыруудан кийинки негизги тазалоо.",
    en: "Need wet cleaning for all rooms, the kitchen and bathroom, dust removal from surfaces, floor washing, and basic cleanup after a small rearrangement.",
  },
  "Свободна завтра с утра, приеду со своими средствами и инвентарем.": {
    ky: "Эртең менен бошмун, өз каражаттарым жана шаймандарым менен келем.",
    en: "I am available tomorrow morning and will come with my own supplies and equipment.",
  },
  "Могу помочь, если нужен выезд в тот же день.": {
    ky: "Эгер ошол эле күнү чыгуу керек болсо, жардам бере алам.",
    en: "I can help if you need a same-day visit.",
  },
  "Срочно доставить документы в аэропорт Манас": {
    ky: "Документтерди шашылыш Манас аэропортуна жеткирүү",
    en: "Urgently deliver documents to Manas Airport",
  },
  "Нужно забрать папку в центре Бишкека и отвезти в аэропорт в течение двух часов. Документы важные, нужен аккуратный и быстрый курьер.": {
    ky: "Бишкектин борборунан папканы алып, эки сааттын ичинде аэропортко жеткирүү керек. Документтер маанилүү, этият жана ыкчам курьер керек.",
    en: "Need to pick up a folder in central Bishkek and deliver it to the airport within two hours. The documents are important, so a careful and fast courier is needed.",
  },
  "Готов выехать сразу после подтверждения, хорошо знаю маршрут до аэропорта.": {
    ky: "Ырастоодон кийин дароо чыга алам, аэропортко чейинки жолду жакшы билем.",
    en: "Ready to leave immediately after confirmation and know the route to the airport well.",
  },
  "Могу забрать документы по пути на другой заказ и быстро доставить.": {
    ky: "Документтерди башка заказга бара жатып алып, тез жеткирип бере алам.",
    en: "I can pick up the documents on the way to another order and deliver them quickly.",
  },
  "Настроить Wi-Fi и принтер в небольшом офисе": {
    ky: "Чакан кеңседе Wi‑Fi жана принтерди жөндөө",
    en: "Set up Wi‑Fi and a printer in a small office",
  },
  "Интернет работает нестабильно, еще нужно подключить сетевой принтер на несколько ноутбуков и показать, как дальше им пользоваться.": {
    ky: "Интернет туруксуз иштеп жатат, мындан тышкары тармактык принтерди бир нече ноутбукка туташтырып, кантип колдонуу керектигин көрсөтүп берүү керек.",
    en: "The internet is unstable, and a network printer also needs to be connected to several laptops, with a quick walkthrough on how to use it.",
  },
  "Интернет работает нестабильно, еще нужно подключить сетевой принтер на несколько ноутбуков и показать, как дальше им пользоваться.": {
    ky: "Интернет туруксуз иштеп жатат, мындан тышкары тармактык принтерди бир нече ноутбукка туташтырып, кантип колдонуу керектигин көрсөтүп берүү керек.",
    en: "The internet is unstable, and a network printer also needs to be connected to several laptops, with a quick walkthrough on how to use it.",
  },
  "За один выезд настрою роутер, принтер и проверю скорость по кабинетам.": {
    ky: "Бир чыгууда роутерди, принтерди жөндөп, бөлмөлөр боюнча ылдамдыкты текшерем.",
    en: "In a single visit I will set up the router and printer and check connection speed across the rooms.",
  },
  "Подготовить стены и покрасить комнату 18 м2": {
    ky: "Дубалдарды даярдап, 18 м2 бөлмөнү боёо",
    en: "Prepare the walls and paint an 18 m² room",
  },
  "Нужно прошпаклевать стены после снятия старых обоев и покрасить комнату в светлый бежевый цвет. Материалы частично уже есть.": {
    ky: "Эски обойлор алынгандан кийин дубалдарды шпаклевкалап, бөлмөнү ачык беж түскө боёо керек. Материалдардын бир бөлүгү бар.",
    en: "Need to putty the walls after removing old wallpaper and paint the room a light beige color. Some materials are already available.",
  },
  "Могу приехать на замер, помогу досчитать материалы и начну на этой неделе.": {
    ky: "Өлчөм алууга келип, материалдарды так эсептеп берип, ушул жумада баштай алам.",
    en: "I can come for measurements, help calculate the remaining materials, and start this week.",
  },
  "Сделать лендинг для кофейни": {
    ky: "Кофейня үчүн лендинг жасоо",
    en: "Create a landing page for a coffee shop",
  },
  "Нужен аккуратный одностраничный сайт: меню, адрес, форма заявки, карта и несколько баннеров для запуска рекламы.": {
    ky: "Тыкан бир беттик сайт керек: меню, дарек, заявка формасы, карта жана жарнаманы баштоо үчүн бир нече баннер.",
    en: "Need a clean one-page website with a menu, address, request form, map, and a few banners for launching ads.",
  },
  "Сделаю дизайн, адаптивный лендинг и подготовлю графику для соцсетей.": {
    ky: "Дизайнды жасап, адаптивдүү лендинг даярдап, соцтармактар үчүн графиканы кошо иштеп берем.",
    en: "I will create the design, build a responsive landing page, and prepare graphics for social media.",
  },
  "Могу закрыть верстку и базовую интеграцию формы заявки.": {
    ky: "Верстканы жана заявка формасынын негизги интеграциясын толук жаап бере алам.",
    en: "I can handle the layout and basic integration of the request form.",
  },
  "Помочь с квартирным переездом в пределах города": {
    ky: "Шаар ичинде батир көчүрүүгө жардам берүү",
    en: "Help with an apartment move within the city",
  },
  "Нужно вынести коробки, диван и пару шкафов, аккуратно перевезти и поднять на третий этаж. Лифт есть только в новом доме.": {
    ky: "Кутуларды, диванды жана эки шкафты чыгарып, этият ташып барып үчүнчү кабатка көтөрүү керек. Лифт жаңы үйдө гана бар.",
    en: "Need to carry out boxes, a sofa, and a couple of wardrobes, transport them carefully, and lift them to the third floor. There is an elevator only in the new building.",
  },
  "Приеду с напарником, быстро погрузим и занесем без повреждений.": {
    ky: "Жанымда шерик менен келем, тез жүктөп, бузбай киргизип беребиз.",
    en: "I will come with a partner, and we will load and carry everything in quickly without damage.",
  },
  "Могу помочь с небольшим переездом и координацией по маршруту.": {
    ky: "Чакан көчүүгө жана маршрут боюнча уюштурууга жардам бере алам.",
    en: "I can help with a small move and coordinate the route.",
  },
  "Заменить автоматы и проверить щиток": {
    ky: "Автоматтарды алмаштырып, щитти текшерүү",
    en: "Replace breakers and inspect the electrical panel",
  },
  "В квартире периодически выбивает автомат при включении бытовой техники. Нужен мастер, который проверит нагрузку и заменит автоматы при необходимости.": {
    ky: "Батирде тиричилик техникасын күйгүзгөндө автомат кээде өчүп калат. Жүктү текшерип, керек болсо автоматтарды алмаштыра турган уста керек.",
    en: "The breaker in the apartment trips from time to time when household appliances are switched on. Need a specialist to check the load and replace the breakers if necessary.",
  },
  "Проверю щиток, распределю нагрузку и при необходимости сразу заменю автоматы.": {
    ky: "Щитти текшерип, жүктү бөлүштүрүп, керек болсо автоматтарды дароо алмаштырам.",
    en: "I will inspect the panel, balance the load, and replace the breakers right away if needed.",
  },
  "Могу посмотреть сегодня, если потребуется замена, помогу купить комплектующие.": {
    ky: "Бүгүн келип карап бере алам, алмаштыруу керек болсо тетиктерди алууга жардам берем.",
    en: "I can check it today, and if replacement is needed, I will help buy the required parts.",
  },
  "Заменить смеситель и проверить давление воды": {
    ky: "Аралаштыргычты алмаштырып, суунун басымын текшерүү",
    en: "Replace the faucet and check the water pressure",
  },
  "В ванной течет старый смеситель, а напор воды стал слабее. Нужен мастер, который снимет старый смеситель, поставит новый и проверит соединения.": {
    ky: "Ваннадагы эски аралаштыргыч агып жатат, суунун басымы да алсырап калды. Эски аралаштыргычты чечип, жаңысын коюп, кошулмаларды текшере турган уста керек.",
    en: "The old faucet in the bathroom is leaking, and the water pressure has become weaker. Need a specialist to remove the old faucet, install a new one, and check the connections.",
  },
  "Могу приехать завтра, заменить смеситель и проверить подводку с давлением.": {
    ky: "Эртең келип, аралаштыргычты алмаштырып, түтүктү жана басымды текшерип бере алам.",
    en: "I can come tomorrow, replace the faucet, and inspect the supply line and water pressure.",
  },
  "Сделал аккуратно, проверил соединения и подсказал по напору воды.": {
    ky: "Тыкан жасап, кошулмаларды текшерип, суунун басымы боюнча да кеңеш берип кетти.",
    en: "Did the job neatly, checked the connections, and gave helpful advice about the water pressure.",
  },
  "Установить люстру и заменить две розетки": {
    ky: "Люстра орнотуп, эки розетканы алмаштыруу",
    en: "Install a chandelier and replace two sockets",
  },
  "После ремонта нужно повесить люстру в гостиной и заменить две старые розетки. Нужен аккуратный мастер с инструментом.": {
    ky: "Оңдоодон кийин конок бөлмөгө люстра илип, эки эски розетканы алмаштыруу керек. Шайманы бар тыкан уста керек.",
    en: "After renovation, a chandelier needs to be installed in the living room and two old sockets need to be replaced. Looking for a careful specialist with tools.",
  },
  "Сделаю за один визит, проверю крепление и безопасность после монтажа.": {
    ky: "Бир барууда бүтүрөм, орноткондон кийин бекитилишин жана коопсуздугун текшерем.",
    en: "I will do it in one visit and check the fixture and safety after installation.",
  },
  "Нужен репетитор по математике для 8 класса": {
    ky: "8-класс үчүн математика репетитору керек",
    en: "Looking for a math tutor for grade 8",
  },
  "Ищу спокойного преподавателя для регулярных занятий два раза в неделю. Нужно подтянуть алгебру и геометрию, можно онлайн.": {
    ky: "Жумасына эки жолу туруктуу сабак өтө турган токтоо мугалим издейм. Алгебра менен геометрияны жакшыртуу керек, онлайн да болот.",
    en: "Looking for a calm teacher for regular lessons twice a week. Need help improving algebra and geometry, and online lessons are fine.",
  },
  "Ищу спокойного преподавателя для регулярных занятий два раза в неделю. Нужно подтянуть алгебру и геометрию, можно онлайн.": {
    ky: "Жумасына эки жолу туруктуу сабак өтө турган токтоо мугалим издейм. Алгебра менен геометрияны жакшыртуу керек, онлайн да болот.",
    en: "Looking for a calm teacher for regular lessons twice a week. Need help improving algebra and geometry, and online lessons are fine.",
  },
  "Проведу вводное занятие, оценю уровень и составлю понятный план занятий.": {
    ky: "Киришүү сабагын өткөрүп, деңгээлин баалап, түшүнүктүү окуу планын түзөм.",
    en: "I will hold an introductory lesson, assess the student's level, and prepare a clear lesson plan.",
  },
  "Сделать меню и баннеры для кофейни": {
    ky: "Кофейня үчүн меню жана баннерлерди жасоо",
    en: "Create a menu and banners for a coffee shop",
  },
  "Нужен дизайнер для обновления меню, баннера у входа и нескольких сторис-макетов для Instagram. Стиль уже примерно понятен.": {
    ky: "Менюну, кире бериштеги баннерди жана Instagram үчүн бир нече сторис-макетти жаңыртуу үчүн дизайнер керек. Стиль болжол менен түшүнүктүү.",
    en: "Need a designer to refresh the menu, the banner at the entrance, and a few Instagram story layouts. The overall style is already mostly defined.",
  },
  "Подготовлю визуальную концепцию, меню, печатный баннер и макеты для соцсетей.": {
    ky: "Визуалдык концепцияны, менюну, басма баннерди жана соцтармактар үчүн макеттерди даярдайм.",
    en: "I will prepare the visual concept, the menu, a printed banner, and layouts for social media.",
  },
  "Получился очень чистый и стильный дизайн, все файлы отдала удобно и вовремя.": {
    ky: "Абдан таза жана стилдүү дизайн чыкты, бардык файлдарды ыңгайлуу жана өз убагында берди.",
    en: "The design turned out very clean and stylish, and all files were delivered conveniently and on time.",
  },
  "Нужна помощь с переездом двух комнат": {
    ky: "Эки бөлмөнү көчүрүүгө жардам керек",
    en: "Need help moving two rooms",
  },
  "Нужно вынести коробки, стол, комод и детскую кровать, перевезти по городу и поднять на второй этаж. Нужны крепкие ребята и аккуратность.": {
    ky: "Кутуларды, үстөлдү, комодду жана балдар керебетин чыгарып, шаар ичинде ташып, экинчи кабатка көтөрүү керек. Күчтүү жана этият жигиттер керек.",
    en: "Need to carry out boxes, a table, a chest of drawers, and a child's bed, transport them across the city, and carry them up to the second floor. Looking for strong and careful movers.",
  },
  "Организую переезд с напарником, аккуратно погрузим и занесем мебель по новому адресу.": {
    ky: "Шеригим менен көчүүнү уюштуруп, эмеректи жаңы дарекке этият жүктөп жана киргизип беребиз.",
    en: "I will organize the move with a partner, and we will carefully load and carry the furniture into the new address.",
  },
  "Очень спокойно и бережно перевезли вещи, ничего не повредили.": {
    ky: "Буюмдарды абдан тынч жана этият ташышты, эч нерсе бузулган жок.",
    en: "They moved the items very calmly and carefully, and nothing was damaged.",
  },
  "Очень аккуратно убрала квартиру и приехала вовремя со всем своим.": { ky: "Батирди абдан тыкан тазалап, бардык керектүүсү менен өз убагында келди.", en: "Cleaned the apartment very carefully and arrived on time with all supplies." },
  "Доставил вовремя и сразу прислал подтверждение получения.": { ky: "Өз убагында жеткирип, дароо алынганын тастыктап жиберди.", en: "Delivered on time and immediately sent proof of delivery." },
  "Все настроил понятно и без лишней суеты, интернет перестал падать.": { ky: "Баарын түшүнүктүү жана ашыкча ызы-чуусуз жөндөдү, интернет туруктуу болуп калды.", en: "Set everything up clearly and calmly, and the internet stopped dropping." },
  "Сделал аккуратно, уложился в сроки и помог с расчетом материалов.": { ky: "Тыкан жасап, мөөнөтүнө жетишти жана материалдарды эсептөөгө жардам берди.", en: "Worked neatly, finished on time, and helped calculate materials." },
  "Сильный визуал и понятный процесс работы, все правки внесла быстро.": { ky: "Күчтүү визуал жана түшүнүктүү иш процесси, бардык оңдоолорду тез киргизди.", en: "Strong visual work and a clear process, all revisions were made quickly." },
  "Очень аккуратно перенесли мебель и уложились быстрее, чем ожидали.": { ky: "Эмеректи абдан этият көчүрүштү жана күткөндөн тезирээк бүтүштү.", en: "Moved the furniture very carefully and finished faster than expected." },
  "Разобрался с проблемой в щитке и подробно объяснил, что было не так.": { ky: "Щиттеги көйгөйдү тапты жана эмне туура эмес болгонун майда-чүйдөсүнө чейин түшүндүрдү.", en: "Found the issue in the electrical panel and explained in detail what was wrong." },
  "Все поставил ровно и быстро, после работы оставил порядок.": { ky: "Баарын тегиз жана тез орнотуп, жумуштан кийин ирет калтырды.", en: "Installed everything neatly and quickly, and left the place tidy afterwards." },
  "Очень спокойно объясняет и быстро нашла подход к ребенку.": { ky: "Абдан тынч түшүндүрөт жана балага бат эле жол тапты.", en: "Explains things very calmly and quickly found the right approach to the child." },
  "Получился очень чистый и стильный дизайн, все файлы отдала удобно и вовремя.": { ky: "Абдан таза жана стилдүү дизайн чыкты, бардык файлдарды ыңгайлуу жана өз убагында берди.", en: "The design turned out very clean and stylish, and all files were delivered conveniently and on time." },
  "Очень спокойно и бережно перевезли вещи, ничего не повредили.": { ky: "Буюмдарды абдан тынч жана этият ташышты, эч нерсе бузулган жок.", en: "They moved the items very calmly and carefully, and nothing was damaged." },
  "Сделал аккуратно, проверил соединения и подсказал по напору воды.": {
    ky: "Тыкан жасап, кошулмаларды текшерип, суунун басымы боюнча да кеңеш берди.",
    en: "Did the job neatly, checked the connections, and gave useful advice about the water pressure.",
  },
  "Устранить течь под кухонной мойкой": {
    ky: "Ашкана мойкасынын алдындагы агынды оңдоо",
    en: "Fix a leak under the kitchen sink",
  },
  "Под мойкой капает соединение, иногда появляется неприятный запах. Нужна диагностика, замена гибкой подводки или сифона и аккуратная герметизация.": {
    ky: "Мойканын алдындагы кошулган жер тамчылап жатат, кээде жагымсыз жыт чыгат. Диагностика, ийкем түтүктү же сифонду алмаштыруу жана тыкан герметизация керек.",
    en: "A connection under the sink is dripping, and sometimes there is an unpleasant smell. Need diagnostics, replacement of the flexible hose or siphon, and careful sealing.",
  },
  "Демо-продвижение профиля специалиста": {
    ky: "Адистин профилин демо илгерилетүү",
    en: "Demo specialist profile promotion",
  },
  "Приоритетный отклик на заявку по электрике": {
    ky: "Электрика боюнча заказга артыкчылыктуу жооп",
    en: "Priority response to an electrical job",
  },
  "Продвижение срочной бытовой заявки": {
    ky: "Шашылыш тиричилик заказын илгерилетүү",
    en: "Promote an urgent household job",
  },
  "Доступ к ускоренной поддержке по подписке": {
    ky: "Жазылуу аркылуу тездетилген колдоого жетүү",
    en: "Access to faster subscription support",
  },
  "Проверка адреса и карты": {
    ky: "Даректи жана картаны текшерүү",
    en: "Address and map check",
  },
  "Нужно проверить, что заказ сохраняет адрес, ориентир и позволяет исполнителю строить маршрут внутри сайта.": {
    ky: "Заказ даректи, ориентирди сактай турганын жана аткаруучуга сайттын ичинде маршрут түзүүгө мүмкүнчүлүк берерин текшерүү керек.",
    en: "Need to check that the job saves the address and landmark and lets the specialist build a route inside the site.",
  },
  "ывапро": {
    ky: "Тесттик заказ",
    en: "Test job",
  },
  "кквегнмгпуагп": {
    ky: "Тесттик сүрөттөмө",
    en: "Test description",
  },
};

function pickLocalized(entry, language, fallback) {
  if (!entry) return fallback;
  if (language === "ky") return entry.ky || entry.ru || fallback;
  if (language === "en") return entry.en || entry.ru || fallback;
  return entry.ru || fallback;
}

function normalizeLegacyText(value) {
  return String(value || "")
    .trim()
    .replace(/\uFFFD\?/g, "И")
    .replace(/пїЅ\?/g, "И")
    .replace(/BIM \u0420\u0451 CAD/g, "BIM и CAD")
    .replace(/Wi\u0432\u0402\u2018Fi/g, "Wi-Fi")
    .replace(/В·/g, "·");
}

export function getLocalizedPersonName(entity, language = "ru", fallback = "") {
  if (!entity) return fallback;
  if (language === "ky") return entity.fullNameKy || entity.full_name_ky || entity.fullName || entity.full_name || fallback;
  if (language === "en") return entity.fullNameEn || entity.full_name_en || entity.fullName || entity.full_name || fallback;
  return entity.fullName || entity.full_name || fallback;
}

export function translateCategoryName(name, language = "ru") {
  const normalized = normalizeLegacyText(name);
  const entry = categoryTranslations[normalized] || categoryTranslations[normalized.toLowerCase()];
  return pickLocalized(entry, language, normalized);
}

export function translateCityName(city, language = "ru") {
  const normalized = normalizeLegacyText(city);
  if (/^\?[\?\s.,:;!()-]*$/.test(normalized)) {
    if (language === "en") return "City unavailable";
    if (language === "ky") return "Шаар көрсөтүлгөн жок";
    return "Город не указан";
  }
  return pickLocalized(cityTranslations[normalized], language, normalized);
}

export function translateKnownText(text, language = "ru") {
  const normalized = normalizeLegacyText(text);
  if (/^\?[\?\s.,:;!()-]*$/.test(normalized)) {
    if (language === "en") return "Text is unavailable";
    if (language === "ky") return "Текст жеткиликсиз";
    return "Текст недоступен";
  }
  const exact = textTranslations[normalized];
  if (exact) return pickLocalized(exact, language, normalized);

  if (language === "ru") return normalized;

  const source = Object.keys(textTranslations)
    .filter((key) => key.length >= 12 && normalized.includes(key))
    .sort((left, right) => right.length - left.length)[0];

  if (!source) return normalized;

  const translatedSource = pickLocalized(textTranslations[source], language, source);
  return normalized.replace(source, translatedSource);
}

export function localizePlan(plan, language = "ru") {
  if (!plan) return plan;
  const translation = subscriptionTranslations[plan.slug];
  const translatedFeatures = translation?.features?.[language];
  return {
    ...plan,
    name: pickLocalized(translation?.name, language, plan.name),
    description: pickLocalized(translation?.description, language, plan.description),
    features: Array.isArray(translatedFeatures)
      ? translatedFeatures
      : Array.isArray(plan.features)
        ? plan.features.map((item) => translateKnownText(item, language))
        : plan.features,
  };
}

export function localizeService(service, language = "ru") {
  if (!service) return service;
  const translation = serviceTranslations[service.slug];
  const translatedBenefits = translation?.benefits?.[language];
  return {
    ...service,
    name: pickLocalized(translation?.name, language, service.name),
    description: pickLocalized(translation?.description, language, translateKnownText(service.description, language)),
    benefits: Array.isArray(translatedBenefits)
      ? translatedBenefits
      : Array.isArray(service.benefits)
        ? service.benefits.map((item) => translateKnownText(item, language))
        : service.benefits,
  };
}

export function localizeJob(job, language = "ru") {
  if (!job) return job;
  return {
    ...job,
    category_name: translateCategoryName(job.category_name, language),
    city: translateCityName(job.city, language),
    title: translateKnownText(job.title, language),
    description: translateKnownText(job.description, language),
    address: translateKnownText(job.address, language),
    location_note: translateKnownText(job.location_note, language),
    customer_name:
      language === "ky"
        ? job.customer_name_ky || job.customer_name
        : language === "en"
          ? job.customer_name_en || job.customer_name
          : job.customer_name,
    worker_name:
      language === "ky"
        ? job.worker_name_ky || job.worker_name
        : language === "en"
          ? job.worker_name_en || job.worker_name
          : job.worker_name,
    responses: Array.isArray(job.responses)
      ? job.responses.map((response) => ({
          ...response,
          worker_name:
            language === "ky"
              ? response.worker_name_ky || response.worker_name
              : language === "en"
                ? response.worker_name_en || response.worker_name
                : response.worker_name,
          message: translateKnownText(response.message, language),
        }))
      : job.responses,
  };
}

export function localizeWorker(worker, language = "ru") {
  if (!worker) return worker;
  const resume = worker.workerResume || {};
  return {
    ...worker,
    fullName: getLocalizedPersonName(worker, language, worker.fullName),
    city: translateCityName(worker.city, language),
    bio: translateKnownText(worker.bio, language),
    directions: Array.isArray(worker.directions) ? worker.directions.map((item) => translateCategoryName(item, language)) : worker.directions,
    skills: Array.isArray(worker.skills) ? worker.skills.map((item) => translateKnownText(item, language)) : worker.skills,
    workerResume: {
      ...resume,
      headline: translateKnownText(resume.headline, language),
      serviceModes: Array.isArray(resume.serviceModes) ? resume.serviceModes.map((item) => translateKnownText(item, language)) : [],
      serviceAreas: Array.isArray(resume.serviceAreas) ? resume.serviceAreas.map((item) => translateCityName(item, language)) : [],
      education: translateKnownText(resume.education, language),
      achievements: translateKnownText(resume.achievements, language),
      languages: Array.isArray(resume.languages) ? resume.languages.map((item) => translateKnownText(item, language)) : [],
      availability: translateKnownText(resume.availability, language),
      pricingNote: translateKnownText(resume.pricingNote, language),
      verificationItems: Array.isArray(resume.verificationItems) ? resume.verificationItems.map((item) => translateKnownText(item, language)) : [],
      verificationNote: translateKnownText(resume.verificationNote, language),
      responseTime: translateKnownText(resume.responseTime, language),
      portfolioHighlights: Array.isArray(resume.portfolioHighlights)
        ? resume.portfolioHighlights.map((item) => translateKnownText(item, language))
        : [],
    },
    reviews: Array.isArray(worker.reviews)
      ? worker.reviews.map((review) => ({
          ...review,
          reviewer_name:
            language === "ky"
              ? review.reviewer_name_ky || review.reviewer_name
              : language === "en"
                ? review.reviewer_name_en || review.reviewer_name
                : review.reviewer_name,
          comment: translateKnownText(review.comment, language),
        }))
      : worker.reviews,
  };
}

export function formatMoney(value, language = "ru", currency = "KGS") {
  const locale = language === "ky" ? "ky-KG" : language === "en" ? "en-US" : "ru-RU";
  const amount = Number(value || 0).toLocaleString(locale);
  if (currency !== "KGS") return `${amount} ${currency}`;
  return language === "en" ? `${amount} KGS` : `${amount} сом`;
}

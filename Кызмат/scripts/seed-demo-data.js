const fs = require("fs");
const path = require("path");

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || "";
const seedBatch = `demo-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;

const locations = {
  bishkek: { city: "Бишкек", latitude: 42.8746, longitude: 74.5698 },
  osh: { city: "Ош", latitude: 40.5283, longitude: 72.7985 },
};

function buildSeedAddress(cityKey) {
  if (cityKey === "bishkek") {
    return "проспект Чуй, 127";
  }

  if (cityKey === "osh") {
    return "улица Ленина, 312";
  }

  return "центральная улица, 15";
}

function buildSeedLocationNote(city) {
  return `${city}: точный подъезд и ориентир можно уточнить в чате.`;
}

const customersBlueprint = [
  {
    fullName: "Асель Токтомбаева",
    cityKey: "bishkek",
    bio: "Часто размещаю бытовые и семейные задачи.",
  },
  {
    fullName: "Кубанычбек Усенов",
    cityKey: "osh",
    bio: "Проверяю сервис для бытовых задач и мелкого ремонта.",
  },
  {
    fullName: "Динара Омурбекова",
    cityKey: "bishkek",
    bio: "Публикую заказы для дома, офиса и онлайн-задач.",
  },
];

const workersBlueprint = [
  {
    fullName: "Бакыт Сапаров",
    cityKey: "bishkek",
    bio: "Сантехника, электрика и мелкий бытовой ремонт.",
    skills: ["сантехника", "электрика", "ремонт"],
  },
  {
    fullName: "Айзада Ормонова",
    cityKey: "bishkek",
    bio: "Генеральная уборка, уборка после ремонта, поддерживающий клининг.",
    skills: ["уборка", "клининг", "химчистка"],
  },
  {
    fullName: "Нурлан Абдылдаев",
    cityKey: "bishkek",
    bio: "Курьерская доставка, документы, небольшие грузы.",
    skills: ["доставка", "курьер", "перевозка"],
  },
  {
    fullName: "Эмиль Султанов",
    cityKey: "bishkek",
    bio: "Настройка сети, офисная техника, базовый IT-аутсорс.",
    skills: ["IT", "wifi", "принтеры", "камеры"],
  },
  {
    fullName: "Мирлан Уста",
    cityKey: "osh",
    bio: "Отделка, шпаклевка, покраска и укладка материалов.",
    skills: ["строительство", "покраска", "ламинат"],
  },
  {
    fullName: "Камила Айтиева",
    cityKey: "bishkek",
    bio: "Лендинги, дизайн, тексты и простые сайты для бизнеса.",
    skills: ["дизайн", "лендинг", "сайт", "IT"],
  },
];

const adminsBlueprint = [
  {
    fullName: "Айбек Админов",
    username: "Админ",
    cityKey: "bishkek",
    bio: "Следит за платформой, пользователями и качеством заказов.",
    skills: ["модерация", "аналитика", "поддержка"],
  },
];

const jobsBlueprint = [
  {
    title: "Починить течь под кухонной раковиной",
    category: "ремонт",
    customer: 0,
    cityKey: "bishkek",
    budget: 3500,
    dueInDays: 1,
    isUrgent: true,
    radiusKm: 8,
    description:
      "Течет соединение под раковиной. Нужна диагностика, герметизация или замена гибкой подводки.",
    responses: [
      { worker: 0, proposedPrice: 3200, etaDays: 1, message: "Могу приехать сегодня вечером с инструментами." },
      { worker: 4, proposedPrice: 3400, etaDays: 1, message: "Сделаю аккуратно, если подойдет время ближе к 20:00." },
    ],
  },
  {
    title: "Генеральная уборка квартиры 64 м2",
    category: "уборка",
    customer: 2,
    cityKey: "bishkek",
    budget: 4800,
    dueInDays: 2,
    radiusKm: 10,
    description:
      "Нужна влажная уборка, кухня, санузел, пыль на полках и мойка полов. Без химчистки мебели.",
    responses: [
      { worker: 1, proposedPrice: 4500, etaDays: 1, message: "Свободна завтра с утра, привезу свои средства." },
    ],
  },
  {
    title: "Срочно доставить документы в аэропорт Манас",
    category: "доставка",
    customer: 0,
    cityKey: "bishkek",
    budget: 1500,
    dueInDays: 0,
    isUrgent: true,
    radiusKm: 20,
    description:
      "Нужно забрать папку в центре Бишкека и привезти в аэропорт в течение 2 часов.",
    responses: [
      { worker: 2, proposedPrice: 1400, etaDays: 1, message: "Готов выехать сразу после подтверждения." },
    ],
  },
  {
    title: "Настроить Wi-Fi и принтер в маленьком офисе",
    category: "IT",
    customer: 2,
    cityKey: "bishkek",
    budget: 4200,
    dueInDays: 3,
    radiusKm: 7,
    description:
      "Интернет работает нестабильно, еще нужно подключить сетевой принтер на 5 ноутбуков.",
    responses: [
      { worker: 3, proposedPrice: 4000, etaDays: 1, message: "Разберусь с роутером и принтером за один визит." },
    ],
  },
  {
    title: "Зашпаклевать и покрасить комнату 18 м2",
    category: "строительство",
    customer: 1,
    cityKey: "osh",
    budget: 22000,
    dueInDays: 5,
    radiusKm: 15,
    description:
      "Нужно подготовить стены после старых обоев и покрасить комнату в светло-бежевый цвет.",
    responses: [
      { worker: 4, proposedPrice: 21000, etaDays: 4, message: "Могу начать в ближайшие дни, есть весь инструмент." },
    ],
  },
  {
    title: "Сделать лендинг для кофейни",
    category: "IT",
    customer: 0,
    cityKey: "bishkek",
    budget: 18000,
    dueInDays: 7,
    radiusKm: 30,
    description:
      "Нужен простой одностраничный сайт: меню, адрес, форма заявки и карта.",
    responses: [
      { worker: 5, proposedPrice: 17000, etaDays: 5, message: "Сделаю аккуратный лендинг с адаптивом и формой." },
      { worker: 3, proposedPrice: 16500, etaDays: 6, message: "Могу взять верстку и базовую интеграцию формы." },
    ],
  },
  {
    title: "Заменить смеситель в ванной",
    category: "ремонт",
    customer: 2,
    cityKey: "bishkek",
    budget: 5000,
    dueInDays: 1,
    radiusKm: 8,
    description:
      "Старый смеситель течет, новый уже куплен. Нужно демонтировать старый и поставить новый.",
    responses: [
      { worker: 0, proposedPrice: 4500, etaDays: 1, message: "Подъеду сегодня после 18:00, работа примерно на час." },
      { worker: 4, proposedPrice: 4700, etaDays: 1, message: "Могу сделать завтра утром." },
    ],
    selectedWorker: 0,
    finalStatus: "in_progress",
  },
  {
    title: "Уборка после ремонта в офисе 90 м2",
    category: "уборка",
    customer: 0,
    cityKey: "bishkek",
    budget: 7000,
    dueInDays: 2,
    radiusKm: 12,
    description:
      "Нужно убрать строительную пыль, вымыть окна изнутри и привести офис в рабочий вид.",
    responses: [
      { worker: 1, proposedPrice: 6800, etaDays: 1, message: "Могу выйти бригадой из двух человек." },
    ],
    selectedWorker: 1,
    finalStatus: "in_progress",
  },
  {
    title: "Забрать мебельный заказ и привезти домой",
    category: "доставка",
    customer: 1,
    cityKey: "osh",
    budget: 2600,
    dueInDays: 1,
    radiusKm: 12,
    description:
      "Нужен аккуратный подъем небольших коробок на 3 этаж. Лифт есть.",
    responses: [
      { worker: 2, proposedPrice: 2400, etaDays: 1, message: "Готов выполнить завтра после обеда." },
    ],
    selectedWorker: 2,
    finalStatus: "completed",
  },
  {
    title: "Подключить IP-камеры в магазине",
    category: "IT",
    customer: 2,
    cityKey: "bishkek",
    budget: 12500,
    dueInDays: 4,
    radiusKm: 10,
    description:
      "Есть 4 камеры и роутер. Нужно смонтировать, подключить и показать, как смотреть запись.",
    responses: [
      { worker: 3, proposedPrice: 11800, etaDays: 2, message: "Смогу сделать монтаж и первичную настройку под ключ." },
    ],
    selectedWorker: 3,
    finalStatus: "completed",
  },
  {
    title: "Уложить ламинат в спальне 14 м2",
    category: "строительство",
    customer: 1,
    cityKey: "osh",
    budget: 16000,
    dueInDays: 6,
    radiusKm: 15,
    description:
      "Основание почти готово, нужен мастер со своим инструментом и аккуратной подрезкой.",
    responses: [
      { worker: 4, proposedPrice: 15500, etaDays: 2, message: "Могу приступить на этой неделе." },
    ],
    finalStatus: "cancelled",
  },
  {
    title: "Собрать шкаф и комод после переезда",
    category: "ремонт",
    customer: 0,
    cityKey: "bishkek",
    budget: 4200,
    dueInDays: 2,
    radiusKm: 9,
    description:
      "Нужно собрать один шкаф и комод из коробок. Инструкция и вся фурнитура на месте.",
    responses: [
      { worker: 0, proposedPrice: 3900, etaDays: 1, message: "Соберу за один вечер, если все детали в комплекте." },
    ],
  },
];

function uniqueEmail(label) {
  return `${label}.${seedBatch}@example.com`;
}

function plusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildDescription(text) {
  return `${text}\n\nТестовый заказ для эксперимента с интерфейсом.\nПартия сидов: ${seedBatch}.`;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(baseUrl, pathname, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data;
}

async function resolveApiBaseUrl() {
  const candidates = [
    process.env.API_URL,
    process.env.DEMO_API_URL,
    "http://localhost:4001",
    "http://localhost:4000",
    "http://127.0.0.1:4001",
    "http://127.0.0.1:4000",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const health = await requestJson(candidate, "/health");
      if (health?.status === "healthy") {
        return candidate;
      }
    } catch {
      await wait(100);
    }
  }

  throw new Error("Не удалось найти запущенный API. Поднимите сервер и повторите команду.");
}

async function registerDemoUser(baseUrl, user) {
  const location = locations[user.cityKey];
  return requestJson(baseUrl, "/auth/register", {
    method: "POST",
    body: {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      password: DEMO_PASSWORD,
      role: user.role,
      city: location.city,
      bio: user.bio,
      skills: user.skills,
    },
  });
}

async function createJob(baseUrl, token, payload) {
  return requestJson(baseUrl, "/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });
}

async function respondToJob(baseUrl, token, payload) {
  return requestJson(baseUrl, "/jobs/respond", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });
}

async function selectWorker(baseUrl, token, jobId, workerId) {
  return requestJson(baseUrl, `/jobs/${jobId}/select-worker`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { workerId },
  });
}

async function updateJobStatus(baseUrl, token, jobId, status) {
  return requestJson(baseUrl, `/jobs/${jobId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { status },
  });
}

async function activateSubscription(baseUrl, token, planSlug) {
  return requestJson(baseUrl, "/subscriptions/activate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { planSlug },
  });
}

async function orderService(baseUrl, token, serviceSlug, note) {
  return requestJson(baseUrl, "/subscriptions/services/order", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      serviceSlug,
      note: note || undefined,
    },
  });
}

async function main() {
  if (!DEMO_PASSWORD) {
    throw new Error("DEMO_SEED_PASSWORD is required to run scripts/seed-demo-data.js");
  }

  const baseUrl = await resolveApiBaseUrl();
  const categories = await requestJson(baseUrl, "/categories");
  const categoryIds = new Map(categories.map((category) => [category.name, category.id]));

  for (const job of jobsBlueprint) {
    if (!categoryIds.has(job.category)) {
      throw new Error(`Категория "${job.category}" не найдена в API.`);
    }
  }

  const customers = [];
  const workers = [];
  const admins = [];

  for (let index = 0; index < customersBlueprint.length; index += 1) {
    const blueprint = customersBlueprint[index];
    const email = uniqueEmail(`customer${index + 1}`);
    const account = await registerDemoUser(baseUrl, {
      ...blueprint,
      role: "customer",
      email,
    });

    customers.push({
      ...account.user,
      token: account.token,
      email,
      password: DEMO_PASSWORD,
    });
  }

  for (let index = 0; index < workersBlueprint.length; index += 1) {
    const blueprint = workersBlueprint[index];
    const email = uniqueEmail(`worker${index + 1}`);
    const account = await registerDemoUser(baseUrl, {
      ...blueprint,
      role: "worker",
      email,
    });

    workers.push({
      ...account.user,
      token: account.token,
      email,
      password: DEMO_PASSWORD,
    });
  }

  for (let index = 0; index < adminsBlueprint.length; index += 1) {
    const blueprint = adminsBlueprint[index];
    const email = uniqueEmail(`admin${index + 1}`);
    const account = await registerDemoUser(baseUrl, {
      ...blueprint,
      role: "admin",
      email,
    });

    admins.push({
      ...account.user,
      token: account.token,
      email,
      password: DEMO_PASSWORD,
    });
  }

  const createdJobs = [];

  for (const blueprint of jobsBlueprint) {
    const customer = customers[blueprint.customer];
    const location = locations[blueprint.cityKey];
    const job = await createJob(baseUrl, customer.token, {
      title: blueprint.title,
      description: buildDescription(blueprint.description),
      budget: blueprint.budget,
      categoryId: categoryIds.get(blueprint.category),
      city: location.city,
      address: buildSeedAddress(blueprint.cityKey),
      locationNote: buildSeedLocationNote(location.city),
      dueDate: plusDays(blueprint.dueInDays),
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: blueprint.radiusKm || 10,
      isUrgent: Boolean(blueprint.isUrgent),
      escrowRequired: blueprint.escrowRequired !== false,
    });

    for (const response of blueprint.responses || []) {
      const worker = workers[response.worker];
      await respondToJob(baseUrl, worker.token, {
        jobId: job.id,
        message: response.message,
        proposedPrice: response.proposedPrice,
        etaDays: response.etaDays,
      });
    }

    if (typeof blueprint.selectedWorker === "number") {
      await selectWorker(baseUrl, customer.token, job.id, workers[blueprint.selectedWorker].id);
    }

    if (blueprint.finalStatus === "completed") {
      await updateJobStatus(baseUrl, customer.token, job.id, "completed");
    } else if (blueprint.finalStatus === "cancelled") {
      await updateJobStatus(baseUrl, customer.token, job.id, "cancelled");
    }

    createdJobs.push({
      id: job.id,
      title: blueprint.title,
      targetStatus: blueprint.finalStatus || "open",
      city: location.city,
      category: blueprint.category,
      budget: blueprint.budget,
    });
  }

  const subscriptionSnapshots = [];
  const serviceOrders = [];

  if (workers[0]) {
    const subscription = await activateSubscription(baseUrl, workers[0].token, "worker-pro-monthly");
    subscriptionSnapshots.push({
      role: "worker",
      email: workers[0].email,
      planSlug: subscription.subscription?.plan?.slug || "worker-pro-monthly",
      endsAt: subscription.subscription?.endsAt || null,
    });

    const paidWorkerService = await orderService(
      baseUrl,
      workers[0].token,
      "worker-profile-boost",
      "Поднять профиль для тестирования каталога исполнителей",
    );
    serviceOrders.push({
      role: "worker",
      email: workers[0].email,
      serviceSlug: paidWorkerService.order.service.slug,
      price: paidWorkerService.order.price,
    });

    const includedWorkerService = await orderService(
      baseUrl,
      workers[0].token,
      "priority-support",
      "Включенная поддержка для специалиста",
    );
    serviceOrders.push({
      role: "worker",
      email: workers[0].email,
      serviceSlug: includedWorkerService.order.service.slug,
      price: includedWorkerService.order.price,
    });
  }

  if (customers[0]) {
    const subscription = await activateSubscription(baseUrl, customers[0].token, "customer-business-monthly");
    subscriptionSnapshots.push({
      role: "customer",
      email: customers[0].email,
      planSlug: subscription.subscription?.plan?.slug || "customer-business-monthly",
      endsAt: subscription.subscription?.endsAt || null,
    });

    const paidCustomerService = await orderService(
      baseUrl,
      customers[0].token,
      "customer-urgent-promo",
      "Продвижение срочного заказа для витрины задач",
    );
    serviceOrders.push({
      role: "customer",
      email: customers[0].email,
      serviceSlug: paidCustomerService.order.service.slug,
      price: paidCustomerService.order.price,
    });

    const includedCustomerService = await orderService(
      baseUrl,
      customers[0].token,
      "safe-deal-check",
      "Проверка безопасной сделки в рамках подписки",
    );
    serviceOrders.push({
      role: "customer",
      email: customers[0].email,
      serviceSlug: includedCustomerService.order.service.slug,
      price: includedCustomerService.order.price,
    });
  }

  const jobs = await requestJson(baseUrl, "/jobs");
  const stats = jobs.reduce(
    (accumulator, job) => {
      accumulator.total += 1;
      accumulator.byStatus[job.status] = (accumulator.byStatus[job.status] || 0) + 1;
      return accumulator;
    },
    { total: 0, byStatus: {} },
  );

  const output = {
    createdAt: new Date().toISOString(),
    apiBaseUrl: baseUrl,
    seedBatch,
    password: DEMO_PASSWORD,
    customers: customers.map(({ token, ...user }) => user),
    workers: workers.map(({ token, ...user }) => user),
    admins: admins.map(({ token, ...user }) => user),
    activeSubscriptions: subscriptionSnapshots,
    orderedServices: serviceOrders,
    createdJobs,
    visibleJobsAfterSeed: stats,
  };

  if (String(process.env.LOG_DEMO_CREDENTIALS || "").toLowerCase() === "true") {
    const logPath = path.resolve(__dirname, "../logs/demo-seed.json");
    fs.writeFileSync(logPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }

  console.log(`Seed batch: ${seedBatch}`);
  console.log(`API: ${baseUrl}`);
  console.log(`Создано заказчиков: ${customers.length}`);
  console.log(`Создано исполнителей: ${workers.length}`);
  console.log(`Создано администраторов: ${admins.length}`);
  console.log(`Создано заказов: ${createdJobs.length}`);
  console.log(`Статусы после сидинга: ${JSON.stringify(stats.byStatus)}`);
  console.log(`Данные аккаунтов сохранены в logs/demo-seed.json`);
}

main().catch((error) => {
  console.error("Не удалось создать демо-данные:", error.message);
  process.exitCode = 1;
});

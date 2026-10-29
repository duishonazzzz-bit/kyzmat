import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney, localizePlan, localizeService, translateKnownText } from "../i18n/contentTranslations";

const pageCopy = {
  ru: {
    customerTitle: "Подписки для заказчиков",
    workerTitle: "Подписки для специалистов",
    allTitle: "Подписки и услуги платформы",
    customerSubtitle: "Ускоряйте подбор исполнителей, продвигайте задачи и подключайте полезные сервисы.",
    workerSubtitle: "Усиливайте профиль, выделяйте отклики и подключайте сервисы для роста заказов.",
    allSubtitle: "Каталог тарифов и сервисных опций KYZMAT для активных пользователей платформы.",
    badgeCustomer: "Для заказчиков",
    badgeWorker: "Для специалистов",
    badgeAll: "Сервисы KYZMAT",
    plans: "Планы",
    services: "Услуги",
    paid: "Платных услуг",
    included: "Включённых услуг",
    currentSubscription: "Текущая подписка",
    currentSubtitle: "Сводка по активному тарифу и PRO-статусу аккаунта.",
    backToProfile: "Вернуться в профиль",
    active: "Активно",
    universal: "Универсальный",
    forWorker: "Для специалиста",
    forCustomer: "Для заказчика",
    until: "до",
    start: "Старт",
    end: "Окончание",
    accountStatus: "Статус аккаунта",
    proActive: "PRO активен",
    basic: "Базовый",
    noSubscription: "Активной подписки пока нет",
    noSubscriptionText: "Ниже можно подключить тариф и сразу открыть доступ к PRO-статусу и сервисным услугам.",
    tariffs: "Тарифы",
    tariffsText: "Подберите подписку под вашу роль и частоту работы на платформе.",
    purchaseDisabled: "Для вашей роли покупка тарифов отключена",
    servicesTitle: "Разовые услуги и сервисные опции",
    servicesText: "Часть услуг покупается отдельно, а часть открывается бесплатно при активной подписке.",
    ordersTitle: "Последние заказанные услуги",
    ordersEmpty: "Вы ещё не пользовались сервисными услугами.",
    loading: "Загрузка подписок...",
    loadError: "Не удалось загрузить подписки",
    activateError: "Не удалось активировать подписку",
    activateSuccess: "Подписка активирована",
    orderError: "Не удалось оформить услугу",
    orderSuccess: "Услуга заказана",
    monthly: "в месяц",
    quarterly: "за квартал",
    yearly: "за год",
    includedPlan: "Включено в подписку",
    oneTime: "Разовая услуга",
    activePlan: "Активный план",
    alreadyConnected: "Уже подключено",
    connect: "Подключить",
    connecting: "Подключение...",
    activateIncluded: "Активировать в подписке",
    needSubscription: "Нужна подписка",
    ordering: "Оформление...",
    orderFor: "Заказать за",
    withinSubscription: "В рамках подписки",
    oneTimeOrder: "Разовая услуга",
  },
  ky: {
    customerTitle: "Кардарлар үчүн жазылуулар",
    workerTitle: "Адистер үчүн жазылуулар",
    allTitle: "Платформанын жазылуулары жана кызматтары",
    customerSubtitle: "Аткаруучуларды тезирээк тандап, тапшырмаларды жылдырып жана пайдалуу сервистерди кошуңуз.",
    workerSubtitle: "Профилди күчөтүп, жоопторду өзгөчөлөп жана көбүрөөк заказ алуу үчүн сервистерди кошуңуз.",
    allSubtitle: "KYZMAT платформасынын активдүү колдонуучулары үчүн тарифтер жана сервис мүмкүнчүлүктөрү.",
    badgeCustomer: "Кардарлар үчүн",
    badgeWorker: "Адистер үчүн",
    badgeAll: "KYZMAT сервистери",
    plans: "Пландар",
    services: "Кызматтар",
    paid: "Акы төлөнгөн кызмат",
    included: "Кирген кызмат",
    currentSubscription: "Учурдагы жазылуу",
    currentSubtitle: "Активдүү тариф жана аккаунттун PRO-макамы боюнча кыскача маалымат.",
    backToProfile: "Профилге кайтуу",
    active: "Активдүү",
    universal: "Универсалдуу",
    forWorker: "Адис үчүн",
    forCustomer: "Кардар үчүн",
    until: "чейин",
    start: "Башталышы",
    end: "Аякташы",
    accountStatus: "Аккаунт макамы",
    proActive: "PRO активдүү",
    basic: "Негизги",
    noSubscription: "Азырынча активдүү жазылуу жок",
    noSubscriptionText: "Төмөндөн тариф кошуп, дароо PRO-макамга жана сервис кызматтарына мүмкүнчүлүк ача аласыз.",
    tariffs: "Тарифтер",
    tariffsText: "Платформадагы ролуңузга жана активдүүлүгүңүзгө жараша жазылууну тандаңыз.",
    purchaseDisabled: "Бул роль үчүн тариф сатып алуу өчүрүлгөн",
    servicesTitle: "Бир жолку кызматтар жана сервис мүмкүнчүлүктөрү",
    servicesText: "Айрым кызматтар өзүнчө алынат, айрымдары активдүү жазылуу менен акысыз ачылат.",
    ordersTitle: "Акыркы заказ кылынган кызматтар",
    ordersEmpty: "Сиз сервис кызматтарын азырынча колдоно элексиз.",
    loading: "Жазылуулар жүктөлүүдө...",
    loadError: "Жазылууларды жүктөө мүмкүн болгон жок",
    activateError: "Жазылууну активдештирүү мүмкүн болгон жок",
    activateSuccess: "Жазылуу активдешти",
    orderError: "Кызматты каттоо мүмкүн болгон жок",
    orderSuccess: "Кызмат заказ кылынды",
    monthly: "айына",
    quarterly: "чейрегине",
    yearly: "жылына",
    includedPlan: "Жазылууга кирет",
    oneTime: "Бир жолку кызмат",
    activePlan: "Активдүү план",
    alreadyConnected: "Буга чейин кошулган",
    connect: "Кошуу",
    connecting: "Кошулууда...",
    activateIncluded: "Жазылуунун ичинде иштетүү",
    needSubscription: "Жазылуу керек",
    ordering: "Катталууда...",
    orderFor: "Заказ кылуу",
    withinSubscription: "Жазылуунун алкагында",
    oneTimeOrder: "Бир жолку кызмат",
  },
  en: {
    customerTitle: "Subscriptions for customers",
    workerTitle: "Subscriptions for specialists",
    allTitle: "Platform subscriptions and services",
    customerSubtitle:
      "Speed up specialist selection, boost your requests, and unlock useful service tools.",
    workerSubtitle:
      "Strengthen your profile, highlight responses, and connect services that help you win more jobs.",
    allSubtitle:
      "A catalog of KYZMAT plans and service options for active platform users.",
    badgeCustomer: "For customers",
    badgeWorker: "For specialists",
    badgeAll: "KYZMAT services",
    plans: "Plans",
    services: "Services",
    paid: "Paid services",
    included: "Included services",
    currentSubscription: "Current subscription",
    currentSubtitle: "A quick summary of your active plan and account PRO status.",
    backToProfile: "Back to profile",
    active: "Active",
    universal: "Universal",
    forWorker: "For specialist",
    forCustomer: "For customer",
    until: "until",
    start: "Start",
    end: "End",
    accountStatus: "Account status",
    proActive: "PRO active",
    basic: "Basic",
    noSubscription: "No active subscription yet",
    noSubscriptionText:
      "Choose a plan below to unlock PRO status and service features right away.",
    tariffs: "Plans",
    tariffsText: "Pick a subscription that matches your role and activity on the platform.",
    purchaseDisabled: "Plan purchases are disabled for your role",
    servicesTitle: "One-time services and service options",
    servicesText:
      "Some services are purchased separately, while others are unlocked for free with an active subscription.",
    ordersTitle: "Recent ordered services",
    ordersEmpty: "You have not used service options yet.",
    loading: "Loading subscriptions...",
    loadError: "Unable to load subscriptions",
    activateError: "Unable to activate subscription",
    activateSuccess: "Subscription activated",
    orderError: "Unable to order service",
    orderSuccess: "Service ordered",
    monthly: "per month",
    quarterly: "per quarter",
    yearly: "per year",
    includedPlan: "Included in plan",
    oneTime: "One-time service",
    activePlan: "Active plan",
    alreadyConnected: "Already connected",
    connect: "Connect",
    connecting: "Connecting...",
    activateIncluded: "Activate within plan",
    needSubscription: "Subscription required",
    ordering: "Ordering...",
    orderFor: "Order for",
    withinSubscription: "Within subscription",
    oneTimeOrder: "One-time service",
  },
};

function formatDate(value, language = "ru") {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(language === "ky" ? "ky-KG" : language === "en" ? "en-US" : "ru-RU");
}

function SubscriptionsPage() {
  const { user, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activePlanSlug, setActivePlanSlug] = useState("");
  const [activeServiceSlug, setActiveServiceSlug] = useState("");

  const audienceRole = data?.audienceRole || (user?.role === "worker" || user?.role === "customer" ? user.role : "all");
  const currentSubscription = data?.currentSubscription || null;

  const meta = useMemo(() => {
    if (audienceRole === "customer") {
      return { title: copy.customerTitle, subtitle: copy.customerSubtitle, badge: copy.badgeCustomer };
    }
    if (audienceRole === "worker") {
      return { title: copy.workerTitle, subtitle: copy.workerSubtitle, badge: copy.badgeWorker };
    }
    return { title: copy.allTitle, subtitle: copy.allSubtitle, badge: copy.badgeAll };
  }, [audienceRole, copy]);

  const stats = useMemo(() => {
    const paidServices = (data?.serviceOrders || []).filter((order) => Number(order.price || 0) > 0).length;
    const includedServices = (data?.serviceOrders || []).filter((order) => Number(order.price || 0) === 0).length;
    return {
      plans: data?.plans?.length || 0,
      services: data?.services?.length || 0,
      paidServices,
      includedServices,
    };
  }, [data]);

  const localizedCurrentSubscription = useMemo(() => {
    if (!currentSubscription) return null;
    return {
      ...currentSubscription,
      plan: localizePlan(currentSubscription.plan, language),
    };
  }, [currentSubscription, language]);

  const localizedPlans = useMemo(() => (data?.plans || []).map((plan) => localizePlan(plan, language)), [data?.plans, language]);
  const localizedServices = useMemo(() => (data?.services || []).map((service) => localizeService(service, language)), [data?.services, language]);
  const localizedOrders = useMemo(
    () =>
      (data?.serviceOrders || []).map((order) => ({
        ...order,
        service: localizeService(order.service, language),
        note: translateKnownText(order.note, language),
      })),
    [data?.serviceOrders, language],
  );

  const formatBillingPeriod = (period) => {
    if (period === "quarterly") return copy.quarterly;
    if (period === "yearly") return copy.yearly;
    return copy.monthly;
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: response } = await api.get("/subscriptions/me");
      setData(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [language, user?.id, user?.role]);

  const handleActivatePlan = async (planSlug) => {
    setActivePlanSlug(planSlug);
    setSuccess("");
    setError("");
    try {
      const { data: response } = await api.post("/subscriptions/activate", { planSlug });
      setSuccess(response.message || copy.activateSuccess);
      await refreshProfile();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.activateError);
    } finally {
      setActivePlanSlug("");
    }
  };

  const handleOrderService = async (serviceSlug) => {
    setActiveServiceSlug(serviceSlug);
    setSuccess("");
    setError("");
    try {
      const { data: response } = await api.post("/subscriptions/services/order", { serviceSlug });
      setSuccess(response.message || copy.orderSuccess);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.orderError);
    } finally {
      setActiveServiceSlug("");
    }
  };

  if (loading) {
    return <section className="panel">{copy.loading}</section>;
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="badge">{meta.badge}</span>
            <h1 className="title mt-4">{meta.title}</h1>
            <p className="subtitle">{meta.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="badge">{copy.plans}: {stats.plans}</span>
              <span className="badge">{copy.services}: {stats.services}</span>
              <span className="badge">{copy.paid}: {stats.paidServices}</span>
              <span className="badge">{copy.included}: {stats.includedServices}</span>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#4f0e1f] via-[#72122a] to-[#a21a39] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f6d9df]">{meta.badge}</p>
            <h2 className="mt-3 font-display text-2xl font-bold">{meta.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">{meta.subtitle}</p>
          </div>
        </div>
      </section>

      {error && <section className="panel text-sm font-medium text-red-600">{error}</section>}
      {success && <section className="panel text-sm font-medium text-emerald-700">{success}</section>}

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.currentSubscription}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.currentSubtitle}</p>
          </div>
          <Link className="btn-secondary" to="/profile">
            {copy.backToProfile}
          </Link>
        </div>

        {localizedCurrentSubscription ? (
          <div className="mt-5 rounded-3xl border border-[#d8a3b0] bg-[#fbf0f2] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">{copy.active}</span>
                  <span className="badge">
                    {localizedCurrentSubscription.plan.roleScope === "all"
                      ? copy.universal
                      : localizedCurrentSubscription.plan.roleScope === "worker"
                        ? copy.forWorker
                        : copy.forCustomer}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-bold text-slate-950">{localizedCurrentSubscription.plan.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{localizedCurrentSubscription.plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-950">{formatMoney(localizedCurrentSubscription.amountPaid, language, localizedCurrentSubscription.currency)}</p>
                <p className="text-sm text-slate-500">{copy.until} {formatDate(localizedCurrentSubscription.endsAt, language)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                <p className="text-xs uppercase text-slate-500">{copy.start}</p>
                <p className="mt-2 font-bold text-slate-900">{formatDate(localizedCurrentSubscription.startsAt, language)}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                <p className="text-xs uppercase text-slate-500">{copy.end}</p>
                <p className="mt-2 font-bold text-slate-900">{formatDate(localizedCurrentSubscription.endsAt, language)}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                <p className="text-xs uppercase text-slate-500">{copy.accountStatus}</p>
                <p className="mt-2 font-bold text-slate-900">{user?.isPro ? copy.proActive : copy.basic}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-white/80 p-5">
            <p className="text-lg font-bold text-slate-900">{copy.noSubscription}</p>
            <p className="mt-2 text-sm text-slate-600">{copy.noSubscriptionText}</p>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.tariffs}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.tariffsText}</p>
          </div>
          {!data?.canBuySubscriptions && <span className="badge border-slate-400 bg-slate-100 text-slate-700">{copy.purchaseDisabled}</span>}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {localizedPlans.map((plan) => {
            const isCurrent = localizedCurrentSubscription?.plan?.slug === plan.slug;
            return (
              <article
                key={plan.slug}
                className={`rounded-3xl border p-5 ${isCurrent ? "border-[#d8a3b0] bg-[#fbf0f2]" : "border-slate-200 bg-white/80"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge">
                        {plan.roleScope === "worker" ? copy.forWorker : plan.roleScope === "customer" ? copy.forCustomer : copy.universal}
                      </span>
                      {isCurrent && <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">{copy.activePlan}</span>}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold text-slate-950">{plan.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-950">{formatMoney(plan.price, language, plan.currency)}</p>
                    <p className="text-sm text-slate-500">{formatBillingPeriod(plan.billingPeriod)}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-700">
                  {(plan.features || []).map((feature) => (
                    <p key={feature}>- {feature}</p>
                  ))}
                </div>

                <div className="mt-5">
                  <button className="btn-primary" disabled={!data?.canBuySubscriptions || activePlanSlug === plan.slug || isCurrent} onClick={() => handleActivatePlan(plan.slug)} type="button">
                    {isCurrent ? copy.alreadyConnected : activePlanSlug === plan.slug ? copy.connecting : copy.connect}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.servicesTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{copy.servicesText}</p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {localizedServices.map((service) => {
            const included = service.billingType === "subscription_included";
            const actionDisabled =
              !data?.canBuySubscriptions ||
              activeServiceSlug === service.slug ||
              (included && !localizedCurrentSubscription);
            return (
              <article key={service.slug} className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge">
                        {service.targetRole === "worker" ? copy.forWorker : service.targetRole === "customer" ? copy.forCustomer : copy.universal}
                      </span>
                      <span className={`badge ${included ? "border-emerald-300 bg-emerald-100 text-emerald-800" : ""}`}>
                        {included ? copy.includedPlan : copy.oneTime}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-950">{service.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-950">{included ? formatMoney(0, language, service.currency) : formatMoney(service.price, language, service.currency)}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-700">
                  {(service.benefits || []).map((benefit) => (
                    <p key={benefit}>- {benefit}</p>
                  ))}
                </div>

                <div className="mt-5">
                  <button className="btn-secondary" disabled={actionDisabled} onClick={() => handleOrderService(service.slug)} type="button">
                    {included
                      ? localizedCurrentSubscription
                        ? copy.activateIncluded
                        : copy.needSubscription
                      : activeServiceSlug === service.slug
                        ? copy.ordering
                        : `${copy.orderFor} ${formatMoney(service.price, language, service.currency)}`}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.ordersTitle}</h2>
        {!localizedOrders.length ? (
          <p className="mt-4 text-sm text-slate-600">{copy.ordersEmpty}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {localizedOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{order.service.name}</h3>
                    <p className="text-sm text-slate-600">
                      {order.service.billingType === "subscription_included" ? copy.withinSubscription : copy.oneTimeOrder} · {formatDate(order.createdAt, language)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{formatMoney(order.price, language, order.currency)}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{order.status}</p>
                  </div>
                </div>
                {order.note && <p className="mt-3 text-sm text-slate-700">{translateKnownText(order.note, language)}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SubscriptionsPage;


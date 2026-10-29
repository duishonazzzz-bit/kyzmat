import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { RatingInline } from "../components/RatingDisplay";
import { useLanguage } from "../context/LanguageContext";
import { getLocalizedPersonName, localizeJob, localizePlan, localizeService, translateKnownText } from "../i18n/contentTranslations";
import { getAdminCopy, getAdminCurrencySuffix, getAdminLocale, getAdminOptions } from "./adminCabinet.i18n.js";

function formatMoney(value, language = "ky", currency = "KGS") {
  const amount = Number(value || 0).toLocaleString(getAdminLocale(language));
  return `${amount} ${getAdminCurrencySuffix(language, currency)}`;
}

function formatDate(value, language = "ky") {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(getAdminLocale(language));
}

function formatDateTime(value, language = "ky") {
  if (!value) return "—";
  return new Date(value).toLocaleString(getAdminLocale(language));
}

function toMultiline(values) {
  return Array.isArray(values) ? values.join("\n") : "";
}

function fromMultiline(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPlanDraft(plan) {
  return {
    ...plan,
    price: String(plan.price ?? ""),
    sortOrder: String(plan.sortOrder ?? 100),
    featuresText: toMultiline(plan.features),
  };
}

function buildServiceDraft(service) {
  return {
    ...service,
    price: String(service.price ?? ""),
    sortOrder: String(service.sortOrder ?? 100),
    benefitsText: toMultiline(service.benefits),
  };
}

function buildUserDraft(account) {
  return {
    ...account,
    fullNameKy: account.fullNameKy || "",
    fullNameEn: account.fullNameEn || "",
    selectedPlanId: account.currentSubscription?.planId ? String(account.currentSubscription.planId) : "",
    newPassword: "",
    confirmPassword: "",
  };
}

function getAllowedPlansForRole(plans, role) {
  if (!["customer", "worker"].includes(role)) {
    return [];
  }

  return plans.filter((plan) => plan.isActive && (plan.roleScope === role || plan.roleScope === "all"));
}

function formatPlanPeriodLabel(period, language = "ky") {
  switch (period) {
    case "quarterly":
      return language === "en" ? "quarter" : language === "ru" ? "квартал" : "чейрек";
    case "yearly":
      return language === "en" ? "year" : language === "ru" ? "год" : "жыл";
    default:
      return language === "en" ? "month" : language === "ru" ? "месяц" : "ай";
  }
}

function createEmptyPlan() {
  return {
    slug: "",
    name: "",
    roleScope: "worker",
    billingPeriod: "monthly",
    price: "0",
    currency: "KGS",
    description: "",
    featuresText: "",
    isPro: true,
    isActive: true,
    sortOrder: "100",
  };
}

function createEmptyService() {
  return {
    slug: "",
    name: "",
    targetRole: "worker",
    billingType: "one_time",
    price: "0",
    currency: "KGS",
    description: "",
    benefitsText: "",
    isActive: true,
    sortOrder: "100",
  };
}

function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
    </article>
  );
}

function UserCard({ account, plans, profileBusy, passwordBusy, subscriptionBusy, blockBusy, onChange, onSave, onPasswordSave, onSubscriptionSave, onBlockToggle }) {
  const { language } = useLanguage();
  const copy = getAdminCopy(language);
  const options = getAdminOptions(language);
  const availablePlans = getAllowedPlansForRole(plans, account.role);
  const canManageSubscription = ["customer", "worker"].includes(account.role);
  const localizedName = getLocalizedPersonName(account, language, account.fullName);
  const localizedCurrentSubscription = account.currentSubscription
    ? { ...account.currentSubscription, name: localizePlan(account.currentSubscription, language)?.name || account.currentSubscription.name }
    : null;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">{options.roleOptions.find((item) => item.value === account.role)?.label || account.role}</span>
            {account.isPro && <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">PRO</span>}
            {account.isBlocked && <span className="badge border-red-300 bg-red-100 text-red-700">{copy.blockedBadge}</span>}
            {localizedCurrentSubscription && <span className="badge">{localizedCurrentSubscription.name}</span>}
          </div>
          <p className="mt-3 text-xl font-bold text-slate-950">{localizedName}</p>
          <p className="mt-3 text-sm text-slate-600">{language === "en" ? "Created:" : language === "ru" ? "Создан:" : "Түзүлгөн күнү:"} {formatDate(account.createdAt, language)}</p>
        </div>
        <div className="text-right text-sm text-slate-600">
          <RatingInline rating={account.rating || 0} reviews={account.totalReviews || 0} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">{language === "en" ? "Name" : language === "ru" ? "Имя" : "Аты"}</label>
          <input className="input" value={account.fullName} onChange={(event) => onChange(account.id, "fullName", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "City" : language === "ru" ? "Город" : "Шаар"}</label>
          <input className="input" value={account.city || ""} onChange={(event) => onChange(account.id, "city", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Name in Kyrgyz" : language === "ru" ? "Имя на кыргызском" : "Аты кыргызча"}</label>
          <input className="input" value={account.fullNameKy || ""} onChange={(event) => onChange(account.id, "fullNameKy", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Name in English" : language === "ru" ? "Имя на английском" : "Аты англисче"}</label>
          <input className="input" value={account.fullNameEn || ""} onChange={(event) => onChange(account.id, "fullNameEn", event.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={account.email || ""} onChange={(event) => onChange(account.id, "email", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Phone" : language === "ru" ? "Телефон" : "Телефон"}</label>
          <input className="input" value={account.phone || ""} onChange={(event) => onChange(account.id, "phone", event.target.value)} />
        </div>
        {account.role === "worker" && (
          <div className="md:col-span-2">
            <label className="label">
              {language === "en"
                ? "Specialist description (shown on card)"
                : language === "ru"
                  ? "Описание исполнителя (видно в карточке)"
                  : "Аткаруучунун сүрөттөмөсү (карточкада көрүнөт)"}
            </label>
            <textarea
              className="input min-h-24"
              maxLength={1200}
              placeholder={language === "en" ? "Short description of services and experience" : language === "ru" ? "Кратко об услугах и опыте" : "Кызматтары жана тажрыйбасы жөнүндө кыскача"}
              value={account.bio || ""}
              onChange={(event) => onChange(account.id, "bio", event.target.value)}
            />
          </div>
        )}
        <div>
          <label className="label">{language === "en" ? "Role" : language === "ru" ? "Роль" : "Роль"}</label>
          <select className="input" value={account.role} onChange={(event) => onChange(account.id, "role", event.target.value)}>
            {options.roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === "en" ? "Subscription" : language === "ru" ? "Подписка" : "Жазылуу"}</label>
          <select className="input" disabled={!canManageSubscription} value={account.selectedPlanId ?? ""} onChange={(event) => onChange(account.id, "selectedPlanId", event.target.value)}>
            <option value="">{language === "en" ? "No active subscription" : language === "ru" ? "Нет активной подписки" : "Активдүү жазылуусу жок"}</option>
            {availablePlans.map((plan) => {
              const localizedPlan = localizePlan(plan, language);
              return (
                <option key={plan.id} value={plan.id}>
                  {localizedPlan.name} · {formatPlanPeriodLabel(plan.billingPeriod, language)}
                </option>
              );
            })}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            {!canManageSubscription
              ? language === "en" ? "Subscriptions are not assigned to administrators." : language === "ru" ? "Администратору подписки не назначаются." : "Администраторго жазылуу дайындалбайт."
              : account.currentSubscription
                ? `${language === "en" ? "Current period ends:" : language === "ru" ? "Текущий период до:" : "Учурда активдүү мөөнөтү:"} ${formatDate(account.currentSubscription.endsAt, language)}`
                : language === "en" ? "You can assign a new plan to this user." : language === "ru" ? "Этому пользователю можно назначить новый тариф." : "Колдонуучуга жаңы тариф дайындасаңыз болот."}
          </p>
        </div>
        <div>
          <label className="label">{language === "en" ? "New password" : language === "ru" ? "Новый пароль" : "Жаңы сырсөз"}</label>
          <input className="input" type="password" value={account.newPassword || ""} onChange={(event) => onChange(account.id, "newPassword", event.target.value)} placeholder={language === "en" ? "At least 6 characters" : language === "ru" ? "Минимум 6 символов" : "Кеминде 6 белги"} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Repeat password" : language === "ru" ? "Повторите пароль" : "Сырсөздү кайталоо"}</label>
          <input className="input" type="password" value={account.confirmPassword || ""} onChange={(event) => onChange(account.id, "confirmPassword", event.target.value)} placeholder={language === "en" ? "Repeat the new password" : language === "ru" ? "Повторите новый пароль" : "Жаңы сырсөздү кайталаңыз"} />
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{language === "en" ? "Only an administrator can change another user's password here." : language === "ru" ? "Здесь пароль пользователя может менять только администратор." : "Колдонуучунун сырсөзүн бул жерде администратор гана өзгөртө алат."}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={profileBusy} onClick={() => onSave(account)} type="button">
          {profileBusy ? (language === "en" ? "Saving..." : language === "ru" ? "Сохраняем..." : "Сакталып жатат...") : (language === "en" ? "Save user" : language === "ru" ? "Сохранить пользователя" : "Колдонуучуну сактоо")}
        </button>
        <button className="btn-secondary" disabled={passwordBusy} onClick={() => onPasswordSave(account)} type="button">
          {passwordBusy ? (language === "en" ? "Updating..." : language === "ru" ? "Обновляем..." : "Өзгөртүлүүдө...") : (language === "en" ? "Change password" : language === "ru" ? "Изменить пароль" : "Сырсөздү өзгөртүү")}
        </button>
        <button className="btn-secondary" disabled={!canManageSubscription || subscriptionBusy} onClick={() => onSubscriptionSave(account)} type="button">
          {subscriptionBusy ? (language === "en" ? "Updating..." : language === "ru" ? "Обновляем..." : "Жаңыртылууда...") : (language === "en" ? "Update subscription" : language === "ru" ? "Обновить подписку" : "Жазылууну жаңыртуу")}
        </button>
        {account.role !== "admin" && (
          <button
            className={account.isBlocked ? "btn-secondary border-emerald-300 text-emerald-700" : "btn-secondary border-red-300 text-red-700"}
            disabled={blockBusy}
            onClick={() => onBlockToggle(account)}
            type="button"
          >
            {blockBusy ? copy.blockProcessing : account.isBlocked ? copy.unblockUser : copy.blockUser}
          </button>
        )}
      </div>
    </article>
  );
}

function JobCard({ job, busy, deleteBusy, onChange, onSave, onDelete }) {
  const { language } = useLanguage();
  const copy = getAdminCopy(language);
  const options = getAdminOptions(language);
  const localizedJob = localizeJob(
    {
      ...job,
      category_name: job.category?.name,
    },
    language,
  );
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">{localizedJob.category_name}</span>
            {job.isUrgent && <span className="badge border-red-300 bg-red-100 text-red-700">{language === "en" ? "Urgent" : language === "ru" ? "Срочно" : "Шашылыш"}</span>}
          </div>
          <h3 className="mt-3 text-xl font-bold text-slate-950">{localizedJob.title}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {language === "en" ? "Customer" : language === "ru" ? "Заказчик" : "Кардар"}: {job.customer.fullName}
            {job.worker ? ` · ${language === "en" ? "Specialist" : language === "ru" ? "Исполнитель" : "Аткаруучу"}: ${job.worker.fullName}` : ` · ${language === "en" ? "No specialist assigned" : language === "ru" ? "Исполнитель не назначен" : "Аткаруучу дайындалган эмес"}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-950">{formatMoney(job.budget, language)}</p>
          <p className="text-sm text-slate-500">{job.responsesCount} {language === "en" ? "responses" : language === "ru" ? "откликов" : "жооп"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">{language === "en" ? "Job status" : language === "ru" ? "Статус заказа" : "Заказдын абалы"}</label>
          <select className="input" value={job.status} onChange={(event) => onChange(job.id, "status", event.target.value)}>
            {options.jobStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === "en" ? "Secure payment" : language === "ru" ? "Безопасная сделка" : "Коопсуз төлөм"}</label>
          <select className="input" value={job.escrowStatus} onChange={(event) => onChange(job.id, "escrowStatus", event.target.value)}>
            {options.escrowStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={busy} onClick={() => onSave(job)} type="button">
          {busy ? (language === "en" ? "Saving..." : language === "ru" ? "Сохраняем..." : "Сакталып жатат...") : (language === "en" ? "Update job" : language === "ru" ? "Обновить заказ" : "Заказды жаңыртуу")}
        </button>
        <Link className="btn-secondary" to={`/jobs/${job.id}`}>
          {language === "en" ? "Open job" : language === "ru" ? "Открыть заказ" : "Заказды ачуу"}
        </Link>
        <button className="btn-secondary border-red-300 text-red-700" disabled={deleteBusy} onClick={() => onDelete(job)} type="button">
          {deleteBusy ? copy.deleting : copy.deleteJob}
        </button>
      </div>
    </article>
  );
}

function PlanCard({ plan, busy, onChange, onSave }) {
  const { language } = useLanguage();
  const options = getAdminOptions(language);
  const localizedPlan = localizePlan(plan, language);
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">{plan.slug}</span>
            {plan.isActive ? <span className="badge border-emerald-300 bg-emerald-100 text-emerald-800">{language === "en" ? "Active" : language === "ru" ? "Активен" : "Активдүү"}</span> : <span className="badge border-slate-300 bg-slate-100 text-slate-600">{language === "en" ? "Disabled" : language === "ru" ? "Выключен" : "Өчүк"}</span>}
          </div>
          <h3 className="mt-3 text-xl font-bold text-slate-950">{localizedPlan.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{localizedPlan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-950">{formatMoney(plan.price, language, plan.currency)}</p>
          <p className="text-sm text-slate-500">{language === "en" ? "Order" : language === "ru" ? "Порядок" : "Тартип"}: {plan.sortOrder}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Slug</label>
          <input className="input" value={plan.slug} onChange={(event) => onChange(plan.id, "slug", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Name" : language === "ru" ? "Название" : "Аталышы"}</label>
          <input className="input" value={plan.name} onChange={(event) => onChange(plan.id, "name", event.target.value)} />
          {localizedPlan.name !== plan.name ? <p className="mt-2 text-xs text-slate-500">{localizedPlan.name}</p> : null}
        </div>
        <div>
          <label className="label">{language === "en" ? "Target role" : language === "ru" ? "Для кого" : "Ким үчүн"}</label>
          <select className="input" value={plan.roleScope} onChange={(event) => onChange(plan.id, "roleScope", event.target.value)}>
            {options.planRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === "en" ? "Billing period" : language === "ru" ? "Период" : "Мөөнөтү"}</label>
          <select className="input" value={plan.billingPeriod} onChange={(event) => onChange(plan.id, "billingPeriod", event.target.value)}>
            {options.billingPeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === "en" ? "Price" : language === "ru" ? "Цена" : "Баасы"}</label>
          <input className="input" type="number" value={plan.price} onChange={(event) => onChange(plan.id, "price", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Order" : language === "ru" ? "Порядок" : "Тартиби"}</label>
          <input className="input" type="number" value={plan.sortOrder} onChange={(event) => onChange(plan.id, "sortOrder", event.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{language === "en" ? "Description" : language === "ru" ? "Описание" : "Сүрөттөмө"}</label>
          <textarea className="input min-h-24" value={plan.description} onChange={(event) => onChange(plan.id, "description", event.target.value)} />
          {localizedPlan.description !== plan.description ? <p className="mt-2 text-xs text-slate-500">{localizedPlan.description}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label className="label">{language === "en" ? "Plan features" : language === "ru" ? "Возможности тарифа" : "Тарифтин мүмкүнчүлүктөрү"}</label>
          <textarea className="input min-h-28" value={plan.featuresText} onChange={(event) => onChange(plan.id, "featuresText", event.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input checked={plan.isPro} onChange={(event) => onChange(plan.id, "isPro", event.target.checked)} type="checkbox" />
          {language === "en" ? "Grants PRO status" : language === "ru" ? "Даёт PRO-статус" : "PRO макамын берет"}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input checked={plan.isActive} onChange={(event) => onChange(plan.id, "isActive", event.target.checked)} type="checkbox" />
          {language === "en" ? "Active" : language === "ru" ? "Активен" : "Активдүү"}
        </label>
      </div>

      <div className="mt-4">
        <button className="btn-primary" disabled={busy} onClick={() => onSave(plan)} type="button">
          {busy ? (language === "en" ? "Saving..." : language === "ru" ? "Сохраняем..." : "Сакталып жатат...") : (language === "en" ? "Save plan" : language === "ru" ? "Сохранить тариф" : "Тарифти сактоо")}
        </button>
      </div>
    </article>
  );
}

function ServiceCard({ service, busy, onChange, onSave }) {
  const { language } = useLanguage();
  const options = getAdminOptions(language);
  const localizedService = localizeService(service, language);
  const localizedServiceDescription = translateKnownText(service.description, language);
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">{service.slug}</span>
            {service.isActive ? <span className="badge border-emerald-300 bg-emerald-100 text-emerald-800">{language === "en" ? "Active" : language === "ru" ? "Активна" : "Активдүү"}</span> : <span className="badge border-slate-300 bg-slate-100 text-slate-600">{language === "en" ? "Disabled" : language === "ru" ? "Выключена" : "Өчүк"}</span>}
          </div>
          <h3 className="mt-3 text-xl font-bold text-slate-950">{localizedService.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{localizedServiceDescription}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-950">{formatMoney(service.price, language, service.currency)}</p>
          <p className="text-sm text-slate-500">{language === "en" ? "Order" : language === "ru" ? "Порядок" : "Тартип"}: {service.sortOrder}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Slug</label>
          <input className="input" value={service.slug} onChange={(event) => onChange(service.id, "slug", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Name" : language === "ru" ? "Название" : "Аталышы"}</label>
          <input className="input" value={service.name} onChange={(event) => onChange(service.id, "name", event.target.value)} />
          {localizedService.name !== service.name ? <p className="mt-2 text-xs text-slate-500">{localizedService.name}</p> : null}
        </div>
        <div>
          <label className="label">{language === "en" ? "Target role" : language === "ru" ? "Для кого" : "Ким үчүн"}</label>
          <select className="input" value={service.targetRole} onChange={(event) => onChange(service.id, "targetRole", event.target.value)}>
            {options.planRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === "en" ? "Billing type" : language === "ru" ? "Тип оплаты" : "Эсептөө түрү"}</label>
          <select className="input" value={service.billingType} onChange={(event) => onChange(service.id, "billingType", event.target.value)}>
            {options.billingTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === "en" ? "Price" : language === "ru" ? "Цена" : "Баасы"}</label>
          <input className="input" type="number" value={service.price} onChange={(event) => onChange(service.id, "price", event.target.value)} />
        </div>
        <div>
          <label className="label">{language === "en" ? "Order" : language === "ru" ? "Порядок" : "Тартиби"}</label>
          <input className="input" type="number" value={service.sortOrder} onChange={(event) => onChange(service.id, "sortOrder", event.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{language === "en" ? "Description" : language === "ru" ? "Описание" : "Сүрөттөмө"}</label>
          <textarea className="input min-h-24" value={service.description} onChange={(event) => onChange(service.id, "description", event.target.value)} />
          {localizedServiceDescription !== service.description ? <p className="mt-2 text-xs text-slate-500">{localizedServiceDescription}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label className="label">{language === "en" ? "Benefits" : language === "ru" ? "Преимущества" : "Пайдалары"}</label>
          <textarea className="input min-h-28" value={service.benefitsText} onChange={(event) => onChange(service.id, "benefitsText", event.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input checked={service.isActive} onChange={(event) => onChange(service.id, "isActive", event.target.checked)} type="checkbox" />
          {language === "en" ? "Active" : language === "ru" ? "Активна" : "Активдүү"}
        </label>
      </div>

      <div className="mt-4">
        <button className="btn-primary" disabled={busy} onClick={() => onSave(service)} type="button">
          {busy ? (language === "en" ? "Saving..." : language === "ru" ? "Сохраняем..." : "Сакталып жатат...") : (language === "en" ? "Save service" : language === "ru" ? "Сохранить услугу" : "Кызматты сактоо")}
        </button>
      </div>
    </article>
  );
}

function SubscriptionCard({ subscription, busy, onChange, onSave }) {
  const { language } = useLanguage();
  const options = getAdminOptions(language);
  const localizedPlan = localizePlan(subscription.plan, language);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{localizedPlan.name}</h3>
          <p className="text-sm text-slate-600">
            {subscription.user.fullName} · {options.roleOptions.find((item) => item.value === subscription.user.role)?.label || subscription.user.role}
          </p>
          <p className="text-sm text-slate-500">
            {formatDate(subscription.startsAt, language)} — {formatDate(subscription.endsAt, language)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-950">{formatMoney(subscription.amountPaid, language, subscription.currency)}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{options.subscriptionStatusOptions.find((item) => item.value === subscription.status)?.label || subscription.status}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select className="input max-w-60" value={subscription.status} onChange={(event) => onChange(subscription.id, event.target.value)}>
          {options.subscriptionStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="btn-secondary" disabled={busy} onClick={() => onSave(subscription)} type="button">
          {busy ? (language === "en" ? "Saving..." : language === "ru" ? "Сохраняем..." : "Сакталып жатат...") : (language === "en" ? "Update subscription" : language === "ru" ? "Обновить подписку" : "Жазылууну жаңыртуу")}
        </button>
      </div>
    </article>
  );
}

function ServiceOrderCard({ order, busy, onChange, onSave }) {
  const { language } = useLanguage();
  const options = getAdminOptions(language);
  const localizedService = localizeService(order.service, language);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{localizedService.name}</h3>
          <p className="text-sm text-slate-600">
            {order.user.fullName} · {options.roleOptions.find((item) => item.value === order.user.role)?.label || order.user.role}
          </p>
          <p className="text-sm text-slate-500">{formatDateTime(order.createdAt, language)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-950">{formatMoney(order.price, language, order.currency)}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{options.serviceOrderStatusOptions.find((item) => item.value === order.status)?.label || order.status}</p>
        </div>
      </div>

      {order.note ? <p className="mt-3 text-sm text-slate-700">{translateKnownText(order.note, language)}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <select className="input max-w-60" value={order.status} onChange={(event) => onChange(order.id, event.target.value)}>
          {options.serviceOrderStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="btn-secondary" disabled={busy} onClick={() => onSave(order)} type="button">
          {busy ? (language === "en" ? "Saving..." : language === "ru" ? "Сохраняем..." : "Сакталып жатат...") : (language === "en" ? "Update service order" : language === "ru" ? "Обновить заказ услуги" : "Кызмат заказын жаңыртуу")}
        </button>
      </div>
    </article>
  );
}

function AdminCabinetPage() {
  const { language } = useLanguage();
  const copy = getAdminCopy(language);
  const options = getAdminOptions(language);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [newPlan, setNewPlan] = useState(() => createEmptyPlan());
  const [newService, setNewService] = useState(() => createEmptyService());
  const [userFilters, setUserFilters] = useState({ q: "", role: "" });
  const [jobFilters, setJobFilters] = useState({ q: "", status: "" });
  const [initialLoading, setInitialLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const summaryCards = useMemo(() => {
    if (!overview) return [];

    return [
      { label: language === "en" ? "Users" : language === "ru" ? "Пользователи" : "Колдонуучулар", value: overview.users.total_users, hint: `${overview.users.pro_users} PRO` },
      { label: language === "en" ? "Jobs" : language === "ru" ? "Заказы" : "Тапшырмалар", value: overview.jobs.total_jobs, hint: language === "en" ? `${overview.jobs.open_jobs} open` : language === "ru" ? `${overview.jobs.open_jobs} открытых` : `${overview.jobs.open_jobs} ачык` },
      { label: language === "en" ? "Active subscriptions" : language === "ru" ? "Активные подписки" : "Активдүү жазылуулар", value: overview.monetization.activeSubscriptions, hint: language === "en" ? `${overview.monetization.totalPlans} plans` : language === "ru" ? `${overview.monetization.totalPlans} тарифов` : `${overview.monetization.totalPlans} тариф` },
      { label: language === "en" ? "Services in progress" : language === "ru" ? "Услуги в работе" : "Иштеги кызматтар", value: overview.monetization.serviceOrdersInProgress, hint: language === "en" ? `${overview.monetization.totalServices} services` : language === "ru" ? `${overview.monetization.totalServices} услуг` : `${overview.monetization.totalServices} кызмат` },
      { label: language === "en" ? "Responses" : language === "ru" ? "Отклики" : "Жооптор", value: overview.activity.totalResponses, hint: language === "en" ? `${overview.activity.totalMessages} messages` : language === "ru" ? `${overview.activity.totalMessages} сообщений` : `${overview.activity.totalMessages} билдирүү` },
      { label: language === "en" ? "Subscription revenue" : language === "ru" ? "Выручка с подписок" : "Жазылуудан киреше", value: formatMoney(overview.monetization.totalSubscriptionRevenue, language), hint: language === "en" ? `${overview.monetization.totalSubscriptions} purchases` : language === "ru" ? `${overview.monetization.totalSubscriptions} покупок` : `${overview.monetization.totalSubscriptions} сатып алуу` },
      { label: language === "en" ? "Service revenue" : language === "ru" ? "Выручка с услуг" : "Кызматтардан киреше", value: formatMoney(overview.monetization.totalServiceRevenue, language), hint: language === "en" ? `${overview.monetization.totalServiceOrders} service orders` : language === "ru" ? `${overview.monetization.totalServiceOrders} заказов услуг` : `${overview.monetization.totalServiceOrders} кызмат заказы` },
      { label: language === "en" ? "Open disputes" : language === "ru" ? "Открытые споры" : "Ачык талаштар", value: overview.activity.openDisputes, hint: language === "en" ? "Needs attention" : language === "ru" ? "Требует контроля" : "Көзөмөл керек" },
    ];
  }, [language, overview]);
  const localizedOverviewJobs = useMemo(
    () => (overview?.recentJobs || []).map((job) => localizeJob(job, language)),
    [language, overview?.recentJobs],
  );

  const loadSummary = async () => {
    const [overviewResult, plansResult, subscriptionsResult, servicesResult, serviceOrdersResult] = await Promise.all([
      api.get("/admin/overview"),
      api.get("/admin/plans"),
      api.get("/admin/subscriptions"),
      api.get("/admin/services"),
      api.get("/admin/service-orders"),
    ]);

    setOverview(overviewResult.data);
    setPlans(plansResult.data.map(buildPlanDraft));
    setSubscriptions(subscriptionsResult.data);
    setServices(servicesResult.data.map(buildServiceDraft));
    setServiceOrders(serviceOrdersResult.data);
  };

  const loadUsers = async (filters = userFilters) => {
    setUsersLoading(true);

    try {
      const { data } = await api.get("/admin/users", {
        params: {
          q: filters.q || undefined,
          role: filters.role || undefined,
          limit: 24,
        },
      });

      setUsers(data.map(buildUserDraft));
    } finally {
      setUsersLoading(false);
    }
  };

  const loadJobs = async (filters = jobFilters) => {
    setJobsLoading(true);

    try {
      const { data } = await api.get("/admin/jobs", {
        params: {
          q: filters.q || undefined,
          status: filters.status || undefined,
          limit: 24,
        },
      });

      setJobs(data);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setInitialLoading(true);
      setError("");

      try {
        await Promise.all([loadSummary(), loadUsers(userFilters), loadJobs(jobFilters)]);
      } catch (err) {
        setError(err.response?.data?.message || copy.bootstrapFailed);
      } finally {
        setInitialLoading(false);
      }
    };

    bootstrap();
  }, []);

  const updateListItem = (setter, id, field, value) => {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleUserSave = async (account) => {
    setBusyKey(`user:${account.id}`);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(`/admin/users/${account.id}`, {
        fullName: account.fullName,
        fullNameKy: account.fullNameKy || null,
        fullNameEn: account.fullNameEn || null,
        email: account.email || null,
        phone: account.phone || null,
        city: account.city || null,
        bio: account.role === "worker" ? account.bio || null : undefined,
        role: account.role,
      });

      setUsers((prev) => prev.map((item) => (item.id === account.id ? buildUserDraft(data) : item)));
      await loadSummary();
      setSuccess(copy.userUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.userUpdateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleUserPasswordSave = async (account) => {
    const nextPassword = (account.newPassword || "").trim();
    const confirmPassword = (account.confirmPassword || "").trim();

    if (nextPassword.length < 6) {
      setError(copy.passwordMin);
      setSuccess("");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError(copy.passwordMatch);
      setSuccess("");
      return;
    }

    setBusyKey(`user-password:${account.id}`);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/admin/users/${account.id}/password`, {
        newPassword: nextPassword,
      });

      setUsers((prev) => prev.map((item) => (item.id === account.id ? { ...item, newPassword: "", confirmPassword: "" } : item)));
      setSuccess(copy.userPasswordUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.userPasswordFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleUserSubscriptionSave = async (account) => {
    setBusyKey(`user-subscription:${account.id}`);
    setError("");
    setSuccess("");

    try {
      const payload = {
        planId: account.selectedPlanId ? Number(account.selectedPlanId) : null,
      };

      const { data } = await api.patch(`/admin/users/${account.id}/subscription`, payload);
      setUsers((prev) => prev.map((item) => (item.id === account.id ? buildUserDraft(data) : item)));
      await loadSummary();
      setSuccess(payload.planId ? copy.userSubscriptionUpdated : copy.userSubscriptionRemoved);
    } catch (err) {
      setError(err.response?.data?.message || copy.userSubscriptionFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleUserBlockToggle = async (account) => {
    const nextBlocked = !account.isBlocked;

    if (nextBlocked && !window.confirm(copy.confirmBlock)) {
      return;
    }

    setBusyKey(`user-block:${account.id}`);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(`/admin/users/${account.id}/block`, { blocked: nextBlocked });
      setUsers((prev) => prev.map((item) => (item.id === account.id ? buildUserDraft(data) : item)));
      setSuccess(nextBlocked ? copy.userBlocked : copy.userUnblocked);
    } catch (err) {
      setError(err.response?.data?.message || copy.userBlockFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleJobDelete = async (job) => {
    if (!window.confirm(copy.confirmDeleteJob)) {
      return;
    }

    setBusyKey(`job-delete:${job.id}`);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/admin/jobs/${job.id}`);
      setJobs((prev) => prev.filter((item) => item.id !== job.id));
      await loadSummary();
      setSuccess(copy.jobDeleted);
    } catch (err) {
      setError(err.response?.data?.message || copy.jobDeleteFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleJobSave = async (job) => {
    setBusyKey(`job:${job.id}`);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(`/admin/jobs/${job.id}`, {
        status: job.status,
        escrowStatus: job.escrowStatus,
      });

      setJobs((prev) => prev.map((item) => (item.id === job.id ? data : item)));
      await loadSummary();
      setSuccess(copy.jobUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.jobUpdateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handlePlanSave = async (plan) => {
    setBusyKey(`plan:${plan.id}`);
    setError("");
    setSuccess("");

    try {
      const payload = {
        slug: plan.slug,
        name: plan.name,
        roleScope: plan.roleScope,
        billingPeriod: plan.billingPeriod,
        price: Number(plan.price || 0),
        currency: plan.currency || "KGS",
        description: plan.description,
        features: fromMultiline(plan.featuresText),
        isPro: Boolean(plan.isPro),
        isActive: Boolean(plan.isActive),
        sortOrder: Number(plan.sortOrder || 0),
      };

      const { data } = await api.patch(`/admin/plans/${plan.id}`, payload);
      setPlans((prev) => prev.map((item) => (item.id === plan.id ? buildPlanDraft(data) : item)));
      await loadSummary();
      setSuccess(copy.planUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.planUpdateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handlePlanCreate = async () => {
    setBusyKey("plan:new");
    setError("");
    setSuccess("");

    try {
      const payload = {
        slug: newPlan.slug,
        name: newPlan.name,
        roleScope: newPlan.roleScope,
        billingPeriod: newPlan.billingPeriod,
        price: Number(newPlan.price || 0),
        currency: newPlan.currency || "KGS",
        description: newPlan.description,
        features: fromMultiline(newPlan.featuresText),
        isPro: Boolean(newPlan.isPro),
        isActive: Boolean(newPlan.isActive),
        sortOrder: Number(newPlan.sortOrder || 0),
      };

      const { data } = await api.post("/admin/plans", payload);
      setPlans((prev) => [buildPlanDraft(data), ...prev]);
      setNewPlan(createEmptyPlan());
      await loadSummary();
      setSuccess(copy.planCreated);
    } catch (err) {
      setError(err.response?.data?.message || copy.planCreateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleServiceSave = async (service) => {
    setBusyKey(`service:${service.id}`);
    setError("");
    setSuccess("");

    try {
      const payload = {
        slug: service.slug,
        name: service.name,
        targetRole: service.targetRole,
        billingType: service.billingType,
        price: Number(service.price || 0),
        currency: service.currency || "KGS",
        description: service.description,
        benefits: fromMultiline(service.benefitsText),
        isActive: Boolean(service.isActive),
        sortOrder: Number(service.sortOrder || 0),
      };

      const { data } = await api.patch(`/admin/services/${service.id}`, payload);
      setServices((prev) => prev.map((item) => (item.id === service.id ? buildServiceDraft(data) : item)));
      await loadSummary();
      setSuccess(copy.serviceUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.serviceUpdateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleServiceCreate = async () => {
    setBusyKey("service:new");
    setError("");
    setSuccess("");

    try {
      const payload = {
        slug: newService.slug,
        name: newService.name,
        targetRole: newService.targetRole,
        billingType: newService.billingType,
        price: Number(newService.price || 0),
        currency: newService.currency || "KGS",
        description: newService.description,
        benefits: fromMultiline(newService.benefitsText),
        isActive: Boolean(newService.isActive),
        sortOrder: Number(newService.sortOrder || 0),
      };

      const { data } = await api.post("/admin/services", payload);
      setServices((prev) => [buildServiceDraft(data), ...prev]);
      setNewService(createEmptyService());
      await loadSummary();
      setSuccess(copy.serviceCreated);
    } catch (err) {
      setError(err.response?.data?.message || copy.serviceCreateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleSubscriptionSave = async (subscription) => {
    setBusyKey(`subscription:${subscription.id}`);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(`/admin/subscriptions/${subscription.id}`, {
        status: subscription.status,
      });

      setSubscriptions((prev) => prev.map((item) => (item.id === subscription.id ? data : item)));
      await loadSummary();
      setSuccess(copy.subscriptionUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.subscriptionUpdateFailed);
    } finally {
      setBusyKey("");
    }
  };

  const handleServiceOrderSave = async (order) => {
    setBusyKey(`service-order:${order.id}`);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch(`/admin/service-orders/${order.id}`, {
        status: order.status,
      });

      setServiceOrders((prev) => prev.map((item) => (item.id === order.id ? data : item)));
      await loadSummary();
      setSuccess(copy.serviceOrderUpdated);
    } catch (err) {
      setError(err.response?.data?.message || copy.serviceOrderUpdateFailed);
    } finally {
      setBusyKey("");
    }
  };

  if (initialLoading) {
    return <section className="panel">{copy.loading}</section>;
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="badge border-[#d8a3b0] bg-[#f5dde3] text-[#8d1530]">Admin Control</span>
            <h1 className="title mt-4">{copy.panelTitle}</h1>
            <p className="subtitle">{copy.panelSubtitle}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn-secondary" to="/profile">
                {copy.adminProfile}
              </Link>
              <Link className="btn-secondary" to="/jobs">
                {copy.openJobsShowcase}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#4f0e1f] via-[#72122a] to-[#a21a39] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f6d9df]">{copy.opsSummary}</p>
            <h2 className="mt-3 font-display text-2xl font-bold">{copy.platformInOnePanel}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">{copy.platformInOnePanelText}</p>
          </div>
        </div>
      </section>

      {error && <section className="panel text-sm font-medium text-red-600">{error}</section>}
      {success && <section className="panel text-sm font-medium text-emerald-700">{success}</section>}

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.mainMetrics}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <StatCard hint={card.hint} key={card.label} label={card.label} value={card.value} />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.latestJobs}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.latestJobsText}</p>
          </div>
          <button className="btn-secondary" onClick={() => loadSummary()} type="button">
            {copy.refreshSummary}
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {localizedOverviewJobs.map((job) => (
            <article className="rounded-2xl border border-slate-200 bg-white/80 p-4" key={job.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{job.title}</h3>
                  <p className="text-sm text-slate-600">
                    {job.category_name} · {job.city} · {options.jobStatusOptions.find((item) => item.value === job.status)?.label || job.status}
                  </p>
                  <p className="text-sm text-slate-500">{copy.customerLabel} {job.customer_name}</p>
                </div>
                <Link className="btn-secondary" to={`/jobs/${job.id}`}>
                  {copy.open}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.users}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.usersText}</p>
          </div>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              loadUsers(userFilters).catch((err) => {
                setError(err.response?.data?.message || (language === "en" ? "Unable to load users" : language === "ru" ? "Не удалось загрузить пользователей" : "Колдонуучуларды жүктөө мүмкүн болгон жок"));
              });
            }}
          >
            <input className="input min-w-56" placeholder={copy.searchUsersPlaceholder} value={userFilters.q} onChange={(event) => setUserFilters((prev) => ({ ...prev, q: event.target.value }))} />
            <select className="input min-w-48" value={userFilters.role} onChange={(event) => setUserFilters((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="">{copy.allRoles}</option>
              {options.roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="btn-secondary" type="submit">
              {copy.apply}
            </button>
          </form>
        </div>

        {usersLoading && <p className="mt-4 text-sm text-slate-600">{copy.usersLoading}</p>}
        <div className="mt-5 space-y-4">
          {users.map((account) => (
            <UserCard
              account={account}
              plans={plans}
              profileBusy={busyKey === `user:${account.id}`}
              passwordBusy={busyKey === `user-password:${account.id}`}
              subscriptionBusy={busyKey === `user-subscription:${account.id}`}
              blockBusy={busyKey === `user-block:${account.id}`}
              key={account.id}
              onChange={(id, field, value) => updateListItem(setUsers, id, field, value)}
              onPasswordSave={handleUserPasswordSave}
              onSave={handleUserSave}
              onSubscriptionSave={handleUserSubscriptionSave}
              onBlockToggle={handleUserBlockToggle}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{copy.jobsModeration}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.jobsModerationText}</p>
          </div>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              loadJobs(jobFilters).catch((err) => {
                setError(err.response?.data?.message || (language === "en" ? "Unable to load jobs" : language === "ru" ? "Не удалось загрузить заказы" : "Заказдарды жүктөө мүмкүн болгон жок"));
              });
            }}
          >
            <input className="input min-w-56" placeholder={copy.searchJobsPlaceholder} value={jobFilters.q} onChange={(event) => setJobFilters((prev) => ({ ...prev, q: event.target.value }))} />
            <select className="input min-w-48" value={jobFilters.status} onChange={(event) => setJobFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">{copy.allStatuses}</option>
              {options.jobStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="btn-secondary" type="submit">
              {copy.apply}
            </button>
          </form>
        </div>

        {jobsLoading && <p className="mt-4 text-sm text-slate-600">{copy.jobsLoading}</p>}
        <div className="mt-5 space-y-4">
          {jobs.map((job) => (
            <JobCard busy={busyKey === `job:${job.id}`} deleteBusy={busyKey === `job-delete:${job.id}`} job={job} key={job.id} onChange={(id, field, value) => updateListItem(setJobs, id, field, value)} onDelete={handleJobDelete} onSave={handleJobSave} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel">
          <h2 className="text-2xl font-bold text-slate-950">{copy.latestSubscriptions}</h2>
          <p className="mt-1 text-sm text-slate-600">{copy.latestSubscriptionsText}</p>
          <div className="mt-5 space-y-3">
            {subscriptions.map((subscription) => (
              <SubscriptionCard busy={busyKey === `subscription:${subscription.id}`} key={subscription.id} onChange={(id, value) => updateListItem(setSubscriptions, id, "status", value)} onSave={handleSubscriptionSave} subscription={subscription} />
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-2xl font-bold text-slate-950">{copy.serviceOrders}</h2>
          <p className="mt-1 text-sm text-slate-600">{copy.serviceOrdersText}</p>
          <div className="mt-5 space-y-3">
            {serviceOrders.map((order) => (
              <ServiceOrderCard busy={busyKey === `service-order:${order.id}`} key={order.id} onChange={(id, value) => updateListItem(setServiceOrders, id, "status", value)} onSave={handleServiceOrderSave} order={order} />
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.plans}</h2>
        <p className="mt-1 text-sm text-slate-600">{copy.plansText}</p>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <h3 className="text-xl font-bold text-slate-950">{copy.newPlan}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="slug" value={newPlan.slug} onChange={(event) => setNewPlan((prev) => ({ ...prev, slug: event.target.value }))} />
            <input className="input" placeholder={copy.namePlaceholder} value={newPlan.name} onChange={(event) => setNewPlan((prev) => ({ ...prev, name: event.target.value }))} />
            <select className="input" value={newPlan.roleScope} onChange={(event) => setNewPlan((prev) => ({ ...prev, roleScope: event.target.value }))}>
              {options.planRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select className="input" value={newPlan.billingPeriod} onChange={(event) => setNewPlan((prev) => ({ ...prev, billingPeriod: event.target.value }))}>
              {options.billingPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input className="input" placeholder={copy.pricePlaceholder} type="number" value={newPlan.price} onChange={(event) => setNewPlan((prev) => ({ ...prev, price: event.target.value }))} />
            <input className="input" placeholder={copy.sortPlaceholder} type="number" value={newPlan.sortOrder} onChange={(event) => setNewPlan((prev) => ({ ...prev, sortOrder: event.target.value }))} />
            <textarea className="input min-h-24 md:col-span-2" placeholder={copy.descriptionPlaceholder} value={newPlan.description} onChange={(event) => setNewPlan((prev) => ({ ...prev, description: event.target.value }))} />
            <textarea className="input min-h-28 md:col-span-2" placeholder={copy.featuresPlaceholder} value={newPlan.featuresText} onChange={(event) => setNewPlan((prev) => ({ ...prev, featuresText: event.target.value }))} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input checked={newPlan.isPro} onChange={(event) => setNewPlan((prev) => ({ ...prev, isPro: event.target.checked }))} type="checkbox" />
              {copy.proIncluded}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input checked={newPlan.isActive} onChange={(event) => setNewPlan((prev) => ({ ...prev, isActive: event.target.checked }))} type="checkbox" />
              {copy.active}
            </label>
          </div>
          <div className="mt-4">
            <button className="btn-primary" disabled={busyKey === "plan:new"} onClick={handlePlanCreate} type="button">
              {busyKey === "plan:new" ? copy.creating : copy.createPlan}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard busy={busyKey === `plan:${plan.id}`} key={plan.id} onChange={(id, field, value) => updateListItem(setPlans, id, field, value)} onSave={handlePlanSave} plan={plan} />
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-2xl font-bold text-slate-950">{copy.services}</h2>
        <p className="mt-1 text-sm text-slate-600">{copy.servicesText}</p>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <h3 className="text-xl font-bold text-slate-950">{copy.newService}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="slug" value={newService.slug} onChange={(event) => setNewService((prev) => ({ ...prev, slug: event.target.value }))} />
            <input className="input" placeholder={copy.namePlaceholder} value={newService.name} onChange={(event) => setNewService((prev) => ({ ...prev, name: event.target.value }))} />
            <select className="input" value={newService.targetRole} onChange={(event) => setNewService((prev) => ({ ...prev, targetRole: event.target.value }))}>
              {options.planRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select className="input" value={newService.billingType} onChange={(event) => setNewService((prev) => ({ ...prev, billingType: event.target.value }))}>
              {options.billingTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input className="input" placeholder={copy.pricePlaceholder} type="number" value={newService.price} onChange={(event) => setNewService((prev) => ({ ...prev, price: event.target.value }))} />
            <input className="input" placeholder={copy.sortPlaceholder} type="number" value={newService.sortOrder} onChange={(event) => setNewService((prev) => ({ ...prev, sortOrder: event.target.value }))} />
            <textarea className="input min-h-24 md:col-span-2" placeholder={copy.descriptionPlaceholder} value={newService.description} onChange={(event) => setNewService((prev) => ({ ...prev, description: event.target.value }))} />
            <textarea className="input min-h-28 md:col-span-2" placeholder={copy.benefitsPlaceholder} value={newService.benefitsText} onChange={(event) => setNewService((prev) => ({ ...prev, benefitsText: event.target.value }))} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input checked={newService.isActive} onChange={(event) => setNewService((prev) => ({ ...prev, isActive: event.target.checked }))} type="checkbox" />
              {copy.active}
            </label>
          </div>
          <div className="mt-4">
            <button className="btn-primary" disabled={busyKey === "service:new"} onClick={handleServiceCreate} type="button">
              {busyKey === "service:new" ? copy.creating : copy.createService}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {services.map((service) => (
            <ServiceCard busy={busyKey === `service:${service.id}`} key={service.id} onChange={(id, field, value) => updateListItem(setServices, id, field, value)} onSave={handleServiceSave} service={service} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminCabinetPage;

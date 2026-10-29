export const emptyWorkerResume = Object.freeze({
  headline: "",
  experienceYears: null,
  serviceModes: [],
  serviceAreas: [],
  verificationStatus: "basic",
  verificationItems: [],
  verificationNote: "",
  responseTime: "",
  education: "",
  achievements: "",
  languages: [],
  availability: "",
  pricingNote: "",
  portfolioHighlights: [],
  portfolioLinks: [],
});

export const workerVerificationMeta = Object.freeze({
  basic: {
    labelRu: "Базовый профиль",
    labelKy: "Негизги профиль",
    labelEn: "Basic profile",
    shortLabelRu: "Базовый",
    shortLabelKy: "Негизги",
    shortLabelEn: "Basic",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    panelClass: "border-slate-200 bg-slate-50/80",
  },
  verified: {
    labelRu: "Проверенный специалист",
    labelKy: "Текшерилген аткаруучу",
    labelEn: "Verified specialist",
    shortLabelRu: "Проверен",
    shortLabelKy: "Текшерилген",
    shortLabelEn: "Verified",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panelClass: "border-emerald-200 bg-emerald-50/80",
  },
  top: {
    labelRu: "Проверен и рекомендован",
    labelKy: "Текшерилген жана сунушталат",
    labelEn: "Verified and recommended",
    shortLabelRu: "Проверен PRO",
    shortLabelKy: "Текшерилген PRO",
    shortLabelEn: "Verified PRO",
    badgeClass: "border-[#ead3d9] bg-[#f9ecef] text-[#8d1530]",
    panelClass: "border-[#ead3d9] bg-[#fff6f8]",
  },
});

export function parseCommaSeparatedList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseMultilineLinks(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseMultilineItems(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getWorkerVerificationMeta(status, isPro = false, language = "ru") {
  const baseMeta =
    status === "top" || (status === "verified" && isPro)
      ? workerVerificationMeta.top
      : workerVerificationMeta[status] || workerVerificationMeta.basic;

  return {
    ...baseMeta,
    label: language === "ky" ? baseMeta.labelKy : language === "en" ? baseMeta.labelEn : baseMeta.labelRu,
    shortLabel: language === "ky" ? baseMeta.shortLabelKy : language === "en" ? baseMeta.shortLabelEn : baseMeta.shortLabelRu,
  };
}

export function normalizeWorkerResume(value) {
  const source = value && typeof value === "object" ? value : {};
  const verificationStatus = ["basic", "verified", "top"].includes(source.verificationStatus)
    ? source.verificationStatus
    : "basic";

  return {
    headline: source.headline || "",
    experienceYears:
      typeof source.experienceYears === "number" && Number.isFinite(source.experienceYears)
        ? source.experienceYears
        : null,
    serviceModes: Array.isArray(source.serviceModes) ? source.serviceModes.filter(Boolean) : [],
    serviceAreas: Array.isArray(source.serviceAreas) ? source.serviceAreas.filter(Boolean) : [],
    verificationStatus,
    verificationItems: Array.isArray(source.verificationItems) ? source.verificationItems.filter(Boolean) : [],
    verificationNote: source.verificationNote || "",
    responseTime: source.responseTime || "",
    education: source.education || "",
    achievements: source.achievements || "",
    languages: Array.isArray(source.languages) ? source.languages.filter(Boolean) : [],
    availability: source.availability || "",
    pricingNote: source.pricingNote || "",
    portfolioHighlights: Array.isArray(source.portfolioHighlights) ? source.portfolioHighlights.filter(Boolean) : [],
    portfolioLinks: Array.isArray(source.portfolioLinks) ? source.portfolioLinks.filter(Boolean) : [],
  };
}

export function buildWorkerResumeForm(value) {
  const resume = normalizeWorkerResume(value);

  return {
    headline: resume.headline,
    experienceYears: resume.experienceYears ?? "",
    serviceModesText: resume.serviceModes.join(", "),
    serviceAreasText: resume.serviceAreas.join(", "),
    verificationStatus: resume.verificationStatus,
    verificationItemsText: resume.verificationItems.join(", "),
    verificationNote: resume.verificationNote,
    responseTime: resume.responseTime,
    education: resume.education,
    achievements: resume.achievements,
    languagesText: resume.languages.join(", "),
    availability: resume.availability,
    pricingNote: resume.pricingNote,
    portfolioHighlightsText: resume.portfolioHighlights.join("\n"),
    portfolioLinksText: resume.portfolioLinks.join("\n"),
  };
}

export function buildWorkerResumePayload(form) {
  const experienceYears = String(form.experienceYears || "").trim();

  return {
    headline: String(form.headline || "").trim(),
    experienceYears: experienceYears ? Number(experienceYears) : null,
    serviceModes: parseCommaSeparatedList(form.serviceModesText),
    serviceAreas: parseCommaSeparatedList(form.serviceAreasText),
    verificationStatus: String(form.verificationStatus || "basic").trim() || "basic",
    verificationItems: parseCommaSeparatedList(form.verificationItemsText),
    verificationNote: String(form.verificationNote || "").trim(),
    responseTime: String(form.responseTime || "").trim(),
    education: String(form.education || "").trim(),
    achievements: String(form.achievements || "").trim(),
    languages: parseCommaSeparatedList(form.languagesText),
    availability: String(form.availability || "").trim(),
    pricingNote: String(form.pricingNote || "").trim(),
    portfolioHighlights: parseMultilineItems(form.portfolioHighlightsText),
    portfolioLinks: parseMultilineLinks(form.portfolioLinksText),
  };
}

export function hasWorkerResumeContent(value) {
  const resume = normalizeWorkerResume(value);

  return Boolean(
    resume.headline ||
      resume.experienceYears !== null ||
      resume.serviceModes.length ||
      resume.serviceAreas.length ||
      resume.verificationStatus !== "basic" ||
      resume.verificationItems.length ||
      resume.verificationNote ||
      resume.responseTime ||
      resume.education ||
      resume.achievements ||
      resume.languages.length ||
      resume.availability ||
      resume.pricingNote ||
      resume.portfolioHighlights.length ||
      resume.portfolioLinks.length,
  );
}

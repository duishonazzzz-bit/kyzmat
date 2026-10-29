const { z } = require("zod");

const emptyWorkerResume = Object.freeze({
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

const optionalTrimmedString = (maxLength) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }

    return value;
  }, z.string().max(maxLength).optional());

const optionalInteger = (minimum, maximum) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const nextValue = Number(value);
    return Number.isFinite(nextValue) ? nextValue : value;
  }, z.number().int().min(minimum).max(maximum).optional());

const optionalStringArray = (maxItems, maxLength) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .map((item) => (typeof item === "string" ? item.trim() : item))
      .filter(Boolean);
  }, z.array(z.string().min(1).max(maxLength)).max(maxItems).optional());

const workerResumeInputSchema = z.object({
  headline: optionalTrimmedString(140),
  experienceYears: optionalInteger(0, 60),
  serviceModes: optionalStringArray(8, 64),
  serviceAreas: optionalStringArray(12, 80),
  verificationStatus: z.enum(["basic", "verified", "top"]).optional(),
  verificationItems: optionalStringArray(8, 80),
  verificationNote: optionalTrimmedString(400),
  responseTime: optionalTrimmedString(120),
  education: optionalTrimmedString(800),
  achievements: optionalTrimmedString(1600),
  languages: optionalStringArray(10, 40),
  availability: optionalTrimmedString(240),
  pricingNote: optionalTrimmedString(240),
  portfolioHighlights: optionalStringArray(8, 160),
  portfolioLinks: z.preprocess((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .map((item) => (typeof item === "string" ? item.trim() : item))
      .filter(Boolean);
  }, z.array(z.string().url().max(280)).max(8).optional()),
});

function normalizeWorkerResume(value) {
  const parsed =
    value && typeof value === "object" && !Array.isArray(value)
      ? workerResumeInputSchema.parse(value)
      : workerResumeInputSchema.parse({});

  return {
    headline: parsed.headline || "",
    experienceYears: typeof parsed.experienceYears === "number" ? parsed.experienceYears : null,
    serviceModes: parsed.serviceModes || [],
    serviceAreas: parsed.serviceAreas || [],
    verificationStatus: parsed.verificationStatus || "basic",
    verificationItems: parsed.verificationItems || [],
    verificationNote: parsed.verificationNote || "",
    responseTime: parsed.responseTime || "",
    education: parsed.education || "",
    achievements: parsed.achievements || "",
    languages: parsed.languages || [],
    availability: parsed.availability || "",
    pricingNote: parsed.pricingNote || "",
    portfolioHighlights: parsed.portfolioHighlights || [],
    portfolioLinks: parsed.portfolioLinks || [],
  };
}

function parseWorkerResume(rawValue) {
  if (!rawValue) {
    return { ...emptyWorkerResume };
  }

  if (typeof rawValue === "object" && !Array.isArray(rawValue)) {
    return normalizeWorkerResume(rawValue);
  }

  if (typeof rawValue === "string") {
    try {
      const parsed = JSON.parse(rawValue);
      return normalizeWorkerResume(parsed);
    } catch {
      return { ...emptyWorkerResume };
    }
  }

  return { ...emptyWorkerResume };
}

function serializeWorkerResume(value) {
  return JSON.stringify(normalizeWorkerResume(value));
}

module.exports = {
  emptyWorkerResume,
  workerResumeInputSchema,
  normalizeWorkerResume,
  parseWorkerResume,
  serializeWorkerResume,
};

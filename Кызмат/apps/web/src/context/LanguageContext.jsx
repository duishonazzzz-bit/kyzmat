import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supportedLanguages, translations } from "../i18n/translations";

const LANGUAGE_STORAGE_KEY = "kyzmat_language_v2";
const defaultLanguage = "ky";

const LanguageContext = createContext(null);

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (supportedLanguages.includes(stored)) {
      return stored;
    }
  } catch {
    return defaultLanguage;
  }

  return defaultLanguage;
}

function translate(language, key, fallback = "") {
  return translations[language]?.[key] ?? translations[defaultLanguage]?.[key] ?? fallback;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, fallback = "") => translate(language, key, fallback),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

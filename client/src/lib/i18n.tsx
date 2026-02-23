import { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";

type Language = "en" | "bn";
type Messages = typeof en;

const messages: Record<Language, Messages> = { en, bn };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("niyyah_language");
    return (saved === "bn" ? "bn" : "en") as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("niyyah_language", lang);
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(messages[language], key);
    if (value === undefined) {
      value = getNestedValue(messages.en, key);
    }
    if (value === undefined) return key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value!.replace(`{${k}}`, String(v));
      });
    }

    return value;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}

export function useLanguage() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return { language: ctx.language, setLanguage: ctx.setLanguage };
}

import React, { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'es' | 'en';
export type LanguagePreference = 'auto' | AppLanguage;

export const LANG_PREF_STORAGE_KEY = 'axioma-vet-lang-pref';
export const LANG_CHANGED_EVENT = 'axioma-vet-lang-changed';

export function detectSystemLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'es';
  const raw =
    (Array.isArray(navigator.languages) && navigator.languages[0]) ||
    navigator.language ||
    'es';
  return raw.trim().toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function normalizeLanguagePreference(value?: string | null): LanguagePreference {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
  return 'auto';
}

export function getStoredLanguagePreference(): LanguagePreference {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'auto';
    const raw = window.localStorage.getItem(LANG_PREF_STORAGE_KEY);
    return normalizeLanguagePreference(raw);
  } catch {
    return 'auto';
  }
}

export function resolveLanguage(
  pref: LanguagePreference,
  systemLang: AppLanguage = detectSystemLanguage()
): AppLanguage {
  if (pref === 'es' || pref === 'en') return pref;
  return systemLang;
}

export function getCurrentLanguage(): AppLanguage {
  return resolveLanguage(getStoredLanguagePreference(), detectSystemLanguage());
}

export function getIntlLocale(lang: AppLanguage = getCurrentLanguage()): string {
  return lang === 'en' ? 'en-US' : 'es-ES';
}

export function pickLang<T>(es: T, en: T, lang: AppLanguage = getCurrentLanguage()): T {
  return lang === 'en' ? en : es;
}

export function syncCoreLanguagePreference(value?: string | null): AppLanguage {
  const nextPref = normalizeLanguagePreference(value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LANG_PREF_STORAGE_KEY, nextPref);
    }
  } catch {
    // Ignore storage access restrictions
  }
  const resolved = resolveLanguage(nextPref, detectSystemLanguage());
  if (typeof document !== 'undefined') {
    document.documentElement.lang = resolved;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LANG_CHANGED_EVENT));
  }
  return resolved;
}

interface I18nContextValue {
  lang: AppLanguage;
  pref: LanguagePreference;
  intlLocale: string;
  es: boolean;
  t: (esText: string, enText: string) => string;
  setPreference: (nextPref: LanguagePreference) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = useState<LanguagePreference>(() => getStoredLanguagePreference());
  const [systemLang, setSystemLang] = useState<AppLanguage>(() => detectSystemLanguage());

  useEffect(() => {
    const syncAll = () => {
      setPref(getStoredLanguagePreference());
      setSystemLang(detectSystemLanguage());
    };

    syncAll();
    window.addEventListener(LANG_CHANGED_EVENT, syncAll);
    window.addEventListener('storage', syncAll);
    window.addEventListener('languagechange', syncAll);

    return () => {
      window.removeEventListener(LANG_CHANGED_EVENT, syncAll);
      window.removeEventListener('storage', syncAll);
      window.removeEventListener('languagechange', syncAll);
    };
  }, []);

  const lang = useMemo(() => resolveLanguage(pref, systemLang), [pref, systemLang]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setPreference = useCallback((nextPref: LanguagePreference) => {
    syncCoreLanguagePreference(nextPref);
    setPref(normalizeLanguagePreference(nextPref));
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang,
      pref,
      intlLocale: getIntlLocale(lang),
      es: lang === 'es',
      t: (esText: string, enText: string) => (lang === 'en' ? enText : esText),
      setPreference,
    };
  }, [lang, pref, setPreference]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (ctx) return;
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener(LANG_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    window.addEventListener('languagechange', onChange);
    return () => {
      window.removeEventListener(LANG_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
      window.removeEventListener('languagechange', onChange);
    };
  }, [ctx]);

  if (ctx) return ctx;

  const currentPref = getStoredLanguagePreference();
  const currentLang = getCurrentLanguage();
  return {
    lang: currentLang,
    pref: currentPref,
    intlLocale: getIntlLocale(currentLang),
    es: currentLang === 'es',
    t: (esText: string, enText: string) => (currentLang === 'en' ? enText : esText),
    setPreference: (nextPref: LanguagePreference) => {
      syncCoreLanguagePreference(nextPref);
      setTick((n) => n + 1);
    },
  };
}

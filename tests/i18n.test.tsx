import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  LANG_PREF_STORAGE_KEY,
  LANG_CHANGED_EVENT,
  detectSystemLanguage,
  normalizeLanguagePreference,
  getStoredLanguagePreference,
  resolveLanguage,
  getCurrentLanguage,
  getIntlLocale,
  pickLang,
  syncCoreLanguagePreference,
  I18nProvider,
  useTranslation,
} from '../src/i18n';
import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { telemetry } from '../src/services/telemetry';

function LanguageProbe() {
  const { lang, pref, intlLocale, t } = useTranslation();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="pref">{pref}</span>
      <span data-testid="locale">{intlLocale}</span>
      <span data-testid="copy">{t('Hola', 'Hello')}</span>
    </div>
  );
}

describe('Axioma-Vet i18n', () => {
  const originalLanguage = navigator.language;
  const originalLanguages = navigator.languages;

  const setNavigatorLanguage = (value: string, languages: readonly string[] = [value]) => {
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      value,
    });
    Object.defineProperty(navigator, 'languages', {
      configurable: true,
      value: languages,
    });
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    setNavigatorLanguage('en-US');
  });

  afterEach(() => {
    setNavigatorLanguage(originalLanguage, originalLanguages);
  });

  it('normaliza preferencias y resuelve auto según idioma del sistema', () => {
    expect(normalizeLanguagePreference(undefined)).toBe('auto');
    expect(normalizeLanguagePreference('auto')).toBe('auto');
    expect(normalizeLanguagePreference('en')).toBe('en');
    expect(normalizeLanguagePreference('es')).toBe('es');
    expect(normalizeLanguagePreference('fr')).toBe('auto');

    setNavigatorLanguage('en-GB');
    expect(detectSystemLanguage()).toBe('en');
    expect(resolveLanguage('auto')).toBe('en');

    setNavigatorLanguage('es-EC');
    expect(detectSystemLanguage()).toBe('es');
    expect(resolveLanguage('auto')).toBe('es');
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('es')).toBe('es');
  });

  it('sincroniza preferencia desde Core (/api/me/context) y dispara evento', () => {
    const handler = vi.fn();
    window.addEventListener(LANG_CHANGED_EVENT, handler);

    setNavigatorLanguage('es-ES');
    expect(syncCoreLanguagePreference('en')).toBe('en');
    expect(getStoredLanguagePreference()).toBe('en');
    expect(getCurrentLanguage()).toBe('en');
    expect(getIntlLocale()).toBe('en-US');

    expect(syncCoreLanguagePreference('auto')).toBe('es');
    expect(getStoredLanguagePreference()).toBe('auto');
    expect(getIntlLocale()).toBe('es-ES');
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(LANG_CHANGED_EVENT, handler);
  });

  it('I18nProvider refleja cambios dinámicos al propagarse desde Core', () => {
    setNavigatorLanguage('es-ES');
    render(
      <I18nProvider>
        <LanguageProbe />
      </I18nProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('es');
    expect(screen.getByTestId('pref').textContent).toBe('auto');
    expect(screen.getByTestId('copy').textContent).toBe('Hola');

    act(() => {
      syncCoreLanguagePreference('en');
    });

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('pref').textContent).toBe('en');
    expect(screen.getByTestId('locale').textContent).toBe('en-US');
    expect(screen.getByTestId('copy').textContent).toBe('Hello');
  });

  it('renderiza GlobalErrorBoundary en inglés cuando la preferencia es en', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(telemetry, 'captureException').mockImplementation(() => {});
    localStorage.setItem(LANG_PREF_STORAGE_KEY, 'en');

    const Broken = () => {
      throw new Error('Test crash');
    };

    render(
      <GlobalErrorBoundary>
        <Broken />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Technical incident details')).toBeInTheDocument();
  });
});

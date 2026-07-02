import "server-only";
import { cookies } from "next/headers";
import ar from "./ar";
import ckb from "./ckb";
import en from "./en";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./locales";
import type { Dictionary, DictionaryPath } from "./types";

const dictionaries: Record<Locale, Dictionary> = { ar, ckb, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Reads the active locale from the request cookie (server components/actions only). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Convenience wrapper: resolves the cookie locale and its dictionary in one call. */
export async function getLocaleAndDictionary(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}

/**
 * Tiny typed translator: `t(dict, "nav.dashboard")`.
 * Prefer plain `dict.nav.dashboard` access — this exists for call sites that
 * receive a dot-path key (e.g. from a config-driven nav list).
 */
export function t(dict: Dictionary, key: DictionaryPath): string {
  return key.split(".").reduce<unknown>((node, part) => {
    return typeof node === "object" && node !== null
      ? (node as Record<string, unknown>)[part]
      : undefined;
  }, dict) as string;
}

export type { Dictionary, DictionaryPath } from "./types";
export { defaultLocale, isLocale, LOCALE_COOKIE, locales, localeConfig } from "./locales";
export type { Locale, LocaleConfig } from "./locales";

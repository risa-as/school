export const locales = ["ar", "ckb", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const LOCALE_COOKIE = "locale";

export interface LocaleConfig {
  /** BCP-47 tag used for the `lang` attribute. */
  lang: string;
  /** Text direction for the `dir` attribute. */
  dir: "rtl" | "ltr";
  /** The language's own name, written in its own script — never translated. */
  nativeName: string;
}

export const localeConfig: Record<Locale, LocaleConfig> = {
  ar: { lang: "ar", dir: "rtl", nativeName: "العربية" },
  ckb: { lang: "ckb", dir: "rtl", nativeName: "کوردی" },
  en: { lang: "en", dir: "ltr", nativeName: "English" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

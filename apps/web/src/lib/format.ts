/**
 * Numeral formatting helpers (DESIGN_SYSTEM §3.3): render every dynamic
 * number as Western digits (0-9) app-wide, even under the `ar`/`ckb`
 * locales whose default Intl numbering system is Eastern Arabic-Indic.
 * The `-u-nu-latn` Unicode extension forces the "latn" numbering system
 * regardless of which of the app's 3 locales is active, so a value like
 * `1,284` never silently becomes `١,٢٨٤`.
 *
 * These wrap `Intl.NumberFormat`/`Intl.DateTimeFormat` — never hand-format
 * a number/date with string interpolation.
 */

const WESTERN_DIGITS_LOCALE = "en-u-nu-latn";

/** Formats a plain number (counts, deltas, percentages via `style: "percent"`, etc.). */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(WESTERN_DIGITS_LOCALE, options).format(value);
}

/**
 * Formats an IQD amount. Money is stored/passed as a whole-number amount
 * (CLAUDE.md: "Money: IQD stored as `BigInt` (no decimals)") — no fraction
 * digits, comma thousands-grouping. Does not append a currency symbol; the
 * UI renders the "د.ع"/"IQD" unit label separately (see `dict.common.currency`)
 * so it can be translated per-locale instead of baked into the number string.
 */
export function formatCurrencyIQD(
  value: number | bigint,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(WESTERN_DIGITS_LOCALE, {
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/** Formats a date/time in the school's operating timezone (CLAUDE.md: dates displayed in Asia/Baghdad). */
export function formatDate(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const resolved = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(WESTERN_DIGITS_LOCALE, {
    timeZone: "Asia/Baghdad",
    ...options,
  }).format(resolved);
}

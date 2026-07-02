import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { getLocale, getLocaleAndDictionary, localeConfig } from "@/i18n";

/* DESIGN_SYSTEM §3.1: Noto Sans Arabic (full Arabic block incl. Sorani glyphs
   ە ڕ ڵ ۆ ێ پ چ گ ڤ) for ar/ckb; Inter for Latin/en. */
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-sans-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return {
    title: `${dict.common.platformName} — ${dict.common.platformTagline}`,
    description: dict.common.platformTagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const { lang, dir } = localeConfig[locale];

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${notoSansArabic.variable} ${inter.variable}`}
    >
      <body className="min-h-svh">{children}</body>
    </html>
  );
}

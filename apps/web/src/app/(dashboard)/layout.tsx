import { getLocaleAndDictionary } from "@/i18n";
import { mockSchool, mockUser } from "@/lib/mock-data";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <div className="flex min-h-svh">
      {/* Sidebar FIRST in source order → flex main-start = inline-start =
          RIGHT edge in rtl (ar/ckb), LEFT edge in ltr (en). */}
      <Sidebar
        labels={dict.nav}
        schoolName={mockSchool.name}
        schoolInitial={mockSchool.initial}
        tagline={`${dict.common.platformTagline} — ${dict.common.platformName}`}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          labels={dict.topbar}
          navLabels={dict.nav}
          schoolName={mockSchool.name}
          schoolInitial={mockSchool.initial}
          locale={locale}
          userName={mockUser.name}
          userRole={mockUser.role}
          userInitials={mockUser.initials}
        />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

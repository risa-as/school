import {
  AlertCircle,
  BarChart3,
  CalendarCheck,
  Check,
  Mail,
  Users,
  Wallet,
} from "lucide-react";

import { getLocaleAndDictionary } from "@/i18n";
import { mockActivity, mockKpis, type ActivityKind, type ActivityTone } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { formatCurrencyIQD, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";

/* Shared percent format for delta values (DESIGN_SYSTEM §3.3: Western digits
   via Intl's `-u-nu-latn` extension, not a hand-formatted string). */
const percentOptions: Intl.NumberFormatOptions = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

export default async function DashboardPage() {
  const { dict } = await getLocaleAndDictionary();

  return (
    <>
      <h1 className="text-xl font-bold">{dict.dashboard.heading}</h1>

      {/* KPI row — 4-up per DESIGN_SYSTEM §7.2; tiles per §5.5 color discipline */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* students: raw headcount → neutral delta, no color */}
        <KpiCard
          label={dict.dashboard.kpiStudents}
          value={formatNumber(mockKpis.students.value)}
          icon={<Users aria-hidden />}
          delta={{
            value: formatNumber(mockKpis.students.delta, { signDisplay: "exceptZero" }),
            suffix: dict.dashboard.deltaThisMonth,
            tone: "neutral",
          }}
          trend={[14, 15, 11, 12, 8, 9, 7]}
        />

        {/* attendance: today ≥ trailing average → judged good, green delta */}
        <KpiCard
          label={dict.dashboard.kpiAttendanceToday}
          value={formatNumber(mockKpis.attendance.value, percentOptions)}
          icon={<CalendarCheck aria-hidden />}
          delta={{
            value: formatNumber(mockKpis.attendance.delta, percentOptions),
            suffix: dict.dashboard.deltaVsAverage,
            tone: "success",
          }}
          trend={[10, 12, 13, 9, 10, 6, 4]}
        />

        {/* fees collected: up vs. last month → judged good, green delta */}
        <KpiCard
          label={dict.dashboard.kpiFeesCollected}
          value={formatCurrencyIQD(mockKpis.fees.value)}
          unit={dict.common.currency}
          icon={<Wallet aria-hidden />}
          delta={{
            value: formatNumber(mockKpis.fees.delta, percentOptions),
            suffix: dict.dashboard.deltaVsLastMonth,
            tone: "success",
          }}
          trend={[16, 13, 14, 10, 11, 7, 5]}
        />

        {/* messages: neutral count; unread chip uses info tint, never success/danger */}
        <KpiCard
          label={dict.dashboard.kpiUnreadMessages}
          value={formatNumber(mockKpis.messages.value)}
          icon={<Mail aria-hidden />}
          iconTone="info"
          delta={{
            value: formatNumber(mockKpis.messages.fromCount),
            suffix: dict.dashboard.fromGuardians,
            tone: "neutral",
          }}
        />
      </section>

      {/* recent activity */}
      <Card className="max-w-2xl gap-0">
        <CardHeader className="border-b pb-4">
          <CardTitle>{dict.dashboard.recentActivityTitle}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mockActivity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              {dict.dashboard.recentActivityEmpty}
            </p>
          ) : (
            <ul>
              {mockActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-b px-5 py-3.5 last:border-b-0"
                >
                  <ActivityDot tone={item.tone} kind={item.kind} />
                  <div className="min-w-0">
                    <p className="text-[13px]">{item.text}</p>
                    <time className="mt-0.5 block text-xs text-muted-foreground">
                      {item.time}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

const activityIcons: Record<ActivityKind, typeof Check> = {
  payment: Check,
  message: Mail,
  attendance: CalendarCheck,
  alert: AlertCircle,
  grade: BarChart3,
};

const toneClasses: Record<ActivityTone, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

function ActivityDot({ tone, kind }: { tone: ActivityTone; kind: ActivityKind }) {
  const Icon = activityIcons[kind];
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
        toneClasses[tone]
      )}
    >
      <Icon className="size-[15px]" />
    </span>
  );
}

/**
 * Static mock data standing in for API responses that have no backend yet
 * (dashboard KPIs/recent-activity feed, and topbar/sidebar chrome identity).
 * UI chrome STRINGS live in `src/i18n/*`; this file is entity data. The
 * students roster is no longer mocked here — `/students` fetches
 * `GET /api/v1/students` via `src/lib/api/students.ts`.
 */

export const mockSchool = {
  name: "مدرسة النور الأهلية",
  initial: "ن",
};

export const mockUser = {
  name: "أحمد الجبوري",
  role: "مدير المدرسة",
  initials: "أج",
};

export type ActivityTone = "success" | "info" | "warning";
export type ActivityKind = "payment" | "message" | "attendance" | "alert" | "grade";

export interface MockActivity {
  id: string;
  tone: ActivityTone;
  kind: ActivityKind;
  text: string;
  time: string;
}

export const mockActivity: MockActivity[] = [
  {
    id: "1",
    tone: "success",
    kind: "payment",
    text: "تم دفع قسط بقيمة 750,000 د.ع من ولي أمر الطالب علي حسين الكناني",
    time: "قبل 12 دقيقة",
  },
  {
    id: "2",
    tone: "info",
    kind: "message",
    text: "رسالة جديدة من ولية أمر الطالبة زينب مهدي العبودي بخصوص الغياب",
    time: "قبل 38 دقيقة",
  },
  {
    id: "3",
    tone: "success",
    kind: "attendance",
    text: "تم تسجيل حضور الصف السادس أ — 28 من أصل 30 طالباً",
    time: "قبل ساعة واحدة",
  },
  {
    id: "4",
    tone: "warning",
    kind: "alert",
    text: "قسط الطالب يوسف كريم الدليمي متأخر منذ 5 أيام",
    time: "قبل ساعتين",
  },
  {
    id: "5",
    tone: "success",
    kind: "grade",
    text: "تم رصد درجات مادة الرياضيات لطلبة الخامس ب",
    time: "أمس، 4:20 م",
  },
];

/**
 * Raw numeric KPI values — formatted through `src/lib/format.ts`
 * (`formatNumber`/`formatCurrencyIQD`) at the call site, per DESIGN_SYSTEM
 * §3.3's Western-digit numerals rule, instead of pre-formatted strings that
 * would bypass `Intl.NumberFormat` entirely (and silently mismatch a
 * locale's default numbering system once this data comes from a real API).
 * `attendance`/`fees` deltas are fractions (e.g. `0.021` = "2.1%"), formatted
 * with `style: "percent"` at the call site.
 */
export const mockKpis = {
  students: { value: 1284, delta: 12 },
  attendance: { value: 0.942, delta: 0.021 },
  fees: { value: 42_350_000, delta: 0.084 },
  messages: { value: 8, fromCount: 5 },
};

import type { ReactNode } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * KPI stat tile — dataviz stat-tile contract (label / value / delta / trend)
 * with DESIGN_SYSTEM §5.5 color discipline: the card is neutral; color lives
 * only on the delta, and only when direction carries a value judgment.
 * Values use the font's proportional figures (no tabular-nums at display size).
 */

export type DeltaTone = "success" | "neutral";

interface KpiCardProps {
  label: string;
  /** Pre-formatted Western-digit value, e.g. "1,284" or "94.2%". */
  value: string;
  /** Optional unit rendered after the value (e.g. currency). */
  unit?: string;
  icon: ReactNode;
  /** Tint the icon chip (info tint for the messages tile per §5.5); default neutral. */
  iconTone?: "neutral" | "info";
  delta?: {
    /** Pre-formatted Western-digit delta value, e.g. "+12" or "2.1%". */
    value: string;
    /** Named comparison period from the dictionary, e.g. "عن المعدل". */
    suffix: string;
    /** success = judged-good upward move (green + arrow); neutral = plain count. */
    tone: DeltaTone;
  };
  /** 12-point sparkline y-values (0–20 viewBox units); de-emphasis hue + accent end dot. */
  trend?: number[];
}

export function KpiCard({ label, value, unit, icon, iconTone = "neutral", delta, trend }: KpiCardProps) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-md [&_svg]:size-[17px]",
            iconTone === "info" ? "bg-info-soft text-info" : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </span>
      </div>

      <div className="text-2xl font-bold tracking-tight">
        <bdi dir="ltr">{value}</bdi>
        {unit && <span className="ms-1.5 text-sm font-semibold text-muted-foreground">{unit}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              delta.tone === "success" ? "text-success" : "font-medium text-muted-foreground"
            )}
          >
            {delta.tone === "success" && <ArrowUp className="size-3.5" aria-hidden />}
            <bdi dir="ltr">{delta.value}</bdi>
            <span className="ms-0.5">{delta.suffix}</span>
          </span>
        ) : (
          <span />
        )}
        {trend && trend.length > 1 && <Sparkline points={trend} accent={delta?.tone === "success"} />}
      </div>
    </Card>
  );
}

function Sparkline({ points, accent }: { points: number[]; accent?: boolean }) {
  const step = 48 / (points.length - 1);
  const path = points.map((y, i) => `${(i * step).toFixed(1)},${y}`).join(" ");
  const lastX = (points.length - 1) * step;
  const lastY = points[points.length - 1];

  return (
    <svg
      width="52"
      height="20"
      viewBox="0 0 52 20"
      fill="none"
      aria-hidden
      className="shrink-0 text-muted-foreground/60"
    >
      <polyline
        points={path}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="2.5"
        fill="currentColor"
        className={accent ? "text-success" : "text-primary"}
      />
    </svg>
  );
}

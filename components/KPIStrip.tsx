"use client";

import type { AdMetrics, Objective, Channel, TargetSet } from "@/types";
import { formatMetric, formatTarget } from "@/lib/metrics";
import { getTargetStatus } from "@/lib/badges";

const lightTargetStyles = {
  above: "text-emerald-600",
  near:  "text-muted",
  below: "text-amber-600",
};

interface KPITileProps {
  label: string;
  value: string;
  target?: { label: string; status: "above" | "near" | "below" };
  accent: string;
}

function KPITile({ label, value, target, accent }: KPITileProps) {
  return (
    <div
      className="relative bg-white rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-200"
      style={{ borderLeftColor: accent, borderLeftWidth: "3px" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest text-subtle mb-2">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-ink tracking-tight">{value}</p>
      {target && (
        <p className={`text-[11px] mt-1.5 tabular-nums ${lightTargetStyles[target.status]}`}>
          Target: {target.label}
        </p>
      )}
    </div>
  );
}

interface KPIStripProps {
  metrics: AdMetrics;
  objective: Objective;
  channel: Channel;
  brandColor: string;
  targets?: TargetSet;
  currency?: string;
}

export function KPIStrip({ metrics, objective, channel, brandColor, targets, currency = "$" }: KPIStripProps) {
  type KPIDef = { label: string; value: string; target?: { label: string; status: "above" | "near" | "below" } };
  const kpis: KPIDef[] = [];
  const fm = (v: number | undefined, t: string) => formatMetric(v, t, currency);
  const ft = (v: number, t: string) => formatTarget(v, t, currency);

  // All objectives and channels show Impressions + CTR as standard
  // Plus objective/channel-specific metrics
  if (objective === "awareness") {
    kpis.push({ label: "Impressions", value: fm(metrics.impressions, "impressions"),
      target: targets ? { label: ft(targets.awareness.impressions, "impressions"), status: getTargetStatus(metrics.impressions, targets.awareness.impressions) } : undefined });
    kpis.push({ label: "Unique Reach", value: fm(metrics.reach, "reach"),
      target: targets ? { label: ft(targets.awareness.reach, "reach"), status: getTargetStatus(metrics.reach ?? 0, targets.awareness.reach) } : undefined });
    if (metrics.videoViews) kpis.push({ label: "Video Views", value: fm(metrics.videoViews, "videoViews"),
      target: targets ? { label: ft(targets.awareness.videoViews, "videoViews"), status: getTargetStatus(metrics.videoViews ?? 0, targets.awareness.videoViews) } : undefined });
    kpis.push({ label: "CTR", value: fm(metrics.ctr, "ctr"),
      target: targets ? { label: ft(targets.awareness.ctr, "ctr"), status: getTargetStatus(metrics.ctr ?? 0, targets.awareness.ctr) } : undefined });
  } else {
    kpis.push({ label: "Impressions", value: fm(metrics.impressions, "impressions"),
      target: targets ? { label: ft(targets.conversion.impressions, "impressions"), status: getTargetStatus(metrics.impressions, targets.conversion.impressions) } : undefined });
    kpis.push({ label: "CTR", value: fm(metrics.ctr, "ctr"),
      target: targets ? { label: ft(targets.conversion.ctr, "ctr"), status: getTargetStatus(metrics.ctr ?? 0, targets.conversion.ctr) } : undefined });
    kpis.push({ label: "CPC", value: fm(metrics.cpc, "cpc"),
      target: targets ? { label: ft(targets.conversion.cpc, "cpc"), status: getTargetStatus(metrics.cpc ?? 0, targets.conversion.cpc, false) } : undefined });
    kpis.push({ label: "ROAS", value: fm(metrics.roas, "roas"),
      target: targets ? { label: ft(targets.conversion.roas, "roas"), status: getTargetStatus(metrics.roas ?? 0, targets.conversion.roas) } : undefined });
  }

  // Spend always shown last
  kpis.push({ label: "Spend", value: fm(metrics.spend, "spend") });

  const cols = kpis.length <= 4 ? "lg:grid-cols-4" : "lg:grid-cols-5";
  return (
    <div className={`grid grid-cols-2 ${cols} gap-4`}>
      {kpis.map((kpi) => <KPITile key={kpi.label} {...kpi} accent={brandColor} />)}
    </div>
  );
}

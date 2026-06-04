"use client";

import type { AdMetrics, Objective, Channel, TargetSet } from "@/types";
import { formatMetric, formatTarget } from "@/lib/metrics";
import { getTargetStatus, targetStatusStyles } from "@/lib/badges";

interface KPITileProps {
  label: string;
  value: string;
  target?: { label: string; status: "above" | "near" | "below" };
  accent: string;
}

function KPITile({ label, value, target, accent }: KPITileProps) {
  return (
    <div
      className="relative bg-surface-2 rounded-xl p-5 border border-navy-700 hover:border-navy-600 transition-all duration-200 group"
      style={{ borderLeftColor: accent, borderLeftWidth: "3px" }}
    >
      <p className="text-[11px] font-medium uppercase tracking-widest text-navy-400 mb-2">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums text-white tracking-tight">
        {value}
      </p>
      {target && (
        <p className={`text-[11px] mt-1.5 tabular-nums ${targetStatusStyles[target.status]}`}>
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
}

export function KPIStrip({
  metrics,
  objective,
  channel,
  brandColor,
  targets,
}: KPIStripProps) {
  type KPIDef = {
    label: string;
    value: string;
    target?: { label: string; status: "above" | "near" | "below" };
  };

  const kpis: KPIDef[] = [];

  if (objective === "awareness") {
    if (channel === "meta") {
      kpis.push({
        label: "Reach",
        value: formatMetric(metrics.reach, "reach"),
        target: targets
          ? {
              label: formatTarget(targets.awareness.reach, "reach"),
              status: getTargetStatus(metrics.reach ?? 0, targets.awareness.reach),
            }
          : undefined,
      });
      kpis.push({
        label: "Frequency",
        value: formatMetric(metrics.frequency, "frequency"),
        target: targets
          ? {
              label: formatTarget(targets.awareness.frequency, "frequency"),
              // Lower frequency is better for avoiding fatigue — but meeting target is on-par
              status: getTargetStatus(
                metrics.frequency ?? 0,
                targets.awareness.frequency,
                false
              ),
            }
          : undefined,
      });
      kpis.push({
        label: "CPM",
        value: formatMetric(metrics.cpm, "cpm"),
        target: targets
          ? {
              label: formatTarget(targets.awareness.cpm, "cpm"),
              status: getTargetStatus(
                metrics.cpm ?? 0,
                targets.awareness.cpm,
                false
              ),
            }
          : undefined,
      });
      kpis.push({
        label: "Video View Rate",
        value: formatMetric(metrics.videoViewRate, "videoViewRate"),
        target: targets
          ? {
              label: formatTarget(targets.awareness.vtr, "videoViewRate"),
              status: getTargetStatus(
                metrics.videoViewRate ?? 0,
                targets.awareness.vtr
              ),
            }
          : undefined,
      });
    } else if (channel === "google") {
      kpis.push({ label: "Impressions", value: formatMetric(metrics.impressions, "impressions") });
      kpis.push({ label: "Clicks", value: formatMetric(metrics.clicks, "clicks") });
      kpis.push({ label: "CPM", value: formatMetric(metrics.cpm, "cpm") });
      kpis.push({ label: "CTR", value: formatMetric(metrics.ctr, "ctr") });
    } else if (channel === "tiktok") {
      kpis.push({ label: "Reach", value: formatMetric(metrics.reach, "reach") });
      kpis.push({ label: "Video Views", value: formatMetric(metrics.videoViews, "videoViews") });
      kpis.push({ label: "Video View Rate", value: formatMetric(metrics.videoViewRate, "videoViewRate") });
      kpis.push({ label: "CPM", value: formatMetric(metrics.cpm, "cpm") });
    }
  } else {
    // Conversion objective — channel-agnostic (all channels track these)
    kpis.push({
      label: "CTR",
      value: formatMetric(metrics.ctr, "ctr"),
      target: targets
        ? {
            label: formatTarget(targets.conversion.ctr, "ctr"),
            status: getTargetStatus(metrics.ctr ?? 0, targets.conversion.ctr),
          }
        : undefined,
    });
    kpis.push({
      label: "CPC",
      value: formatMetric(metrics.cpc, "cpc"),
      target: targets
        ? {
            label: formatTarget(targets.conversion.cpc, "cpc"),
            status: getTargetStatus(
              metrics.cpc ?? 0,
              targets.conversion.cpc,
              false
            ),
          }
        : undefined,
    });
    kpis.push({
      label: "Cost per Result",
      value: formatMetric(metrics.costPerResult, "costPerResult"),
      target: targets
        ? {
            label: formatTarget(targets.conversion.cpl, "cpl"),
            status: getTargetStatus(
              metrics.costPerResult ?? 0,
              targets.conversion.cpl,
              false
            ),
          }
        : undefined,
    });
    kpis.push({
      label: "ROAS",
      value: formatMetric(metrics.roas, "roas"),
      target: targets
        ? {
            label: formatTarget(targets.conversion.roas, "roas"),
            status: getTargetStatus(
              metrics.roas ?? 0,
              targets.conversion.roas
            ),
          }
        : undefined,
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KPITile key={kpi.label} {...kpi} accent={brandColor} />
      ))}
    </div>
  );
}

import type { AdData, BadgeConfig, BadgeVariant, TargetStatus } from "@/types";

export function getBadge(ad: AdData): BadgeConfig {
  const { metrics, objective, channel } = ad;

  if (objective === "conversion") {
    if (metrics.roas !== undefined && metrics.roas >= 3.5) {
      return { label: "Scaling", variant: "scaling" };
    }
    if (metrics.roas !== undefined && metrics.roas >= 2.5) {
      return { label: "On Target", variant: "on-target" };
    }
    if (metrics.ctr !== undefined && metrics.ctr < 0.01) {
      return { label: "Creative Testing", variant: "creative-testing" };
    }
    return { label: "On Target", variant: "on-target" };
  }

  // Awareness
  if (channel === "meta") {
    if (metrics.frequency !== undefined && metrics.frequency > 3.5) {
      return { label: "Audience Refresh Due", variant: "refresh" };
    }
    if (
      metrics.frequency !== undefined &&
      metrics.frequency >= 2 &&
      metrics.frequency <= 3.5
    ) {
      return { label: "Healthy Delivery", variant: "healthy" };
    }
  }

  if (metrics.cpm !== undefined && metrics.cpm > 25) {
    return { label: "Premium Placement", variant: "premium" };
  }

  if (
    metrics.videoViewRate !== undefined &&
    metrics.videoViewRate >= 0.3
  ) {
    return { label: "Scaling", variant: "scaling" };
  }

  return { label: "Healthy Delivery", variant: "healthy" };
}

export const badgeStyles: Record<BadgeVariant, string> = {
  scaling:
    "bg-gold-500/15 text-gold-400 border border-gold-500/30",
  "on-target":
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  healthy:
    "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  refresh:
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  "creative-testing":
    "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  premium:
    "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

export function getTargetStatus(
  actual: number,
  target: number,
  higherIsBetter = true
): TargetStatus {
  const ratio = higherIsBetter ? actual / target : target / actual;
  if (ratio >= 1) return "above";
  if (ratio >= 0.8) return "near";
  return "below";
}

export const targetStatusStyles: Record<TargetStatus, string> = {
  above: "text-gold-400",
  near: "text-navy-300",
  below: "text-amber-500",
};

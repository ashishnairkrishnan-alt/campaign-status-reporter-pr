import type { AdData, AdMetrics, CampaignGroup, AdsetGroup } from "@/types";
import { detectObjective } from "@/config/brands";

export function aggregateMetrics(ads: AdData[]): AdMetrics {
  if (ads.length === 0) return { impressions: 0, spend: 0 };

  const totals: AdMetrics = { impressions: 0, spend: 0 };

  for (const ad of ads) {
    const m = ad.metrics;
    totals.impressions += m.impressions;
    totals.spend += m.spend;
    if (m.clicks)     totals.clicks     = (totals.clicks     ?? 0) + m.clicks;
    if (m.videoViews) totals.videoViews = (totals.videoViews ?? 0) + m.videoViews;
    if (m.reach)      totals.reach      = Math.max(totals.reach ?? 0, m.reach);
  }

  if (totals.impressions > 0) {
    if (totals.clicks)     totals.ctr          = totals.clicks / totals.impressions;
    if (totals.spend > 0)  totals.cpm          = (totals.spend / totals.impressions) * 1000;
    if (totals.videoViews) totals.videoViewRate = totals.videoViews / totals.impressions;
  }
  if (totals.clicks && totals.clicks > 0) totals.cpc = totals.spend / totals.clicks;
  if (totals.reach  && totals.reach  > 0 && totals.impressions > 0)
    totals.frequency = totals.impressions / totals.reach;

  return totals;
}

export function groupByCampaign(ads: AdData[]): CampaignGroup[] {
  const campaignMap = new Map<string, AdData[]>();
  for (const ad of ads) {
    const existing = campaignMap.get(ad.campaignName) ?? [];
    existing.push(ad);
    campaignMap.set(ad.campaignName, existing);
  }

  return Array.from(campaignMap.entries()).map(([campaignName, campAds]) => {
    const adsetMap = new Map<string, AdData[]>();
    for (const ad of campAds) {
      const existing = adsetMap.get(ad.adsetName) ?? [];
      existing.push(ad);
      adsetMap.set(ad.adsetName, existing);
    }
    const adsets: AdsetGroup[] = Array.from(adsetMap.entries()).map(
      ([adsetName, adsetAds]) => ({ adsetName, ads: adsetAds, totals: aggregateMetrics(adsetAds) })
    );
    return { campaignName, objective: detectObjective(campaignName), adsets, totals: aggregateMetrics(campAds) };
  });
}

/** Format a metric value for display. currency defaults to "£". */
export function formatMetric(
  value: number | undefined,
  type: string,
  currency = "$"
): string {
  if (value === undefined || value === null) return "—";

  switch (type) {
    case "reach":
    case "impressions":
    case "videoViews":
    case "clicks":
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`;
      return value.toLocaleString();

    case "spend":
    case "cpm":
    case "cpc":
    case "cpl":
    case "costPerResult":
      return `${currency}${value.toFixed(2)}`;

    case "ctr":
    case "videoViewRate":
      const percent = value * 100;
      if (percent > 0 && percent < 1) return `${percent.toFixed(2)}%`;
      return `${percent.toFixed(1)}%`;

    case "frequency":
      return value.toFixed(2);

    case "roas":
      return `${value.toFixed(1)}x`;

    default:
      return value.toLocaleString();
  }
}

export function formatTarget(value: number, type: string, currency = "$"): string {
  return formatMetric(value, type, currency);
}

// Deduplicate ads by creative name — one card per unique ad, metrics merged
export interface DeduplicatedAd extends AdData {
  adsetCount: number;
  adsetNames: string[];
}

export function deduplicateByCreative(ads: AdData[]): DeduplicatedAd[] {
  const map = new Map<string, AdData[]>();

  for (const ad of ads) {
    const existing = map.get(ad.adName) ?? [];
    existing.push(ad);
    map.set(ad.adName, existing);
  }

  const result: DeduplicatedAd[] = [];

  for (const [, group] of map) {
    const base   = group[0];
    const merged = aggregateMetrics(group);
    result.push({
      ...base,
      metrics:    merged,
      adsetNames: [...new Set(group.map((a) => a.adsetName))],
      adsetCount: new Set(group.map((a) => a.adsetName)).size,
    });
  }

  return result.sort((a, b) => b.metrics.spend - a.metrics.spend);
}

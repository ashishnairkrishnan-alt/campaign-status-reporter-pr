import type { AdData, AdMetrics, CampaignGroup, AdsetGroup } from "@/types";
import { detectObjective } from "@/config/brands";

export function aggregateMetrics(ads: AdData[]): AdMetrics {
  if (ads.length === 0) {
    return { impressions: 0, spend: 0 };
  }

  const totals: AdMetrics = { impressions: 0, spend: 0 };

  for (const ad of ads) {
    const m = ad.metrics;
    totals.impressions += m.impressions;
    totals.spend += m.spend;
    if (m.clicks) totals.clicks = (totals.clicks ?? 0) + m.clicks;
    if (m.videoViews)
      totals.videoViews = (totals.videoViews ?? 0) + m.videoViews;
    if (m.reach) totals.reach = Math.max(totals.reach ?? 0, m.reach);
  }

  if (totals.impressions > 0) {
    if (totals.clicks) totals.ctr = totals.clicks / totals.impressions;
    if (totals.spend > 0) totals.cpm = (totals.spend / totals.impressions) * 1000;
    if (totals.videoViews)
      totals.videoViewRate = totals.videoViews / totals.impressions;
  }

  if (totals.clicks && totals.clicks > 0) {
    totals.cpc = totals.spend / totals.clicks;
  }

  if (totals.reach && totals.reach > 0 && totals.impressions > 0) {
    totals.frequency = totals.impressions / totals.reach;
  }

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
      ([adsetName, adsetAds]) => ({
        adsetName,
        ads: adsetAds,
        totals: aggregateMetrics(adsetAds),
      })
    );

    return {
      campaignName,
      objective: detectObjective(campaignName),
      adsets,
      totals: aggregateMetrics(campAds),
    };
  });
}

export function formatMetric(value: number | undefined, type: string): string {
  if (value === undefined || value === null) return "—";

  switch (type) {
    case "reach":
    case "impressions":
    case "videoViews":
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
      return value.toLocaleString();
    case "spend":
    case "cpm":
    case "cpc":
    case "cpl":
    case "costPerResult":
      return `£${value.toFixed(2)}`;
    case "clicks":
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
      return value.toLocaleString();
    case "ctr":
    case "videoViewRate":
      return `${(value * 100).toFixed(1)}%`;
    case "frequency":
      return value.toFixed(2);
    case "roas":
      return `${value.toFixed(1)}x`;
    default:
      return value.toLocaleString();
  }
}

export function formatTarget(value: number, type: string): string {
  return formatMetric(value, type);
}

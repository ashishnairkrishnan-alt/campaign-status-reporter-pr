import type { AdData, AdMetrics } from "@/types";
import { detectObjective } from "@/config/brands";

const WINDSOR_BASE = "https://connectors.windsor.ai/all";

const FIELDS = [
  "date",
  "datasource",
  "account_name",
  "campaign",
  "adset",
  "ad",
  "impressions",
  "reach",
  "frequency",
  "spend",
  "clicks",
  "ctr",
  "cpm",
  "cpc",
  "video_views",
  "video_view_rate",
  "roas",
  "cost_per_result",
  "thumbnail_url",
].join(",");

interface WindsorRow {
  date?: string;
  campaign?: string;
  adset?: string;
  ad?: string;
  impressions?: string | number;
  reach?: string | number;
  frequency?: string | number;
  spend?: string | number;
  clicks?: string | number;
  ctr?: string | number;
  cpm?: string | number;
  cpc?: string | number;
  video_views?: string | number;
  video_view_rate?: string | number;
  roas?: string | number;
  cost_per_result?: string | number;
  thumbnail_url?: string;
}

function n(v: string | number | undefined): number {
  if (v === undefined || v === null || v === "") return 0;
  const parsed = typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : v;
  return isNaN(parsed) ? 0 : parsed;
}

function buildDatePreset(dateRange: { start: string; end: string }): string {
  const diffMs =
    new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 7) return "last_7d";
  if (days <= 14) return "last_14d";
  return "last_30d";
}

export async function fetchAds(
  accountId: string,
  dateRange: { start: string; end: string },
  apiKey: string
): Promise<AdData[]> {
  const preset = buildDatePreset(dateRange);
  const url = new URL(WINDSOR_BASE);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("date_preset", preset);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("account_id", accountId);

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Windsor API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rows: WindsorRow[] = Array.isArray(json)
    ? json
    : json.data ?? json.rows ?? [];

  if (rows.length === 0) return [];

  // Group by ad to aggregate metrics across date rows
  const adMap = new Map<string, { row: WindsorRow; metrics: AdMetrics }>();

  for (const row of rows) {
    const key = `${row.campaign}||${row.adset}||${row.ad}`;
    const existing = adMap.get(key);

    if (!existing) {
      adMap.set(key, {
        row,
        metrics: {
          impressions: n(row.impressions),
          reach: n(row.reach) || undefined,
          frequency: n(row.frequency) || undefined,
          spend: n(row.spend),
          clicks: n(row.clicks) || undefined,
          ctr: n(row.ctr) || undefined,
          cpm: n(row.cpm) || undefined,
          cpc: n(row.cpc) || undefined,
          videoViews: n(row.video_views) || undefined,
          videoViewRate: n(row.video_view_rate) || undefined,
          roas: n(row.roas) || undefined,
          costPerResult: n(row.cost_per_result) || undefined,
        },
      });
    } else {
      // Sum impressionable metrics; recalculate rates after
      existing.metrics.impressions += n(row.impressions);
      existing.metrics.spend += n(row.spend);
      if (existing.metrics.clicks !== undefined)
        existing.metrics.clicks += n(row.clicks);
      if (existing.metrics.reach !== undefined)
        existing.metrics.reach = Math.max(
          existing.metrics.reach,
          n(row.reach)
        );
      if (existing.metrics.videoViews !== undefined)
        existing.metrics.videoViews =
          (existing.metrics.videoViews ?? 0) + n(row.video_views);
    }
  }

  // Recalculate derived rates after aggregation
  const ads: AdData[] = [];
  let idx = 0;

  for (const [, { row, metrics }] of adMap) {
    if (metrics.impressions > 0) {
      if (metrics.clicks !== undefined && metrics.clicks > 0) {
        metrics.ctr = metrics.clicks / metrics.impressions;
      }
      if (metrics.spend > 0 && metrics.impressions > 0) {
        metrics.cpm = (metrics.spend / metrics.impressions) * 1000;
      }
      if (metrics.clicks !== undefined && metrics.clicks > 0) {
        metrics.cpc = metrics.spend / metrics.clicks;
      }
      if (metrics.reach && metrics.reach > 0) {
        metrics.frequency = metrics.impressions / metrics.reach;
      }
      if (metrics.videoViews !== undefined && metrics.videoViews > 0) {
        metrics.videoViewRate = metrics.videoViews / metrics.impressions;
      }
    }

    const campaignName = row.campaign ?? "Unknown Campaign";
    ads.push({
      id: `meta-${accountId}-${idx++}`,
      campaignName,
      adsetName: row.adset ?? "Unknown Ad Set",
      adName: row.ad ?? "Unknown Ad",
      channel: "meta",
      objective: detectObjective(campaignName),
      metrics,
      thumbnailUrl: row.thumbnail_url || undefined,
      dateRange,
    });
  }

  return ads;
}

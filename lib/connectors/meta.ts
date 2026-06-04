import type { AdData, AdMetrics } from "@/types";
import { detectObjective } from "@/config/brands";

// Windsor.ai returns all accounts under the API key.
// We filter client-side by account_name (e.g. "ARE_Chivas_Internal").
// Do NOT send account_id — Windsor ignores it and returns 0 rows.

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
  account_name?: string;
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
  const p = typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : v;
  return isNaN(p) ? 0 : p;
}

function buildDatePreset(dateRange: { start: string; end: string }): string {
  const days = Math.round(
    (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / 86400000
  );
  if (days <= 7) return "last_7d";
  if (days <= 14) return "last_14d";
  return "last_30d";
}

export async function fetchAds(
  accountName: string,            // Windsor "Account Name" e.g. "ARE_Chivas_Internal"
  dateRange: { start: string; end: string },
  apiKey: string
): Promise<AdData[]> {
  const preset = buildDatePreset(dateRange);

  const url = new URL(WINDSOR_BASE);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("date_preset", preset);
  url.searchParams.set("fields", FIELDS);
  // DO NOT add account_id — Windsor doesn't support it as a filter

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`Windsor API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const allRows: WindsorRow[] = Array.isArray(json)
    ? json
    : json.data ?? json.rows ?? [];

  // Filter to just this brand's account
  const rows = accountName
    ? allRows.filter((r) =>
        (r.account_name ?? "").toLowerCase() === accountName.toLowerCase()
      )
    : allRows;

  if (rows.length === 0) return [];

  // Aggregate by ad (multiple date rows per ad)
  const adMap = new Map<string, { row: WindsorRow; metrics: AdMetrics }>();

  for (const row of rows) {
    const key = `${row.campaign}||${row.adset}||${row.ad}`;
    const ex  = adMap.get(key);

    if (!ex) {
      adMap.set(key, {
        row,
        metrics: {
          impressions:   n(row.impressions),
          reach:         n(row.reach)           || undefined,
          frequency:     n(row.frequency)       || undefined,
          spend:         n(row.spend),
          clicks:        n(row.clicks)          || undefined,
          ctr:           n(row.ctr)             || undefined,
          cpm:           n(row.cpm)             || undefined,
          cpc:           n(row.cpc)             || undefined,
          videoViews:    n(row.video_views)     || undefined,
          videoViewRate: n(row.video_view_rate) || undefined,
          roas:          n(row.roas)            || undefined,
          costPerResult: n(row.cost_per_result) || undefined,
        },
      });
    } else {
      ex.metrics.impressions += n(row.impressions);
      ex.metrics.spend       += n(row.spend);
      if (ex.metrics.clicks    !== undefined) ex.metrics.clicks    += n(row.clicks);
      if (ex.metrics.videoViews !== undefined) ex.metrics.videoViews = (ex.metrics.videoViews ?? 0) + n(row.video_views);
      if (ex.metrics.reach     !== undefined) ex.metrics.reach      = Math.max(ex.metrics.reach, n(row.reach));
    }
  }

  // Recalculate derived rates
  const ads: AdData[] = [];
  let idx = 0;

  for (const [, { row, metrics }] of adMap) {
    if (metrics.impressions > 0) {
      if (metrics.clicks)     metrics.ctr          = metrics.clicks / metrics.impressions;
      if (metrics.spend > 0)  metrics.cpm          = (metrics.spend / metrics.impressions) * 1000;
      if (metrics.clicks)     metrics.cpc          = metrics.spend / metrics.clicks;
      if (metrics.reach)      metrics.frequency    = metrics.impressions / metrics.reach;
      if (metrics.videoViews) metrics.videoViewRate = metrics.videoViews / metrics.impressions;
    }

    const campaignName = row.campaign ?? "Unknown Campaign";
    ads.push({
      id:           `meta-${accountName}-${idx++}`,
      campaignName,
      adsetName:    row.adset ?? "Unknown Ad Set",
      adName:       row.ad    ?? "Unknown Ad",
      channel:      "meta",
      objective:    detectObjective(campaignName),
      metrics,
      thumbnailUrl: row.thumbnail_url || undefined,
      dateRange,
    });
  }

  return ads;
}

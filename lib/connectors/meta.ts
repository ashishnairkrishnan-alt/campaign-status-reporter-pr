import type { AdData, AdMetrics } from "@/types";
import { detectObjective } from "@/config/brands";

// Windsor.ai pulls ALL accounts connected to your API key.
// We pass the numeric account ID as "account_id" — Windsor.ai uses this to
// filter to just that Meta Ad Account. If omitted, all connected accounts return.

const WINDSOR_BASE = "https://connectors.windsor.ai/all";

const FIELDS = [
  "date",
  "datasource",
  "account_name",
  "account_id",
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
  account_id?: string;
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

  // Pass account_id only if it's a real ID (not the placeholder)
  const isReal =
    accountId &&
    accountId !== "ACT_XXXXXXXXX" &&
    accountId.toLowerCase() !== "act_xxxxxxxxx";

  if (isReal) {
    // Windsor.ai accepts both numeric IDs and ACT_ prefixed IDs
    url.searchParams.set("account_id", accountId);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Windsor API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  // Windsor returns { data: [...] } or a plain array
  const rows: WindsorRow[] = Array.isArray(json)
    ? json
    : json.data ?? json.rows ?? [];

  if (rows.length === 0) return [];

  // If multiple accounts returned, filter to just our account
  const filtered = isReal
    ? rows.filter((r) => {
        const rid = String(r.account_id ?? "").replace(/^act_/i, "");
        const wantId = accountId.replace(/^act_/i, "");
        return rid === wantId || !rid; // keep rows with matching or empty account_id
      })
    : rows;

  // Group by ad name to aggregate metrics across date rows
  const adMap = new Map<string, { row: WindsorRow; metrics: AdMetrics }>();

  for (const row of filtered) {
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
      existing.metrics.impressions += n(row.impressions);
      existing.metrics.spend += n(row.spend);
      if (existing.metrics.clicks !== undefined)
        existing.metrics.clicks += n(row.clicks);
      if (existing.metrics.reach !== undefined)
        existing.metrics.reach = Math.max(existing.metrics.reach, n(row.reach));
      if (existing.metrics.videoViews !== undefined)
        existing.metrics.videoViews =
          (existing.metrics.videoViews ?? 0) + n(row.video_views);
    }
  }

  // Recalculate derived rates
  const ads: AdData[] = [];
  let idx = 0;

  for (const [, { row, metrics }] of adMap) {
    if (metrics.impressions > 0) {
      if (metrics.clicks) metrics.ctr = metrics.clicks / metrics.impressions;
      if (metrics.spend > 0) metrics.cpm = (metrics.spend / metrics.impressions) * 1000;
      if (metrics.clicks) metrics.cpc = metrics.spend / metrics.clicks;
      if (metrics.reach) metrics.frequency = metrics.impressions / metrics.reach;
      if (metrics.videoViews)
        metrics.videoViewRate = metrics.videoViews / metrics.impressions;
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

import type { AdData, AdMetrics } from "@/types";
import { detectObjective } from "@/config/brands";

const WINDSOR_BASE = "https://connectors.windsor.ai/all";

// Request all possible field name variants — Windsor varies by connector version
const FIELDS = [
  "date",
  "datasource",
  "account_name",
  "campaign",
  "campaign_name",
  "adset",
  "adset_name",
  "adgroup",
  "adgroup_name",
  "ad",
  "ad_name",
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
  "video_url",
].join(",");

interface WindsorRow {
  date?: string;
  account_name?: string;
  // Campaign — Windsor returns one of these
  campaign?: string;
  campaign_name?: string;
  // Adset — Windsor returns one of these
  adset?: string;
  adset_name?: string;
  adgroup?: string;
  adgroup_name?: string;
  // Ad — Windsor returns one of these
  ad?: string;
  ad_name?: string;
  // Metrics
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
  video_url?: string;
}

// Pick whichever field name Windsor actually returned
function getCampaign(r: WindsorRow): string {
  return r.campaign_name ?? r.campaign ?? "";
}
function getAdset(r: WindsorRow): string {
  return r.adset_name ?? r.adset ?? r.adgroup_name ?? r.adgroup ?? "";
}
function getAd(r: WindsorRow): string {
  return r.ad_name ?? r.ad ?? "";
}

function n(v: string | number | undefined): number {
  if (v === undefined || v === null || v === "") return 0;
  const p = typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : v;
  return isNaN(p) ? 0 : p;
}

function widenPreset(_preset: string): string {
  return "last_180d"; // always fetch wide window — data may be months old
}

function buildDatePreset(dateRange: { start: string; end: string }): string {
  const days = Math.round(
    (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / 86400000
  );
  if (days <= 7)  return "last_7d";
  if (days <= 14) return "last_14d";
  if (days <= 30) return "last_30d";
  return "last_180d";
}

export async function fetchAds(
  accountName: string,
  dateRange: { start: string; end: string },
  apiKey: string
): Promise<AdData[]> {
  const preset = widenPreset(buildDatePreset(dateRange));

  const url = new URL(WINDSOR_BASE);
  url.searchParams.set("api_key",      apiKey);
  url.searchParams.set("date_preset",  preset);
  url.searchParams.set("fields",       FIELDS);
  // Do NOT add account_id — Windsor doesn't filter by it

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Windsor ${res.status}: ${res.statusText}`);

  const json = await res.json();
  const allRows: WindsorRow[] = Array.isArray(json)
    ? json
    : json.data ?? json.rows ?? [];

  // Filter to this brand's account AND the selected date range
  const rows = allRows.filter((r) => {
    if (accountName && (r.account_name ?? "").toLowerCase() !== accountName.toLowerCase()) return false;
    // Date filter — Windsor date format is YYYY-MM-DD, string comparison works
    if (r.date && r.date < dateRange.start) return false;
    if (r.date && r.date > dateRange.end)   return false;
    return true;
  });

  if (rows.length === 0) return [];

  // Aggregate by campaign + adset + ad across date rows
  const adMap = new Map<string, { row: WindsorRow; metrics: AdMetrics }>();

  for (const row of rows) {
    const campaignName = getCampaign(row);
    const adsetName    = getAdset(row);
    const adName       = getAd(row);
    const key          = `${campaignName}||${adsetName}||${adName}`;
    const ex           = adMap.get(key);

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
      if (ex.metrics.clicks     !== undefined) ex.metrics.clicks     += n(row.clicks);
      if (ex.metrics.videoViews !== undefined) ex.metrics.videoViews  = (ex.metrics.videoViews ?? 0) + n(row.video_views);
      if (ex.metrics.reach      !== undefined) ex.metrics.reach       = Math.max(ex.metrics.reach, n(row.reach));
    }
  }

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

    const campaignName = getCampaign(row) || "Unknown Campaign";
    const adsetName    = getAdset(row)    || "";
    const adName       = getAd(row)       || "";

    ads.push({
      id:           `meta-${accountName}-${idx++}`,
      campaignName,
      adsetName:    adsetName || campaignName,   // fall back to campaign if adset empty
      adName:       adName    || campaignName,   // fall back to campaign if ad name empty
      channel:      "meta",
      objective:    detectObjective(campaignName),
      metrics,
      thumbnailUrl: row.thumbnail_url || undefined,
      videoUrl:     row.video_url     || undefined,
      dateRange,
    });
  }

  return ads;
}

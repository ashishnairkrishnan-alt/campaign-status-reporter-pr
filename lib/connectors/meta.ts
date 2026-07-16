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
  "video_3_sec_watched_actions",
  "three_second_video_views",
  "video_p25_watched_actions",
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
  // Video fields — Windsor uses different names depending on connector version
  video_3_sec_watched_actions?: string | number;
  three_second_video_views?: string | number;
  video_p25_watched_actions?: string | number;
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

function rate(v: string | number | undefined): number {
  const value = n(v);
  if (!value) return 0;
  return value > 1 ? value / 100 : value;
}

function getVideoViews(r: WindsorRow, impressions: number): number {
  // Try direct fields first (Windsor Meta connector uses different names depending on version)
  const direct =
    n(r.video_3_sec_watched_actions) ||
    n(r.three_second_video_views)    ||
    n(r.video_views)                 ||
    n(r.video_p25_watched_actions);
  if (direct > 0) return direct;

  // Fallback: derive 3-sec views from video_view_rate × impressions
  const vvr = rate(r.video_view_rate);
  return vvr > 0 && impressions > 0 ? Math.round(vvr * impressions) : 0;
}

function getReach(r: WindsorRow): number {
  const directReach = n(r.reach);
  if (directReach) return directReach;

  const impressions = n(r.impressions);
  const frequency = n(r.frequency);
  return impressions > 0 && frequency > 0 ? impressions / frequency : 0;
}

function getClicks(r: WindsorRow): number {
  const directClicks = n(r.clicks);
  if (directClicks) return directClicks;

  const impressions = n(r.impressions);
  const ctr = rate(r.ctr);
  return impressions > 0 && ctr > 0 ? impressions * ctr : 0;
}

function addMetric(metrics: AdMetrics, key: "clicks" | "videoViews", value: number) {
  if (value <= 0) return;
  metrics[key] = ((metrics[key] as number | undefined) ?? 0) + value;
}

function maxMetric(metrics: AdMetrics, key: "reach", value: number) {
  if (value <= 0) return;
  metrics[key] = Math.max((metrics[key] as number | undefined) ?? 0, value);
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
  const preset = buildDatePreset(dateRange);

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
      const imp = n(row.impressions);
      adMap.set(key, {
        row,
        metrics: {
          impressions:   imp,
          reach:         getReach(row)              || undefined,
          frequency:     n(row.frequency)           || undefined,
          spend:         n(row.spend),
          clicks:        getClicks(row)             || undefined,
          ctr:           rate(row.ctr)              || undefined,
          cpm:           n(row.cpm)                 || undefined,
          cpc:           n(row.cpc)                 || undefined,
          videoViews:    getVideoViews(row, imp)    || undefined,
          videoViewRate: rate(row.video_view_rate)  || undefined,
          roas:          n(row.roas)                || undefined,
          costPerResult: n(row.cost_per_result)     || undefined,
        },
      });
    } else {
      const imp = n(row.impressions);
      ex.metrics.impressions += imp;
      ex.metrics.spend       += n(row.spend);
      addMetric(ex.metrics, "clicks",     getClicks(row));
      addMetric(ex.metrics, "videoViews", getVideoViews(row, imp));
      maxMetric(ex.metrics, "reach",      getReach(row));
    }
  }

  const ads: AdData[] = [];
  let idx = 0;

  for (const [, { row, metrics }] of adMap) {
    if (metrics.impressions > 0) {
      if ((metrics.clicks ?? 0) > 0)     metrics.ctr          = (metrics.clicks ?? 0) / metrics.impressions;
      if (metrics.spend > 0)             metrics.cpm          = (metrics.spend / metrics.impressions) * 1000;
      if ((metrics.clicks ?? 0) > 0)     metrics.cpc          = metrics.spend / (metrics.clicks ?? 1);
      if ((metrics.reach ?? 0) > 0)      metrics.frequency    = metrics.impressions / (metrics.reach ?? 1);
      if ((metrics.videoViews ?? 0) > 0) metrics.videoViewRate = (metrics.videoViews ?? 0) / metrics.impressions;
    }

    const campaignName = getCampaign(row) || "Unknown Campaign";
    const adsetName    = getAdset(row)    || "";
    const adName       = getAd(row)       || "";

    ads.push({
      id:           `meta-${accountName}-${idx++}`,
      campaignName,
      adsetName:    adsetName || campaignName,
      adName:       adName    || campaignName,
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

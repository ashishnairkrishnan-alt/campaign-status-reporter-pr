import type { AdData, AdMetrics } from "@/types";
import { detectObjective } from "@/config/brands";

const WINDSOR_BASE = "https://connectors.windsor.ai/all";

// Campaign-level fields — no date and no adset/ad breakdown.
// Omitting "date" makes Windsor return one aggregated row per campaign for the
// entire date_preset period, giving us deduplicated reach and correct totals.
const CAMPAIGN_FIELDS = [
  "account_name",
  "campaign",
  "campaign_name",
  "impressions",
  "reach",
  "frequency",
  "spend",
  "clicks",
  "ctr",
  "cpm",
  "actions_video_view",
  "video_play_actions_video_view",
  "video_views",
  "video_3_sec_watched_actions",
  "video_view_rate",
].join(",");

// Ad-level fields — full breakdown for creative gallery
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
  // Windsor-correct video field names (confirmed working)
  "actions_video_view",
  "video_play_actions_video_view",
  // Legacy/fallback video field names
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
  // Video fields — Windsor correct names confirmed via API
  actions_video_view?: string | number;
  video_play_actions_video_view?: string | number;
  // Legacy/fallback video field names
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
  // Windsor-correct field names (confirmed via API)
  const direct =
    n(r.actions_video_view)              ||
    n(r.video_play_actions_video_view)   ||
    // Legacy fallbacks
    n(r.video_3_sec_watched_actions)     ||
    n(r.three_second_video_views)        ||
    n(r.video_views)                     ||
    n(r.video_p25_watched_actions);
  if (direct > 0) return direct;

  // Last resort: derive from video_view_rate × impressions
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

export async function fetchAds(
  accountName: string,
  dateRange: { start: string; end: string },
  apiKey: string,
  facebookAccountId?: string
): Promise<AdData[]> {
  const url = new URL(WINDSOR_BASE);
  url.searchParams.set("api_key",    apiKey);
  url.searchParams.set("date_from",  dateRange.start);
  url.searchParams.set("date_to",    dateRange.end);
  url.searchParams.set("fields",     FIELDS);
  if (facebookAccountId) {
    url.searchParams.set("select_accounts", `facebook__${facebookAccountId}`);
  }

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
    // Skip rows where Windsor returns null impressions — bad/unsynced data
    if (!row.impressions && !row.spend) continue;

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

// Fetch campaign-level totals — no adset/ad breakdown, so reach/impressions are
// deduplicated at the campaign level (matches what Meta Ads Manager shows).
export async function fetchCampaignTotals(
  accountName: string,
  dateRange: { start: string; end: string },
  apiKey: string,
  facebookAccountId?: string
): Promise<AdMetrics> {
  const url = new URL(WINDSOR_BASE);
  url.searchParams.set("api_key",   apiKey);
  url.searchParams.set("date_from", dateRange.start);
  url.searchParams.set("date_to",   dateRange.end);
  url.searchParams.set("fields",    CAMPAIGN_FIELDS);
  if (facebookAccountId) {
    url.searchParams.set("select_accounts", `facebook__${facebookAccountId}`);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return { impressions: 0, spend: 0 };

  const json = await res.json();
  const allRows: WindsorRow[] = Array.isArray(json)
    ? json
    : json.data ?? json.rows ?? [];

  // No date field in CAMPAIGN_FIELDS — Windsor returns one aggregated row per campaign
  // for the full date_preset period. Filter only by account (select_accounts handles
  // this already, but keep account_name as a safety net).
  const rows = allRows.filter((r) =>
    !accountName || (r.account_name ?? "").toLowerCase() === accountName.toLowerCase()
  );

  if (rows.length === 0) return { impressions: 0, spend: 0 };

  // Sum all campaign rows — each row is one campaign's total for the period
  const totals: AdMetrics = { impressions: 0, spend: 0 };
  for (const row of rows) {
    if (!row.impressions && !row.spend) continue;
    const imp = n(row.impressions);
    totals.impressions += imp;
    totals.spend       += n(row.spend);
    addMetric(totals, "clicks",     getClicks(row));
    addMetric(totals, "videoViews", getVideoViews(row, imp));
    // reach is already deduplicated at campaign level — sum across campaigns
    addMetric(totals, "reach",      getReach(row));
  }

  if (totals.impressions > 0) {
    if ((totals.clicks ?? 0) > 0)     totals.ctr          = (totals.clicks ?? 0) / totals.impressions;
    if (totals.spend > 0)             totals.cpm          = (totals.spend / totals.impressions) * 1000;
    if ((totals.videoViews ?? 0) > 0) totals.videoViewRate = (totals.videoViews ?? 0) / totals.impressions;
  }
  if ((totals.clicks ?? 0) > 0)  totals.cpc       = totals.spend / (totals.clicks ?? 1);
  if ((totals.reach ?? 0) > 0)   totals.frequency = totals.impressions / (totals.reach ?? 1);

  return totals;
}

import type { AdData } from "@/types";

// Connect Windsor.ai TikTok data source here — same API pattern as meta.ts.
// Set the Windsor connector to "tiktok_ads" and map fields:
//   campaign_name → campaign, adgroup_name → adset, ad_name → ad
//   impressions, reach, video_views, video_view_rate, spend, cpm
// TikTok awareness KPIs: reach, video_views, VTR, CPM

export async function fetchAds(
  _accountId: string,
  _dateRange: { start: string; end: string },
  _apiKey: string
): Promise<AdData[]> {
  // TODO: implement TikTok Ads connector via Windsor.ai
  return [];
}

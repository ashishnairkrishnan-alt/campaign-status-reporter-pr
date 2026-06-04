import type { AdData } from "@/types";

// Connect Windsor.ai Google Ads data source here — same API pattern as meta.ts.
// Set the Windsor connector to "google_ads" and map fields:
//   campaign → campaign, ad_group → adset, ad → ad
//   impressions, clicks, spend, ctr, cpm, cpc (no reach/frequency for Google)
// Google awareness KPIs: impressions, clicks, CPM, CTR

export async function fetchAds(
  _accountId: string,
  _dateRange: { start: string; end: string },
  _apiKey: string
): Promise<AdData[]> {
  // TODO: implement Google Ads connector via Windsor.ai
  return [];
}

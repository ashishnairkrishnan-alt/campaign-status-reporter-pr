import type { Channel, AdData, AdMetrics } from "@/types";
import { fetchAds as fetchMetaAds, fetchCampaignTotals as fetchMetaCampaignTotals } from "./meta";
import { fetchAds as fetchGoogleAds } from "./google";
import { fetchAds as fetchTikTokAds } from "./tiktok";

export async function fetchCampaignTotalsByChannel(
  channel: Channel,
  accountIdentifier: string,
  dateRange: { start: string; end: string },
  apiKey: string,
  facebookAccountId?: string
): Promise<AdMetrics> {
  if (channel === "meta") return fetchMetaCampaignTotals(accountIdentifier, dateRange, apiKey, facebookAccountId);
  return { impressions: 0, spend: 0 };
}

// accountIdentifier = Windsor account_name for Meta (e.g. "ARE_Chivas_Internal")
export async function fetchAdsByChannel(
  channel: Channel,
  accountIdentifier: string,
  dateRange: { start: string; end: string },
  apiKey: string,
  facebookAccountId?: string
): Promise<AdData[]> {
  switch (channel) {
    case "meta":   return fetchMetaAds(accountIdentifier, dateRange, apiKey, facebookAccountId);
    case "google": return fetchGoogleAds(accountIdentifier, dateRange, apiKey);
    case "tiktok": return fetchTikTokAds(accountIdentifier, dateRange, apiKey);
    default:       return [];
  }
}

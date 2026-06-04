import type { Channel, AdData } from "@/types";
import { fetchAds as fetchMetaAds   } from "./meta";
import { fetchAds as fetchGoogleAds } from "./google";
import { fetchAds as fetchTikTokAds } from "./tiktok";

// accountIdentifier = Windsor account_name for Meta (e.g. "ARE_Chivas_Internal")
export async function fetchAdsByChannel(
  channel: Channel,
  accountIdentifier: string,
  dateRange: { start: string; end: string },
  apiKey: string
): Promise<AdData[]> {
  switch (channel) {
    case "meta":   return fetchMetaAds(accountIdentifier, dateRange, apiKey);
    case "google": return fetchGoogleAds(accountIdentifier, dateRange, apiKey);
    case "tiktok": return fetchTikTokAds(accountIdentifier, dateRange, apiKey);
    default:       return [];
  }
}

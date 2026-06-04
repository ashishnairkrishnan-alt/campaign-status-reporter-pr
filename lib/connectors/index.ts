import type { Channel } from "@/types";
import type { AdData } from "@/types";
import { fetchAds as fetchMetaAds } from "./meta";
import { fetchAds as fetchGoogleAds } from "./google";
import { fetchAds as fetchTikTokAds } from "./tiktok";

export async function fetchAdsByChannel(
  channel: Channel,
  accountId: string,
  dateRange: { start: string; end: string },
  apiKey: string
): Promise<AdData[]> {
  switch (channel) {
    case "meta":
      return fetchMetaAds(accountId, dateRange, apiKey);
    case "google":
      return fetchGoogleAds(accountId, dateRange, apiKey);
    case "tiktok":
      return fetchTikTokAds(accountId, dateRange, apiKey);
    default:
      return [];
  }
}

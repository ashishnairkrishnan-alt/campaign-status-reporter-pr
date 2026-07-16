import { NextRequest, NextResponse } from "next/server";
import { brands } from "@/config/brands";
import { fetchAdsByChannel, fetchCampaignTotalsByChannel } from "@/lib/connectors";
import { getMockData } from "@/lib/mockData";
import { groupByCampaign, aggregateMetrics } from "@/lib/metrics";
import type { DashboardData } from "@/types";
import { subDays, format } from "date-fns";

function getDateRange(preset: string): { start: string; end: string } {
  const today = new Date();
  const days  = preset === "7d" ? 7 : preset === "14d" ? 14 : 30;
  return {
    start: format(subDays(today, days), "yyyy-MM-dd"),
    end:   format(today, "yyyy-MM-dd"),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId   = searchParams.get("brand")     ?? "chivas";
  const datePreset = searchParams.get("dateRange") ?? "30d";

  const brand = brands.find((b) => b.id === brandId);
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const dateRange = getDateRange(datePreset);
  const apiKey    = process.env.WINDSOR_API_KEY ?? "";

  const activeAccounts = brand.accounts.filter((a) => a.active);
  const usingMock = !apiKey;

  // Fetch ad-level data (for creative gallery) and campaign-level totals (for KPI strip) in parallel
  const [adResults, campaignTotalsResults] = await (async () => {
    if (!apiKey) return [[], []];
    return Promise.all([
      Promise.allSettled(
        activeAccounts.map((a) => fetchAdsByChannel(a.channel, a.accountName, dateRange, apiKey))
      ),
      Promise.allSettled(
        activeAccounts.map((a) => fetchCampaignTotalsByChannel(a.channel, a.accountName, dateRange, apiKey))
      ),
    ]);
  })();

  let allAds = (adResults as PromiseSettledResult<Awaited<ReturnType<typeof fetchAdsByChannel>>>[])
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchAdsByChannel>>> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Fall back to mock data if Windsor returns nothing
  if (allAds.length === 0 || usingMock) {
    console.log(`[windsor] No real data for ${brandId} — using mock data`);
    allAds = getMockData(brandId);
  }

  // Use campaign-level totals for KPI strip if available (deduplicated reach/impressions)
  const campaignTotals = (campaignTotalsResults as PromiseSettledResult<Awaited<ReturnType<typeof fetchCampaignTotalsByChannel>>>[])
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchCampaignTotalsByChannel>>> => r.status === "fulfilled" && r.value.impressions > 0)
    .map((r) => r.value);

  const aggregateTotals = campaignTotals.length > 0
    ? campaignTotals.reduce((acc, t) => ({
        impressions:   acc.impressions   + t.impressions,
        spend:         acc.spend         + t.spend,
        clicks:        (acc.clicks  ?? 0) + (t.clicks  ?? 0) || undefined,
        videoViews:    (acc.videoViews ?? 0) + (t.videoViews ?? 0) || undefined,
        reach:         Math.max(acc.reach ?? 0, t.reach ?? 0) || undefined,
        ctr:           undefined, // recalculated below
        cpm:           undefined,
        cpc:           undefined,
        frequency:     undefined,
        videoViewRate: undefined,
      }), { impressions: 0, spend: 0 } as import("@/types").AdMetrics)
    : aggregateMetrics(allAds);

  // Recalculate derived metrics on the combined totals
  if (aggregateTotals.impressions > 0) {
    if ((aggregateTotals.clicks ?? 0) > 0)     aggregateTotals.ctr          = (aggregateTotals.clicks ?? 0) / aggregateTotals.impressions;
    if (aggregateTotals.spend > 0)             aggregateTotals.cpm          = (aggregateTotals.spend / aggregateTotals.impressions) * 1000;
    if ((aggregateTotals.videoViews ?? 0) > 0) aggregateTotals.videoViewRate = (aggregateTotals.videoViews ?? 0) / aggregateTotals.impressions;
  }
  if ((aggregateTotals.clicks ?? 0) > 0)  aggregateTotals.cpc       = aggregateTotals.spend / (aggregateTotals.clicks ?? 1);
  if ((aggregateTotals.reach  ?? 0) > 0)  aggregateTotals.frequency = aggregateTotals.impressions / (aggregateTotals.reach ?? 1);

  const data: DashboardData = {
    brand: brandId,
    dateRange,
    campaigns:       groupByCampaign(allAds),
    allAds,
    aggregateTotals,
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}

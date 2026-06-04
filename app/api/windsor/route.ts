import { NextRequest, NextResponse } from "next/server";
import { brands } from "@/config/brands";
import { fetchAdsByChannel } from "@/lib/connectors";
import { getMockData } from "@/lib/mockData";
import { groupByCampaign, aggregateMetrics } from "@/lib/metrics";
import type { DashboardData } from "@/types";
import { subDays, format } from "date-fns";

function getDateRange(preset: string): { start: string; end: string } {
  const today = new Date();
  const end = format(today, "yyyy-MM-dd");
  const days = preset === "7d" ? 7 : preset === "14d" ? 14 : 30;
  const start = format(subDays(today, days), "yyyy-MM-dd");
  return { start, end };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brand") ?? "chivas";
  const datePreset = searchParams.get("dateRange") ?? "30d";

  const brand = brands.find((b) => b.id === brandId);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const dateRange = getDateRange(datePreset);
  const apiKey = process.env.WINDSOR_API_KEY ?? "";

  let allAds = await (async () => {
    const results = await Promise.allSettled(
      brand.accounts
        .filter((a) => a.active && a.accountId !== "ACT_XXXXXXXXX")
        .map((account) =>
          fetchAdsByChannel(account.channel, account.accountId, dateRange, apiKey)
        )
    );

    return results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchAdsByChannel>>> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  })();

  // Fall back to mock data if Windsor returns nothing or accounts aren't configured
  if (allAds.length === 0) {
    allAds = getMockData(brandId);
  }

  const campaigns = groupByCampaign(allAds);
  const aggregateTotals = aggregateMetrics(allAds);

  const data: DashboardData = {
    brand: brandId,
    dateRange,
    campaigns,
    allAds,
    aggregateTotals,
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}

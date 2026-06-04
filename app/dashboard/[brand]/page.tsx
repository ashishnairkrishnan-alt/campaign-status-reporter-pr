"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import { BrandSwitcher } from "@/components/BrandSwitcher";
import { DateRangePicker } from "@/components/DateRangePicker";
import { KPIStrip } from "@/components/KPIStrip";
import { CreativeGallery } from "@/components/CreativeGallery";
import { AISummaryCard } from "@/components/AISummaryCard";
import { CampaignFilter, DEFAULT_FILTER, applyFilter } from "@/components/CampaignFilter";
import type { FilterState } from "@/components/CampaignFilter";
import { getBrand } from "@/config/brands";
import type { DashboardData, DateRangePreset, Targets } from "@/types";
import targetsJson from "@/config/targets.json";
import { aggregateMetrics } from "@/lib/metrics";

const targets = targetsJson as Targets;

function SkeletonKPI() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-border shadow-sm">
          <div className="skeleton h-2.5 w-16 rounded-full mb-3" />
          <div className="skeleton h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="aspect-video skeleton" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-3.5 w-3/4 rounded-full" />
            <div className="skeleton h-2.5 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function fetchDashboard(brand: string, dateRange: DateRangePreset): Promise<DashboardData> {
  const res = await fetch(`/api/windsor?brand=${brand}&dateRange=${dateRange}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export default function DashboardPage() {
  const params = useParams();
  const brandId = (params?.brand as string) ?? "chivas";
  const brand = getBrand(brandId);

  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", brandId, dateRange],
    queryFn: () => fetchDashboard(brandId, dateRange),
    staleTime: 5 * 60 * 1000,
  });

  // Reset filters when brand changes
  const brandColor = brand?.color ?? "#002957";
  const brandLabel = brand?.label ?? brandId;

  // Apply campaign/adset/ad filter
  const filteredAds = data ? applyFilter(data.allAds, filter) : [];
  const filteredTotals = aggregateMetrics(filteredAds);

  const dominantObjective = (() => {
    if (!filteredAds.length) return "awareness" as const;
    const counts = { awareness: 0, conversion: 0 };
    for (const ad of filteredAds) counts[ad.objective]++;
    return counts.conversion > counts.awareness ? "conversion" : "awareness";
  })();

  const dominantChannel = (() => {
    if (!filteredAds.length) return "meta" as const;
    const counts: Record<string, number> = {};
    for (const ad of filteredAds) counts[ad.channel] = (counts[ad.channel] ?? 0) + 1;
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "meta") as "meta" | "google" | "tiktok";
  })();

  const brandTargets = targets[brandId] ?? undefined;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-white border-r border-border">
        {/* Sidebar logo area */}
        <div
          className="flex items-center justify-center px-4 py-5 border-b-2"
          style={{ borderBottomColor: "#79ACD2" }}
        >
          <Image
            src="/pr-logo.svg"
            alt="Pernod Ricard"
            width={120}
            height={56}
            className="invert brightness-0"
            style={{ filter: "invert(14%) sepia(40%) saturate(700%) hue-rotate(190deg) brightness(30%) contrast(110%)" }}
          />
        </div>
        <div className="p-4 pt-5 flex-1">
          <BrandSwitcher />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* ── Top header: French Navy gradient ── */}
        <header
          className="flex items-center justify-between px-6 py-0 sticky top-0 z-30 border-b-[3px]"
          style={{
            background: "linear-gradient(90deg, #001530 0%, #002957 55%, #003870 100%)",
            borderBottomColor: "#79ACD2",
            minHeight: "64px",
          }}
        >
          {/* Left: logo + title */}
          <div className="flex items-center gap-4 py-3">
            {/* Mobile logo */}
            <div className="md:hidden">
              <Image src="/pr-logo.svg" alt="Pernod Ricard" width={80} height={37} />
            </div>

            <div className="hidden md:block h-8 w-px bg-white/20" />

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 leading-none mb-0.5">
                Pernod Ricard
              </p>
              <h1 className="font-display text-lg font-semibold text-white leading-tight tracking-wide">
                Paid Media Dashboard
              </h1>
            </div>
          </div>

          {/* Right: brand pill + date picker + refresh */}
          <div className="flex items-center gap-3">
            {/* Active brand pill */}
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${brandColor}20`,
                borderColor: `${brandColor}50`,
                color: brandColor === "#002957" ? "#79ACD2" : brandColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: brandColor === "#002957" ? "#79ACD2" : brandColor }}
              />
              {brandLabel}
            </span>

            <DateRangePicker value={dateRange} onChange={(v) => { setDateRange(v); setFilter(DEFAULT_FILTER); }} />

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Mobile brand switcher */}
        <div className="md:hidden px-4 py-3 border-b border-border bg-white overflow-x-auto">
          <div className="flex gap-2">
            {["chivas", "absolut", "jameson"].map((b) => {
              const br = getBrand(b);
              const isActive = b === brandId;
              return (
                <a
                  key={b}
                  href={`/dashboard/${b}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 border transition-all ${
                    isActive ? "text-white" : "text-muted border-border"
                  }`}
                  style={isActive ? { backgroundColor: br?.color, borderColor: br?.color } : {}}
                >
                  {br?.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* ── Filter bar ── */}
        {data && (
          <div className="px-6 py-4 bg-white border-b border-border">
            <CampaignFilter
              ads={data.allAds}
              filter={filter}
              onChange={setFilter}
            />
          </div>
        )}

        {/* Page body */}
        <div className="flex-1 p-6 space-y-7 page-enter">

          {/* AI Summary */}
          {data && (
            <AISummaryCard
              brand={brandLabel}
              dateRange={data.dateRange}
              totals={filteredTotals}
              topAds={filteredAds.slice(0, 5)}
            />
          )}

          {/* KPI Strip */}
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-widest text-subtle mb-4">
              Key Metrics
              {filteredAds.length !== (data?.allAds.length ?? 0) && (
                <span className="ml-2 normal-case text-blue font-normal tracking-normal">
                  — {filteredAds.length} ad{filteredAds.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </h2>
            {isLoading ? (
              <SkeletonKPI />
            ) : data ? (
              <KPIStrip
                metrics={filteredTotals}
                objective={dominantObjective}
                channel={dominantChannel}
                brandColor={brandColor}
                targets={brandTargets}
              />
            ) : null}
          </section>

          {/* Creative Gallery */}
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-widest text-subtle mb-4">
              Active Creatives
            </h2>
            {isLoading ? (
              <SkeletonGallery />
            ) : data ? (
              <CreativeGallery ads={filteredAds} />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

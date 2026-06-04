"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, BarChart2 } from "lucide-react";
import { BrandSwitcher } from "@/components/BrandSwitcher";
import { DateRangePicker } from "@/components/DateRangePicker";
import { KPIStrip } from "@/components/KPIStrip";
import { CreativeGallery } from "@/components/CreativeGallery";
import { AISummaryCard } from "@/components/AISummaryCard";
import { getBrand } from "@/config/brands";
import type { DashboardData, DateRangePreset, Targets } from "@/types";
import targetsJson from "@/config/targets.json";

const targets = targetsJson as Targets;

function SkeletonKPI() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface-2 rounded-xl p-5 border border-navy-700">
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
        <div
          key={i}
          className="bg-surface-2 border border-navy-700 rounded-xl overflow-hidden"
        >
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

async function fetchDashboard(
  brand: string,
  dateRange: DateRangePreset
): Promise<DashboardData> {
  const res = await fetch(`/api/windsor?brand=${brand}&dateRange=${dateRange}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export default function DashboardPage() {
  const params = useParams();
  const brandId = (params?.brand as string) ?? "chivas";
  const brand = getBrand(brandId);

  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", brandId, dateRange],
    queryFn: () => fetchDashboard(brandId, dateRange),
    staleTime: 5 * 60 * 1000,
  });

  const brandColor = brand?.color ?? "#C9A84C";
  const brandLabel = brand?.label ?? brandId;

  // Determine dominant objective (most ads)
  const dominantObjective = (() => {
    if (!data) return "awareness" as const;
    const counts = { awareness: 0, conversion: 0 };
    for (const ad of data.allAds) counts[ad.objective]++;
    return counts.conversion > counts.awareness ? "conversion" : "awareness";
  })();

  // Dominant channel (most ads)
  const dominantChannel = (() => {
    if (!data) return "meta" as const;
    const counts: Record<string, number> = {};
    for (const ad of data.allAds) counts[ad.channel] = (counts[ad.channel] ?? 0) + 1;
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "meta") as "meta" | "google" | "tiktok";
  })();

  const brandTargets = targets[brandId] ?? undefined;

  return (
    <div className="flex min-h-screen bg-navy-800">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-navy-900 border-r border-navy-700 p-4 pt-6">
        <div className="flex items-center gap-2 mb-8 px-3">
          <BarChart2 className="w-4 h-4 text-gold-500" />
          <span className="font-display text-sm font-semibold text-white">
            Performance
          </span>
        </div>
        <BrandSwitcher />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900/50 backdrop-blur-sm sticky top-0 z-30 gap-4 flex-wrap">
          <div>
            <h1
              className="font-display text-xl font-semibold"
              style={{ color: brandColor }}
            >
              {brandLabel}
            </h1>
            <p className="text-xs text-navy-400 mt-0.5">Paid Media Performance</p>
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg border border-navy-600 text-navy-400 hover:text-white hover:border-navy-500 transition-all disabled:opacity-40"
              title="Refresh data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* Mobile brand switcher */}
        <div className="md:hidden px-4 py-3 border-b border-navy-700 overflow-x-auto">
          <div className="flex gap-2">
            {["chivas", "absolut", "jameson"].map((b) => {
              const br = getBrand(b);
              const isActive = b === brandId;
              return (
                <a
                  key={b}
                  href={`/dashboard/${b}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
                    isActive
                      ? "text-white border"
                      : "text-navy-400 border border-navy-700"
                  }`}
                  style={
                    isActive
                      ? { borderColor: br?.color, color: br?.color }
                      : {}
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: br?.color }}
                  />
                  {br?.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Page body */}
        <div className="flex-1 p-6 space-y-7 page-enter">
          {/* AI Summary */}
          {data && (
            <AISummaryCard
              brand={brandLabel}
              dateRange={data.dateRange}
              totals={data.aggregateTotals}
              topAds={data.allAds.slice(0, 5)}
            />
          )}

          {/* KPI Strip */}
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-widest text-navy-400 mb-4">
              Key Metrics
            </h2>
            {isLoading ? (
              <SkeletonKPI />
            ) : data ? (
              <KPIStrip
                metrics={data.aggregateTotals}
                objective={dominantObjective}
                channel={dominantChannel}
                brandColor={brandColor}
                targets={brandTargets}
              />
            ) : null}
          </section>

          {/* Creative Gallery */}
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-widest text-navy-400 mb-4">
              Active Creatives
            </h2>
            {isLoading ? (
              <SkeletonGallery />
            ) : data ? (
              <CreativeGallery ads={data.allAds} />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

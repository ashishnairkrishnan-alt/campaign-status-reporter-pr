"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Clock } from "lucide-react";
import Image from "next/image";
import { BrandSwitcher } from "@/components/BrandSwitcher";
import { DateRangePicker } from "@/components/DateRangePicker";
import { KPIStrip } from "@/components/KPIStrip";
import { CreativeGallery } from "@/components/CreativeGallery";
import { AISummaryCard } from "@/components/AISummaryCard";
import { CampaignBanner } from "@/components/CampaignBanner";
import { CampaignFilter, DEFAULT_FILTER, applyFilter } from "@/components/CampaignFilter";
import type { FilterState } from "@/components/CampaignFilter";
import { getBrand, LAST_UPDATED } from "@/config/brands";
import type { DashboardData, DateRangePreset, Targets } from "@/types";
import targetsJson from "@/config/targets.json";
import { aggregateMetrics } from "@/lib/metrics";

const targets = targetsJson as Targets;
const ALL_FILTER = "__all__";
const DATE_RANGE_PRESETS: DateRangePreset[] = ["7d", "14d", "30d"];

function isDateRangePreset(value: string | null): value is DateRangePreset {
  return value !== null && DATE_RANGE_PRESETS.includes(value as DateRangePreset);
}

function readFilterFromParams(params: { get(name: string): string | null }): FilterState {
  return {
    campaign: params.get("campaign") || DEFAULT_FILTER.campaign,
    adset:    params.get("adset")    || DEFAULT_FILTER.adset,
    ad:       params.get("ad")       || DEFAULT_FILTER.ad,
  };
}

function readDateRangeFromParams(params: { get(name: string): string | null }): DateRangePreset {
  const value = params.get("dateRange");
  return isDateRangePreset(value) ? value : "30d";
}

function readCustomDatesFromParams(params: { get(name: string): string | null }): { dateFrom?: string; dateTo?: string } {
  const dateFrom = params.get("dateFrom");
  const dateTo   = params.get("dateTo");
  if (dateFrom && dateTo) return { dateFrom, dateTo };
  return {};
}

function readReportTitleFromParams(params: { get(name: string): string | null }): string {
  return params.get("title")?.trim() ?? "";
}

// Read admin display settings from localStorage
function useAdminSettings(brandId: string, defaults: { campaignLabel: string; currency: string; lastUpdated: string }) {
  const [settings, setSettings] = useState(defaults);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`admin_settings_${brandId}`);
      if (raw) setSettings(JSON.parse(raw));
      else setSettings(defaults);
    } catch { setSettings(defaults); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);
  return settings;
}

// Read admin pre-selected campaign/adset/date filter
function useAdminViewFilter(brandId: string) {
  type ViewFilter = { campaign: string; adset: string; dateRange?: string; dateFrom: string; dateTo: string };
  const [viewFilter, setViewFilter] = useState<ViewFilter | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`dashboard_view_${brandId}`);
      if (raw) {
        const f = JSON.parse(raw);
        if (f.campaign || f.adset || f.dateFrom || f.dateRange === "custom") setViewFilter(f);
      }
    } catch {}
  }, [brandId]);
  return viewFilter;
}

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

async function fetchDashboard(
  brand: string,
  dateRange: DateRangePreset,
  dateFrom?: string,
  dateTo?: string,
): Promise<DashboardData> {
  let url = `/api/windsor?brand=${brand}`;
  if (dateFrom && dateTo) {
    url += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
  } else {
    url += `&dateRange=${dateRange}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function DashboardPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [queryString, setQueryString] = useState("");
  const brandId = (params?.brand as string) ?? "chivas";
  const brand = getBrand(brandId);

  const [dateRange, setDateRangeState] = useState<DateRangePreset>("30d");
  const [filter, setFilterState] = useState<FilterState>(DEFAULT_FILTER);
  const [reportTitle, setReportTitle] = useState("");
  const [urlDates, setUrlDates] = useState<{ dateFrom?: string; dateTo?: string }>({});

  useEffect(() => {
    const syncFromLocation = () => setQueryString(window.location.search.replace(/^\?/, ""));
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [brandId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(queryString);
    setDateRangeState(readDateRangeFromParams(urlParams));
    setFilterState(readFilterFromParams(urlParams));
    setReportTitle(readReportTitleFromParams(urlParams));
    setUrlDates(readCustomDatesFromParams(urlParams));
  }, [brandId, queryString]);

  function updateUrl(nextDateRange: DateRangePreset, nextFilter: FilterState) {
    const nextParams = new URLSearchParams(queryString);

    if (nextDateRange === "30d") nextParams.delete("dateRange");
    else nextParams.set("dateRange", nextDateRange);

    (["campaign", "adset", "ad"] as const).forEach((key) => {
      if (!nextFilter[key] || nextFilter[key] === ALL_FILTER) nextParams.delete(key);
      else nextParams.set(key, nextFilter[key]);
    });

    if (reportTitle) nextParams.set("title", reportTitle);

    const nextQuery = nextParams.toString();
    setQueryString(nextQuery);
    router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`, { scroll: false });
  }

  function handleDateRangeChange(nextDateRange: DateRangePreset) {
    setDateRangeState(nextDateRange);
    setFilterState(DEFAULT_FILTER);
    updateUrl(nextDateRange, DEFAULT_FILTER);
  }

  function handleFilterChange(nextFilter: FilterState) {
    setFilterState(nextFilter);
    updateUrl(dateRange, nextFilter);
  }

  const adminSettings  = useAdminSettings(brandId, {
    campaignLabel: brand?.campaignLabel ?? "",
    currency:      brand?.currency ?? "$",
    lastUpdated:   LAST_UPDATED,
  });
  const adminViewFilter = useAdminViewFilter(brandId);

  // URL params (from shareable link) take priority, then admin settings
  const customDateFrom = urlDates.dateFrom
    ?? (adminViewFilter?.dateRange === "custom" ? adminViewFilter?.dateFrom : undefined);
  const customDateTo   = urlDates.dateTo
    ?? (adminViewFilter?.dateRange === "custom" ? adminViewFilter?.dateTo   : undefined);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", brandId, customDateFrom ?? dateRange, customDateTo ?? ""],
    queryFn:  () => fetchDashboard(brandId, dateRange, customDateFrom, customDateTo),
    staleTime: 5 * 60 * 1000,
  });

  const brandColor = brand?.color ?? "#002957";
  const brandLabel = brand?.label ?? brandId;

  // Apply admin pre-selection on top of user filter (only if non-empty strings)
  const baseAds = data ? (() => {
    let ads = data.allAds;
    const vc = adminViewFilter?.campaign?.trim();
    const va = adminViewFilter?.adset?.trim();
    if (vc) ads = ads.filter((a) => a.campaignName === vc);
    if (va) ads = ads.filter((a) => a.adsetName    === va);
    return ads;
  })() : [];

  const filteredAds    = applyFilter(baseAds, filter);
  const filteredTotals = aggregateMetrics(filteredAds);

  // Use campaign-level totals (accurate deduplicated reach/impressions) when no
  // filter is active. Fall back to filteredTotals when user drills into a subset.
  const hasUserFilter  = filter.campaign !== DEFAULT_FILTER.campaign ||
                         filter.adset    !== DEFAULT_FILTER.adset    ||
                         filter.ad       !== DEFAULT_FILTER.ad;
  const hasAdminFilter = !!adminViewFilter?.campaign?.trim() || !!adminViewFilter?.adset?.trim();
  const kpiMetrics     = (!hasUserFilter && !hasAdminFilter && data?.aggregateTotals)
    ? data.aggregateTotals
    : filteredTotals;

  const summaryTopAds  = [...filteredAds]
    .sort((a, b) => b.metrics.spend - a.metrics.spend)
    .slice(0, 5);

  const dominantObjective = (() => {
    if (!filteredAds.length) return "awareness" as const;
    const c = { awareness: 0, conversion: 0 };
    for (const ad of filteredAds) c[ad.objective]++;
    return c.conversion > c.awareness ? "conversion" : "awareness";
  })();

  const dominantChannel = (() => {
    if (!filteredAds.length) return "meta" as const;
    const c: Record<string, number> = {};
    for (const ad of filteredAds) c[ad.channel] = (c[ad.channel] ?? 0) + 1;
    return (Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "meta") as "meta" | "google" | "tiktok";
  })();

  const brandTargets = targets[brandId] ?? undefined;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 border-r"
        style={{ backgroundColor: "#ffffff", borderColor: "#dde4ee" }}>
        <div className="flex items-center justify-center px-4 py-5 border-b-2"
          style={{ borderBottomColor: "#79ACD2" }}>
          <Image src="/pr-logo.svg" alt="Pernod Ricard" width={120} height={56}
            style={{ filter: "invert(14%) sepia(40%) saturate(700%) hue-rotate(190deg) brightness(30%) contrast(110%)" }} />
        </div>
        <div className="p-4 pt-5 flex-1">
          <BrandSwitcher />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 sticky top-0 z-30 border-b-[3px] gap-4 flex-wrap"
          style={{
            background: "linear-gradient(90deg, #001530 0%, #002957 55%, #003870 100%)",
            borderBottomColor: "#79ACD2",
            minHeight: "64px",
          }}
        >
          <div className="flex items-center gap-4 py-3">
            <div className="md:hidden">
              <Image src="/pr-logo.svg" alt="Pernod Ricard" width={80} height={37} />
            </div>
            <div className="hidden md:block h-8 w-px" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] leading-none mb-0.5"
                style={{ color: "rgba(255,255,255,0.5)" }}>Pernod Ricard</p>
              <h1 className="font-display text-lg font-semibold text-white leading-tight tracking-wide">
                Paid Media Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
              style={{ borderColor: "rgba(121,172,210,0.4)", backgroundColor: "rgba(121,172,210,0.1)" }}>
              <Clock className="w-3 h-3" style={{ color: "#79ACD2" }} />
              <span className="text-[11px] font-medium" style={{ color: "#79ACD2" }}>
                Updated {adminSettings.lastUpdated}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${brandColor}20`,
                borderColor: `${brandColor}50`,
                color: brandColor === "#002957" ? "#79ACD2" : brandColor,
              }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: brandColor === "#002957" ? "#79ACD2" : brandColor }} />
              {brandLabel}
            </span>

            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />

            <button onClick={() => refetch()} disabled={isFetching}
              className="p-2 rounded-lg border text-white/60 hover:text-white transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
              title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Mobile brand tabs */}
        <div className="md:hidden px-4 py-3 border-b overflow-x-auto"
          style={{ backgroundColor: "#ffffff", borderColor: "#dde4ee" }}>
          <div className="flex gap-2">
            {["chivas", "absolut", "jameson"].map((b) => {
              const br = getBrand(b);
              const isActive = b === brandId;
              return (
                <a key={b} href={`/dashboard/${b}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 border transition-all"
                  style={isActive
                    ? { backgroundColor: br?.color, borderColor: br?.color, color: "#fff" }
                    : { borderColor: "#dde4ee", color: "#3a5470" }}>
                  {br?.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Filter bar */}
        {data && (
          <div className="px-6 py-4 border-b" style={{ backgroundColor: "#ffffff", borderColor: "#dde4ee" }}>
            <CampaignFilter ads={data.allAds} filter={filter} onChange={handleFilterChange} />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 p-6 space-y-6 page-enter">

          {/* ── Campaign Banner (read-only for stakeholders) ── */}
          {brand && (
            <CampaignBanner
              brandId={brandId}
              defaultLabel={reportTitle || adminSettings.campaignLabel || brand.campaignLabel}
              brandColor={brandColor}
              isAdmin={false}   // stakeholder view — no edit button
            />
          )}

          {/* AI Summary */}
          {data && (
            <AISummaryCard
              brand={brandLabel}
              dateRange={data.dateRange}
              totals={kpiMetrics}
              topAds={summaryTopAds}
            />
          )}

          {/* KPI Strip */}
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-widest mb-4"
              style={{ color: "#6b8aaa" }}>
              Key Metrics
              {filteredAds.length !== (data?.allAds.length ?? 0) && (
                <span className="ml-2 normal-case font-normal tracking-normal"
                  style={{ color: "#79ACD2" }}>
                  — {filteredAds.length} ad{filteredAds.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </h2>
            {isLoading ? <SkeletonKPI /> : data ? (
              <KPIStrip
                metrics={kpiMetrics}
                objective={dominantObjective}
                channel={dominantChannel}
                brandColor={brandColor}
                targets={brandTargets}
                currency={adminSettings.currency}
              />
            ) : null}
          </section>

          {/* Creative Gallery */}
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-widest mb-4"
              style={{ color: "#6b8aaa" }}>Active Creatives</h2>
            {isLoading ? <SkeletonGallery /> : data ? (
              <CreativeGallery ads={filteredAds} currency={adminSettings.currency} />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

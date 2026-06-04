"use client";

import { useMemo } from "react";
import type { AdData } from "@/types";

export interface FilterState {
  campaign: string;
  adset: string;
  ad: string;
}

interface CampaignFilterProps {
  ads: AdData[];
  filter: FilterState;
  onChange: (f: FilterState) => void;
}

const ALL = "__all__";

export function applyFilter(ads: AdData[], filter: FilterState): AdData[] {
  return ads.filter((ad) => {
    if (filter.campaign !== ALL && ad.campaignName !== filter.campaign) return false;
    if (filter.adset    !== ALL && ad.adsetName    !== filter.adset)    return false;
    if (filter.ad       !== ALL && ad.adName       !== filter.ad)       return false;
    return true;
  });
}

export function CampaignFilter({ ads, filter, onChange }: CampaignFilterProps) {
  const campaigns = useMemo(
    () => Array.from(new Set(ads.map((a) => a.campaignName))).sort(),
    [ads]
  );

  const adsets = useMemo(() => {
    const src = filter.campaign === ALL ? ads : ads.filter((a) => a.campaignName === filter.campaign);
    return Array.from(new Set(src.map((a) => a.adsetName))).sort();
  }, [ads, filter.campaign]);

  const adNames = useMemo(() => {
    const src = ads.filter((a) => {
      if (filter.campaign !== ALL && a.campaignName !== filter.campaign) return false;
      if (filter.adset    !== ALL && a.adsetName    !== filter.adset)    return false;
      return true;
    });
    return Array.from(new Set(src.map((a) => a.adName))).sort();
  }, [ads, filter.campaign, filter.adset]);

  function setCampaign(v: string) {
    onChange({ campaign: v, adset: ALL, ad: ALL });
  }
  function setAdset(v: string) {
    onChange({ ...filter, adset: v, ad: ALL });
  }
  function setAd(v: string) {
    onChange({ ...filter, ad: v });
  }

  const selectClass =
    "bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue hover:border-blue/60 transition-colors min-w-0 w-full";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Campaign */}
      <div className="flex flex-col gap-1 min-w-[200px] flex-1">
        <label className="text-[10px] font-medium uppercase tracking-widest text-subtle">
          Campaign
        </label>
        <select
          value={filter.campaign}
          onChange={(e) => setCampaign(e.target.value)}
          className={selectClass}
        >
          <option value={ALL}>All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Adset */}
      <div className="flex flex-col gap-1 min-w-[200px] flex-1">
        <label className="text-[10px] font-medium uppercase tracking-widest text-subtle">
          Ad Set
        </label>
        <select
          value={filter.adset}
          onChange={(e) => setAdset(e.target.value)}
          className={selectClass}
          disabled={adsets.length === 0}
        >
          <option value={ALL}>All Ad Sets</option>
          {adsets.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Ad */}
      <div className="flex flex-col gap-1 min-w-[180px] flex-1">
        <label className="text-[10px] font-medium uppercase tracking-widest text-subtle">
          Ad
        </label>
        <select
          value={filter.ad}
          onChange={(e) => setAd(e.target.value)}
          className={selectClass}
          disabled={adNames.length === 0}
        >
          <option value={ALL}>All Ads</option>
          {adNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {(filter.campaign !== ALL || filter.adset !== ALL || filter.ad !== ALL) && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-transparent select-none">Reset</label>
          <button
            onClick={() => onChange({ campaign: ALL, adset: ALL, ad: ALL })}
            className="px-3 py-2 text-xs text-blue border border-blue/30 rounded-lg hover:bg-blue/10 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export const DEFAULT_FILTER: FilterState = {
  campaign: "__all__",
  adset:    "__all__",
  ad:       "__all__",
};

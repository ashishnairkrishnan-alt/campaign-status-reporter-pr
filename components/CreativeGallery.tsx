"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Layers } from "lucide-react";
import type { AdData } from "@/types";
import { formatMetric } from "@/lib/metrics";
import { deduplicateByCreative, type DeduplicatedAd } from "@/lib/metrics";
import { getBadge } from "@/lib/badges";
import { ChannelIcon } from "./ChannelIcon";
import { AdDrawer } from "./AdDrawer";

const lightBadgeStyles: Record<string, string> = {
  scaling:           "bg-amber-50  text-amber-700  border border-amber-200",
  "on-target":       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  healthy:           "bg-sky-50    text-sky-700    border border-sky-200",
  refresh:           "bg-orange-50 text-orange-700 border border-orange-200",
  "creative-testing":"bg-violet-50 text-violet-700 border border-violet-200",
  premium:           "bg-rose-50   text-rose-700   border border-rose-200",
};

interface AdCardProps {
  ad: DeduplicatedAd;
  currency: string;
  onClick: () => void;
}

function AdCard({ ad, currency, onClick }: AdCardProps) {
  const badge    = getBadge(ad);
  const m        = ad.metrics;
  const hasVideo = m.videoViews !== undefined;
  const fm       = (v: number | undefined, t: string) => formatMetric(v, t, currency);

  const inlineMetrics = ad.objective === "awareness"
    ? [
        { label: "Reach", value: fm(m.reach, "reach") },
        { label: "Freq",  value: fm(m.frequency, "frequency") },
        { label: "CPM",   value: fm(m.cpm, "cpm") },
      ]
    : [
        { label: "CTR",  value: fm(m.ctr, "ctr") },
        { label: "CPC",  value: fm(m.cpc, "cpc") },
        { label: "ROAS", value: fm(m.roas, "roas") },
      ];

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-border rounded-xl overflow-hidden hover:border-blue/40 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 text-left w-full shadow-sm"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-surface relative">
        {ad.thumbnailUrl ? (
          <Image src={ad.thumbnailUrl} alt={ad.adName} fill className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {hasVideo ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center group-hover:bg-blue/20 transition-colors">
                  <Play className="w-4 h-4 text-blue ml-0.5" />
                </div>
                <span className="text-[10px] text-subtle">Video</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center">
                <span className="font-display text-xl text-subtle">{ad.adName.charAt(0)}</span>
              </div>
            )}
          </div>
        )}

        {/* Channel badge — top right */}
        <div className="absolute top-2 right-2"><ChannelIcon channel={ad.channel} /></div>

        {/* Status badge — bottom left */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${lightBadgeStyles[badge.variant]}`}>
            {badge.label}
          </span>
          {/* Ad set count badge */}
          {ad.adsetCount > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy-800/80 text-white backdrop-blur-sm">
              <Layers className="w-2.5 h-2.5" />
              {ad.adsetCount} ad sets
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Ad name — truncated nicely */}
        <p className="text-sm font-medium text-ink leading-snug mb-0.5 line-clamp-2" title={ad.adName}>
          {ad.adName}
        </p>
        {/* Campaign name in smaller text */}
        <p className="text-[11px] text-subtle truncate" title={ad.campaignName}>
          {ad.campaignName}
        </p>

        {/* Inline metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
          {inlineMetrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="text-[10px] text-subtle uppercase tracking-wide mb-0.5">{metric.label}</p>
              <p className="text-xs font-semibold tabular-nums text-ink">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

interface CreativeGalleryProps {
  ads: AdData[];
  currency?: string;
}

export function CreativeGallery({ ads, currency = "$" }: CreativeGalleryProps) {
  const [selectedAd, setSelectedAd] = useState<DeduplicatedAd | null>(null);

  // Deduplicate — one card per unique creative, metrics aggregated across ad sets
  const dedupedAds = deduplicateByCreative(ads);

  if (dedupedAds.length === 0) {
    return (
      <div className="text-center py-16 text-subtle text-sm bg-white border border-border rounded-xl">
        No creatives found for the selected filters.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {dedupedAds.map((ad) => (
          <AdCard key={ad.id} ad={ad} currency={currency} onClick={() => setSelectedAd(ad)} />
        ))}
      </div>
      <AdDrawer
        ad={selectedAd}
        currency={currency}
        onClose={() => setSelectedAd(null)}
      />
    </>
  );
}

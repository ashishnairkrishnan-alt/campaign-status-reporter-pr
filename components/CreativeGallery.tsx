"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { AdData } from "@/types";
import { formatMetric } from "@/lib/metrics";
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
  ad: AdData;
  currency: string;
  onClick: () => void;
}

function AdCard({ ad, currency, onClick }: AdCardProps) {
  const badge = getBadge(ad);
  const m = ad.metrics;
  const hasVideo = m.videoViews !== undefined;
  const fm = (v: number | undefined, t: string) => formatMetric(v, t, currency);

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
    <button onClick={onClick}
      className="group bg-white border border-border rounded-xl overflow-hidden hover:border-blue/40 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 text-left w-full shadow-sm">
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
        <div className="absolute top-2 right-2"><ChannelIcon channel={ad.channel} /></div>
        <div className="absolute bottom-2 left-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${lightBadgeStyles[badge.variant]}`}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm font-medium text-ink truncate leading-snug mb-0.5">{ad.adName}</p>
        <p className="text-[11px] text-subtle truncate">{ad.adsetName}</p>
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

export function CreativeGallery({ ads, currency = "£" }: CreativeGalleryProps) {
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);

  if (ads.length === 0) {
    return (
      <div className="text-center py-16 text-subtle text-sm bg-white border border-border rounded-xl">
        No creatives found for the selected filters.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} currency={currency} onClick={() => setSelectedAd(ad)} />
        ))}
      </div>
      <AdDrawer ad={selectedAd} currency={currency} onClose={() => setSelectedAd(null)} />
    </>
  );
}

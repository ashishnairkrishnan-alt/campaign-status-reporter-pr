"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { AdData } from "@/types";
import { formatMetric } from "@/lib/metrics";
import { getBadge, badgeStyles } from "@/lib/badges";
import { ChannelIcon } from "./ChannelIcon";
import { AdDrawer } from "./AdDrawer";

interface AdCardProps {
  ad: AdData;
  onClick: () => void;
}

function AdCard({ ad, onClick }: AdCardProps) {
  const badge = getBadge(ad);
  const m = ad.metrics;
  const hasVideo = m.videoViews !== undefined;

  // Pick 3 inline metrics based on objective
  const inlineMetrics =
    ad.objective === "awareness"
      ? [
          { label: "Reach", value: formatMetric(m.reach, "reach") },
          { label: "Freq", value: formatMetric(m.frequency, "frequency") },
          { label: "CPM", value: formatMetric(m.cpm, "cpm") },
        ]
      : [
          { label: "CTR", value: formatMetric(m.ctr, "ctr") },
          { label: "CPC", value: formatMetric(m.cpc, "cpc") },
          { label: "ROAS", value: formatMetric(m.roas, "roas") },
        ];

  return (
    <button
      onClick={onClick}
      className="group bg-surface-2 border border-navy-700 rounded-xl overflow-hidden hover:border-navy-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-950/60 transition-all duration-200 text-left w-full"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-navy-900 relative">
        {ad.thumbnailUrl ? (
          <Image
            src={ad.thumbnailUrl}
            alt={ad.adName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-navy-600">
            {hasVideo ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-navy-700/60 flex items-center justify-center group-hover:bg-navy-700 transition-colors">
                  <Play className="w-4 h-4 text-navy-400 ml-0.5" />
                </div>
                <span className="text-[10px] text-navy-500">Video</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border border-navy-700 flex items-center justify-center">
                <span className="font-display text-xl text-navy-600">
                  {ad.adName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Channel badge — top right */}
        <div className="absolute top-2 right-2">
          <ChannelIcon channel={ad.channel} />
        </div>

        {/* Status badge — bottom left */}
        <div className="absolute bottom-2 left-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${badgeStyles[badge.variant]}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="text-sm font-medium text-white truncate leading-snug mb-0.5">
          {ad.adName}
        </p>
        <p className="text-[11px] text-navy-400 truncate">{ad.adsetName}</p>

        {/* Inline metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-navy-700">
          {inlineMetrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="text-[10px] text-navy-500 uppercase tracking-wide mb-0.5">
                {metric.label}
              </p>
              <p className="text-xs font-semibold tabular-nums text-navy-200">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

interface CreativeGalleryProps {
  ads: AdData[];
}

export function CreativeGallery({ ads }: CreativeGalleryProps) {
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);

  if (ads.length === 0) {
    return (
      <div className="text-center py-16 text-navy-500 text-sm">
        No active creatives found for this period.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} onClick={() => setSelectedAd(ad)} />
        ))}
      </div>

      <AdDrawer ad={selectedAd} onClose={() => setSelectedAd(null)} />
    </>
  );
}

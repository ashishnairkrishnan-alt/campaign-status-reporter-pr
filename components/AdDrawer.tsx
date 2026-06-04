"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, RefreshCw, Play } from "lucide-react";
import Image from "next/image";
import type { AdData } from "@/types";
import { formatMetric } from "@/lib/metrics";
import { getBadge, badgeStyles } from "@/lib/badges";
import { ChannelIcon } from "./ChannelIcon";

interface AdDrawerProps {
  ad: AdData | null;
  onClose: () => void;
}

const ALL_METRICS: { key: keyof AdData["metrics"]; label: string }[] = [
  { key: "impressions", label: "Impressions" },
  { key: "reach", label: "Reach" },
  { key: "frequency", label: "Frequency" },
  { key: "spend", label: "Spend" },
  { key: "clicks", label: "Clicks" },
  { key: "ctr", label: "CTR" },
  { key: "cpm", label: "CPM" },
  { key: "cpc", label: "CPC" },
  { key: "videoViews", label: "Video Views" },
  { key: "videoViewRate", label: "Video View Rate" },
  { key: "roas", label: "ROAS" },
  { key: "costPerResult", label: "Cost per Result" },
];

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-navy-700 last:border-0">
      <span className="text-xs text-navy-400">{label}</span>
      <span className="text-sm font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

export function AdDrawer({ ad, onClose }: AdDrawerProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    setSuggestion(null);
  }, [ad]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function fetchSuggestion() {
    if (!ad) return;
    setLoadingSuggestion(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "",
          dateRange: ad.dateRange,
          totals: ad.metrics,
          topAds: [ad],
          adLevel: true,
          ad,
        }),
      });
      const data = await res.json();
      setSuggestion(data.summary ?? null);
    } catch {
      setSuggestion("Unable to generate suggestion at this time.");
    } finally {
      setLoadingSuggestion(false);
    }
  }

  if (!ad) return null;

  const badge = getBadge(ad);
  const hasVideo = ad.metrics.videoViews !== undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-navy-800 border-l border-navy-600 z-50 flex flex-col drawer-enter overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-navy-700 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <ChannelIcon channel={ad.channel} />
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeStyles[badge.variant]}`}
              >
                {badge.label}
              </span>
            </div>
            <h2 className="font-display text-base font-semibold text-white leading-snug truncate">
              {ad.adName}
            </h2>
            <p className="text-xs text-navy-400 mt-0.5 truncate">
              {ad.campaignName}
            </p>
            <p className="text-xs text-navy-500 truncate">{ad.adsetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-surface-3 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Creative preview */}
          <div className="aspect-video bg-navy-900 border-b border-navy-700 relative flex items-center justify-center">
            {ad.thumbnailUrl ? (
              <Image
                src={ad.thumbnailUrl}
                alt={ad.adName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-navy-500">
                {hasVideo ? (
                  <Play className="w-10 h-10" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-navy-600 flex items-center justify-center">
                    <span className="text-2xl font-display text-navy-600">
                      {ad.adName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs">
                  {hasVideo ? "Video creative" : "Static creative"}
                </span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="p-5">
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-navy-400 mb-3">
              Performance Metrics
            </h3>
            <div>
              {ALL_METRICS.filter(({ key }) => {
                const val = ad.metrics[key];
                return val !== undefined && val !== null && val !== 0;
              }).map(({ key, label }) => (
                <MetricRow
                  key={key}
                  label={label}
                  value={formatMetric(ad.metrics[key] as number, key)}
                />
              ))}
            </div>
          </div>

          {/* AI Creative Suggestion */}
          <div className="px-5 pb-6 border-t border-navy-700 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-medium uppercase tracking-widest text-navy-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gold-400" />
                AI Creative Suggestion
              </h3>
              {suggestion && (
                <button
                  onClick={fetchSuggestion}
                  className="text-[10px] text-gold-400 hover:text-gold-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Refresh
                </button>
              )}
            </div>

            {loadingSuggestion ? (
              <div className="space-y-2">
                {[100, 88, 76].map((w, i) => (
                  <div key={i} className="skeleton h-3 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : suggestion ? (
              <p className="text-sm text-navy-200 leading-relaxed">{suggestion}</p>
            ) : (
              <button
                onClick={fetchSuggestion}
                className="flex items-center gap-2 px-3 py-2 bg-gold-500/10 border border-gold-500/20 text-gold-400 rounded-lg text-xs hover:bg-gold-500/20 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Generate creative suggestion
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

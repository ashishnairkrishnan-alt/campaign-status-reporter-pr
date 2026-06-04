"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, RefreshCw, Play } from "lucide-react";
import Image from "next/image";
import type { AdData } from "@/types";
import { formatMetric } from "@/lib/metrics";
import { getBadge } from "@/lib/badges";
import { ChannelIcon } from "./ChannelIcon";

const lightBadgeStyles: Record<string, string> = {
  scaling:           "bg-amber-50  text-amber-700  border border-amber-200",
  "on-target":       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  healthy:           "bg-sky-50    text-sky-700    border border-sky-200",
  refresh:           "bg-orange-50 text-orange-700 border border-orange-200",
  "creative-testing":"bg-violet-50 text-violet-700 border border-violet-200",
  premium:           "bg-rose-50   text-rose-700   border border-rose-200",
};

interface AdDrawerProps {
  ad: AdData | null;
  currency?: string;
  onClose: () => void;
}

const ALL_METRICS: { key: keyof AdData["metrics"]; label: string }[] = [
  { key: "impressions",   label: "Impressions" },
  { key: "reach",         label: "Reach" },
  { key: "frequency",     label: "Frequency" },
  { key: "spend",         label: "Spend" },
  { key: "clicks",        label: "Clicks" },
  { key: "ctr",           label: "CTR" },
  { key: "cpm",           label: "CPM" },
  { key: "cpc",           label: "CPC" },
  { key: "videoViews",    label: "Video Views" },
  { key: "videoViewRate", label: "Video View Rate" },
  { key: "roas",          label: "ROAS" },
  { key: "costPerResult", label: "Cost per Result" },
];

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-subtle">{label}</span>
      <span className="text-sm font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}

export function AdDrawer({ ad, currency = "£", onClose }: AdDrawerProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => { setSuggestion(null); }, [ad]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function fetchSuggestion() {
    if (!ad) return;
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: "", dateRange: ad.dateRange, totals: ad.metrics, topAds: [ad], adLevel: true, ad }),
      });
      const data = await res.json();
      setSuggestion(data.summary ?? null);
    } catch {
      setSuggestion("Unable to generate suggestion at this time.");
    } finally {
      setLoading(false);
    }
  }

  if (!ad) return null;

  const badge    = getBadge(ad);
  const hasVideo = ad.metrics.videoViews !== undefined;
  const fm       = (v: number | undefined, t: string) => formatMetric(v, t, currency);

  return (
    <>
      <div className="fixed inset-0 bg-ink/30 z-40 backdrop-blur-sm" onClick={onClose} />

      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-border z-50 flex flex-col drawer-enter overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b-[3px] flex-shrink-0"
          style={{ borderBottomColor: "#79ACD2" }}>
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <ChannelIcon channel={ad.channel} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${lightBadgeStyles[badge.variant]}`}>
                {badge.label}
              </span>
            </div>
            <h2 className="font-display text-base font-semibold text-ink leading-snug truncate">{ad.adName}</h2>
            <p className="text-xs text-muted mt-0.5 truncate">{ad.campaignName}</p>
            <p className="text-xs text-subtle truncate">{ad.adsetName}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-subtle hover:text-ink hover:bg-surface transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Creative preview */}
          <div className="aspect-video bg-surface border-b border-border relative flex items-center justify-center">
            {ad.thumbnailUrl ? (
              <Image src={ad.thumbnailUrl} alt={ad.adName} fill className="object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-subtle">
                {hasVideo
                  ? <Play className="w-10 h-10 text-blue/40" />
                  : <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center">
                      <span className="text-2xl font-display text-subtle">{ad.adName.charAt(0)}</span>
                    </div>}
                <span className="text-xs">{hasVideo ? "Video creative" : "Static creative"}</span>
              </div>
            )}
          </div>

          {/* All metrics */}
          <div className="p-5">
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-subtle mb-3">Performance Metrics</h3>
            {ALL_METRICS.filter(({ key }) => {
              const v = ad.metrics[key];
              return v !== undefined && v !== null && v !== 0;
            }).map(({ key, label }) => (
              <MetricRow key={key} label={label} value={fm(ad.metrics[key] as number, key)} />
            ))}
          </div>

          {/* AI suggestion */}
          <div className="px-5 pb-6 border-t border-border pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-medium uppercase tracking-widest text-subtle flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue" />AI Creative Suggestion
              </h3>
              {suggestion && (
                <button onClick={fetchSuggestion}
                  className="text-[10px] text-blue hover:text-blue-dark flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" />Refresh
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[100, 88, 76].map((w, i) => (
                  <div key={i} className="skeleton h-3 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : suggestion ? (
              <p className="text-sm text-muted leading-relaxed">{suggestion}</p>
            ) : (
              <button onClick={fetchSuggestion}
                className="flex items-center gap-2 px-3 py-2 bg-blue/10 border border-blue/20 text-blue rounded-lg text-xs hover:bg-blue/20 transition-colors">
                <Sparkles className="w-3 h-3" />Generate creative suggestion
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

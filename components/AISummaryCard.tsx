"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Sparkles, Loader2 } from "lucide-react";
import type { AdData, AdMetrics } from "@/types";

interface AISummaryCardProps {
  brand: string;
  dateRange: { start: string; end: string };
  totals: AdMetrics;
  topAds: AdData[];
}

function SkeletonLines() {
  return (
    <div className="space-y-2.5 mt-3">
      {[100, 90, 95, 75].map((w, i) => (
        <div key={i} className="skeleton h-3.5 rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

export function AISummaryCard({ brand, dateRange, totals, topAds }: AISummaryCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [summary, setSummary]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Auto-generate on mount — no button needed
  useEffect(() => {
    if (!brand || totals.impressions === 0) return;
    setLoading(true);
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, dateRange, totals, topAds }),
    })
      .then((r) => r.json())
      .then((d) => setSummary(d.summary ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, dateRange.start, dateRange.end]);

  // Don't render if no API key configured
  if (!loading && summary === null && totals.impressions > 0) return null;
  if (totals.impressions === 0) return null;

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {loading ? (
            <Loader2 className="w-4 h-4 text-blue animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue" />
          )}
          <span className="font-display text-sm font-medium text-ink">
            {loading ? "Generating summary…" : "Performance Summary"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-subtle transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border">
          {loading ? (
            <SkeletonLines />
          ) : summary ? (
            <p className="text-sm text-muted leading-relaxed mt-3">{summary}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, RefreshCw } from "lucide-react";
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
        <div
          key={i}
          className="skeleton h-3.5 rounded-full"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function AISummaryCard({
  brand,
  dateRange,
  totals,
  topAds,
}: AISummaryCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  async function fetchSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, dateRange, totals, topAds }),
      });
      const data = await res.json();
      setSummary(data.summary ?? null);
      setHasFetched(true);
    } catch {
      setSummary("Unable to generate summary at this time.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on first expand
  function handleExpand() {
    setExpanded((v) => {
      if (!v && !hasFetched) {
        fetchSummary();
      }
      return !v;
    });
    if (!hasFetched && !expanded) {
      fetchSummary();
    }
  }

  return (
    <div className="bg-surface-2 border border-navy-600 rounded-xl overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-3 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span className="font-display text-sm font-medium text-white">
            AI Performance Summary
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-navy-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-navy-700">
          {loading ? (
            <SkeletonLines />
          ) : summary ? (
            <>
              <p className="text-sm text-navy-200 leading-relaxed mt-3">
                {summary}
              </p>
              <button
                onClick={fetchSummary}
                className="mt-4 flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Summary
              </button>
            </>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-navy-400 mb-3">
                Generate an AI-powered summary of this campaign&apos;s performance.
              </p>
              <button
                onClick={fetchSummary}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500/15 border border-gold-500/30 text-gold-400 rounded-lg text-sm hover:bg-gold-500/25 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Summary
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

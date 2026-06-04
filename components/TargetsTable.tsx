"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import type { Targets, TargetSet } from "@/types";

interface TargetsTableProps {
  initialTargets: Targets;
  brandIds: string[];
}

interface TargetField {
  key: string;
  label: string;
  placeholder: string;
  objective: "awareness" | "conversion";
}

const AWARENESS_FIELDS: TargetField[] = [
  { key: "reach", label: "Target Reach", placeholder: "500000", objective: "awareness" },
  { key: "frequency", label: "Max Frequency", placeholder: "3.0", objective: "awareness" },
  { key: "cpm", label: "Target CPM (£)", placeholder: "20", objective: "awareness" },
  { key: "vtr", label: "Target VTR", placeholder: "0.30", objective: "awareness" },
];

const CONVERSION_FIELDS: TargetField[] = [
  { key: "ctr", label: "Target CTR", placeholder: "0.02", objective: "conversion" },
  { key: "cpc", label: "Target CPC (£)", placeholder: "5", objective: "conversion" },
  { key: "cpl", label: "Target CPL (£)", placeholder: "80", objective: "conversion" },
  { key: "roas", label: "Target ROAS", placeholder: "3.0", objective: "conversion" },
];

function labelToBrand(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function TargetsTable({ initialTargets, brandIds }: TargetsTableProps) {
  const [targets, setTargets] = useState<Targets>(initialTargets);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateTarget(
    brand: string,
    objective: "awareness" | "conversion",
    key: string,
    raw: string
  ) {
    const value = parseFloat(raw) || 0;
    setTargets((prev) => ({
      ...prev,
      [brand]: {
        ...(prev[brand] ?? ({} as TargetSet)),
        [objective]: {
          ...(prev[brand]?.[objective] ?? {}),
          [key]: value,
        },
      },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/settings/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targets),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {brandIds.map((brandId) => (
        <div key={brandId} className="mb-8">
          <h3 className="font-display text-base font-semibold text-white mb-4">
            {labelToBrand(brandId)}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Awareness targets */}
            <div className="bg-surface-2 border border-navy-700 rounded-xl p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-gold-500/70 mb-4">
                Awareness
              </p>
              <div className="space-y-3">
                {AWARENESS_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-4">
                    <label className="text-xs text-navy-400 flex-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={
                        (targets[brandId]?.awareness as Record<string, number>)?.[field.key] ?? ""
                      }
                      onChange={(e) =>
                        updateTarget(brandId, "awareness", field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="w-28 bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-white text-right tabular-nums focus:border-gold-500 outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion targets */}
            <div className="bg-surface-2 border border-navy-700 rounded-xl p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-sky-500/70 mb-4">
                Conversion
              </p>
              <div className="space-y-3">
                {CONVERSION_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-4">
                    <label className="text-xs text-navy-400 flex-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={
                        (targets[brandId]?.conversion as Record<string, number>)?.[field.key] ?? ""
                      }
                      onChange={(e) =>
                        updateTarget(brandId, "conversion", field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="w-28 bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-white text-right tabular-nums focus:border-gold-500 outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end mt-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-gold-500/15 border border-gold-500/40 text-gold-400 hover:bg-gold-500/25 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {saved ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Targets Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save Targets"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}


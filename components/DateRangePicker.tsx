"use client";

import { Calendar } from "lucide-react";
import type { DateRangePreset } from "@/types";

const presets: { value: DateRangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
];

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 border border-navy-600 rounded-lg p-1">
      <Calendar className="w-3.5 h-3.5 text-navy-300 ml-1.5 flex-shrink-0" />
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
            value === preset.value
              ? "bg-gold-500/20 text-gold-400 border border-gold-500/40"
              : "text-navy-300 hover:text-white hover:bg-navy-700/50"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

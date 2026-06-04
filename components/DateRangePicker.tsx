"use client";

import { Calendar } from "lucide-react";
import type { DateRangePreset } from "@/types";

const presets: { value: DateRangePreset; label: string }[] = [
  { value: "7d",  label: "7d"  },
  { value: "14d", label: "14d" },
  { value: "30d", label: "30d" },
];

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg p-1">
      <Calendar className="w-3.5 h-3.5 text-white/50 ml-1 flex-shrink-0" />
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
            value === preset.value
              ? "bg-blue text-navy-800 font-semibold"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

"use client";

// CampaignBanner — shows the featured campaign title prominently at the top.
// Read-only for stakeholders.
// Admin edit: visit /admin/settings to change the label (saved in localStorage).
// For permanent changes, also update campaignLabel in /config/brands.ts.

import { useEffect, useRef, useState } from "react";
import { Pencil, Check, X } from "lucide-react";

interface CampaignBannerProps {
  brandId: string;
  defaultLabel: string;
  brandColor: string;
  isAdmin?: boolean;
}

const STORAGE_KEY = (brandId: string) => `campaign_label_${brandId}`;

export function CampaignBanner({
  brandId,
  defaultLabel,
  brandColor,
  isAdmin = false,
}: CampaignBannerProps) {
  const [label, setLabel]     = useState(defaultLabel);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(defaultLabel);
  const inputRef              = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(brandId));
    if (saved) { setLabel(saved); setDraft(saved); }
    else { setLabel(defaultLabel); setDraft(defaultLabel); }
  }, [brandId, defaultLabel]);

  function startEdit() {
    setDraft(label);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function save() {
    const trimmed = draft.trim() || defaultLabel;
    setLabel(trimmed);
    localStorage.setItem(STORAGE_KEY(brandId), trimmed);
    setEditing(false);
  }

  function cancel() {
    setDraft(label);
    setEditing(false);
  }

  return (
    <div
      className="rounded-xl px-6 py-5 border flex items-center justify-between gap-4"
      style={{
        background: `linear-gradient(135deg, ${brandColor}12 0%, ${brandColor}06 100%)`,
        borderColor: `${brandColor}30`,
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-medium uppercase tracking-widest mb-1"
          style={{ color: `${brandColor}90` }}
        >
          Active Campaign
        </p>

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            className="w-full font-display text-2xl font-semibold bg-transparent border-b-2 outline-none pb-0.5"
            style={{ color: brandColor, borderBottomColor: brandColor }}
          />
        ) : (
          <h2
            className="font-display text-2xl font-semibold leading-tight truncate"
            style={{ color: brandColor }}
          >
            {label}
          </h2>
        )}
      </div>

      {/* Admin edit controls */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button
                onClick={save}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                onClick={cancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-ink transition-colors"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-ink hover:border-blue/40 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

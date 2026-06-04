"use client";

import { useState } from "react";
import { Plus, Save, CheckCircle } from "lucide-react";
import type { Channel, Objective } from "@/types";

// Production extension note:
// Replace the POST /api/settings call with a Supabase client call:
//   import { createClient } from '@supabase/supabase-js'
//   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, ...)
//   await supabase.from('brand_accounts').upsert(rows)
// This gives you per-user auth, row-level security, and real-time updates.

export interface AccountRow {
  id: string;
  brandId: string;
  label: string;
  accountId: string;
  channel: Channel;
  objective: Objective;
  active: boolean;
}

interface SettingsTableProps {
  initialRows: AccountRow[];
}

const CHANNELS: Channel[] = ["meta", "google", "tiktok"];
const OBJECTIVES: Objective[] = ["awareness", "conversion"];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-gold-500" : "bg-navy-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transform transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function SettingsTable({ initialRows }: SettingsTableProps) {
  const [rows, setRows] = useState<AccountRow[]>(initialRows);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateRow(id: string, patch: Partial<AccountRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  function addRow() {
    const id = `new-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id,
        brandId: "new-brand",
        label: "New Brand",
        accountId: "",
        channel: "meta",
        objective: "awareness",
        active: true,
      },
    ]);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: rows }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-navy-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700 bg-navy-900/50">
              {["Brand Name", "Account ID", "Channel", "Objective", "Active"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-navy-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-navy-800 ${
                  i % 2 === 0 ? "bg-surface-2" : "bg-navy-900/30"
                } hover:bg-surface-3 transition-colors`}
              >
                <td className="px-4 py-3">
                  <input
                    value={row.label}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    className="bg-transparent text-white placeholder-navy-500 border-b border-transparent hover:border-navy-600 focus:border-gold-500 outline-none w-full py-0.5 transition-colors"
                    placeholder="Brand name"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.accountId}
                    onChange={(e) => updateRow(row.id, { accountId: e.target.value })}
                    className="bg-transparent text-navy-300 font-mono text-xs placeholder-navy-600 border-b border-transparent hover:border-navy-600 focus:border-gold-500 outline-none w-full py-0.5 transition-colors"
                    placeholder="ACT_XXXXXXXXX"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.channel}
                    onChange={(e) =>
                      updateRow(row.id, { channel: e.target.value as Channel })
                    }
                    className="bg-surface-3 border border-navy-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-gold-500 outline-none"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c === "meta" ? "Meta" : c === "google" ? "Google Ads" : "TikTok"}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.objective}
                    onChange={(e) =>
                      updateRow(row.id, { objective: e.target.value as Objective })
                    }
                    className="bg-surface-3 border border-navy-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-gold-500 outline-none capitalize"
                  >
                    {OBJECTIVES.map((o) => (
                      <option key={o} value={o} className="capitalize">
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    checked={row.active}
                    onChange={(v) => updateRow(row.id, { active: v })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 text-sm text-navy-300 hover:text-white border border-navy-600 hover:border-navy-500 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Account
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-gold-500/15 border border-gold-500/40 text-gold-400 hover:bg-gold-500/25 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {saved ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save Changes"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

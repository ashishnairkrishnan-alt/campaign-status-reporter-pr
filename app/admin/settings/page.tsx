"use client";

// ─── Admin Settings — /admin/settings ────────────────────────────────────────
// Share this URL only with your team. Stakeholders never see it.
// Settings here are saved to your browser's localStorage.
// Account IDs and permanent changes must be committed to /config/brands.ts.

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock, Save, CheckCircle, Info } from "lucide-react";
import { TargetsTable } from "@/components/TargetsTable";
import { brands, LAST_UPDATED } from "@/config/brands";
import targetsJson from "@/config/targets.json";
import type { Targets } from "@/types";

const targets = targetsJson as Targets;

// ─── Per-brand admin settings (stored in localStorage) ───────────────────────
interface BrandAdminSettings {
  campaignLabel: string;
  currency: string;
  lastUpdated: string;
}

function useBrandSettings(brandId: string, defaults: BrandAdminSettings) {
  const KEY = `admin_settings_${brandId}`;
  const [settings, setSettings] = useState<BrandAdminSettings>(defaults);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, [KEY]);

  function save(next: BrandAdminSettings) {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return { settings, save, saved };
}

function BrandSettingsCard({ brand }: { brand: typeof brands[number] }) {
  const { settings, save, saved } = useBrandSettings(brand.id, {
    campaignLabel: brand.campaignLabel,
    currency:      brand.currency ?? "$",
    lastUpdated:   LAST_UPDATED,
  });

  const [form, setForm] = useState(settings);

  // Sync after localStorage loads
  useEffect(() => { setForm(settings); }, [settings]);

  const inputClass =
    "w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-blue outline-none transition-colors";

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.color }} />
        <h3 className="font-display text-base font-semibold text-ink">{brand.label}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-subtle mb-1.5">Campaign title (shown at top of dashboard)</label>
          <input value={form.campaignLabel}
            onChange={(e) => setForm((f) => ({ ...f, campaignLabel: e.target.value }))}
            className={inputClass} placeholder="e.g. Chivas — Brand Awareness 2025" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-subtle mb-1.5">Currency symbol</label>
            <select value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className={inputClass}>
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="$">$ USD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-subtle mb-1.5">Last Updated date</label>
            <input value={form.lastUpdated}
              onChange={(e) => setForm((f) => ({ ...f, lastUpdated: e.target.value }))}
              className={inputClass} placeholder="4 June 2025" />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-surface border border-border">
          <Info className="w-3.5 h-3.5 text-subtle flex-shrink-0" />
          <p className="text-xs text-subtle">
            Account ID for this brand:{" "}
            <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-ink">
              {brand.accounts[0]?.accountId ?? "—"}
            </code>
            {" "}— to change, edit <code className="text-navy-500">/config/brands.ts</code> and redeploy.
          </p>
        </div>

        <button onClick={() => save(form)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ backgroundColor: brand.color }}>
          {saved
            ? <><CheckCircle className="w-3.5 h-3.5" /> Saved to browser</>
            : <><Save className="w-3.5 h-3.5" /> Save settings</>}
        </button>

        {saved && (
          <p className="text-[11px] text-subtle">
            ✓ Saved in your browser. Refresh the dashboard to see changes.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      <header
        className="flex items-center gap-4 px-6 sticky top-0 z-30 border-b-[3px]"
        style={{
          background: "linear-gradient(90deg, #001530 0%, #002957 55%, #003870 100%)",
          borderBottomColor: "#79ACD2",
          minHeight: "64px",
        }}
      >
        <Link href="/dashboard/chivas"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Image src="/pr-logo.svg" alt="Pernod Ricard" width={80} height={37} />
        <div className="h-6 w-px bg-white/20" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 leading-none mb-0.5">Admin</p>
          <h1 className="font-display text-lg font-semibold text-white leading-tight">Settings</h1>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-amber-400 font-medium">Admin only</span>
        </div>
      </header>

      <div className="p-6 max-w-4xl space-y-10 page-enter">

        {/* How it works */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink mb-3">How settings work</h2>
          <div className="space-y-2 text-sm text-muted">
            <p>✅ <strong>Campaign title, currency, Last Updated</strong> — saved in your browser. Changes show immediately when you refresh the dashboard.</p>
            <p>✅ <strong>KPI Targets</strong> — saved below, persist in your browser.</p>
            <p>⚙️ <strong>Account IDs</strong> — must be set in <code className="bg-surface px-1 py-0.5 rounded text-xs text-navy-500">/config/brands.ts</code> and redeployed. Ask your developer or edit the file directly on GitHub.</p>
          </div>
        </div>

        {/* Per-brand settings */}
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Brand Settings</h2>
          <div className="space-y-5">
            {brands.map((brand) => (
              <BrandSettingsCard key={brand.id} brand={brand} />
            ))}
          </div>
        </section>

        <div className="border-t border-border" />

        {/* KPI Targets */}
        <section>
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">KPI Targets</h2>
            <p className="text-sm text-muted">These are read from <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-navy-500">/config/targets.json</code>. Edit them here — note they write to the server file (works locally, read-only on Vercel). For Vercel, edit the file directly.</p>
          </div>
          <TargetsTable initialTargets={targets} brandIds={brands.map((b) => b.id)} />
        </section>
      </div>
    </div>
  );
}

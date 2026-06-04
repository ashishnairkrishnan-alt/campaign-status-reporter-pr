"use client";

// ─── Admin Settings — /admin/settings ────────────────────────────────────────
// Share this URL only with your team. Stakeholders never see it.
// Settings here are saved to your browser's localStorage.
// Account IDs and permanent changes must be committed to /config/brands.ts.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Lock, Save, CheckCircle, Info, LogOut } from "lucide-react";
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
              <option value="£">£ GBP</option>
              <option value="€">€ EUR</option>
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

// ─── Dashboard view pre-selection per brand ──────────────────────────────────
interface ViewFilter {
  campaign: string;
  adset: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTER: ViewFilter = { campaign: "", adset: "", dateFrom: "", dateTo: "" };
const VIEW_KEY = (brandId: string) => `dashboard_view_${brandId}`;

function DashboardViewCard({
  brandId, brandLabel, brandColor,
}: { brandId: string; brandLabel: string; brandColor: string }) {
  const [filter, setFilter] = useState<ViewFilter>(EMPTY_FILTER);
  const [saved, setSaved]   = useState(false);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [adsets, setAdsets]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEW_KEY(brandId));
      if (raw) setFilter(JSON.parse(raw));
    } catch {}
  }, [brandId]);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/windsor?brand=${brandId}&dateRange=30d`);
      const data = await res.json();
      const camps = [...new Set<string>((data.allAds ?? []).map((a: { campaignName: string }) => a.campaignName))].sort();
      setCampaigns(camps);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (filter.campaign) {
      // Update adsets when campaign changes
      fetch(`/api/windsor?brand=${brandId}&dateRange=30d`)
        .then((r) => r.json())
        .then((data) => {
          const ads = (data.allAds ?? []).filter((a: { campaignName: string }) => a.campaignName === filter.campaign);
          setAdsets([...new Set<string>(ads.map((a: { adsetName: string }) => a.adsetName))].sort());
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.campaign]);

  function save() {
    localStorage.setItem(VIEW_KEY(brandId), JSON.stringify(filter));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function clear() {
    setFilter(EMPTY_FILTER);
    localStorage.removeItem(VIEW_KEY(brandId));
  }

  const inputClass = "w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-blue outline-none transition-colors";

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brandColor }} />
          <h3 className="font-display text-base font-semibold text-ink">{brandLabel}</h3>
        </div>
        <button onClick={loadCampaigns} disabled={loading}
          className="text-xs text-blue hover:text-blue-dark transition-colors">
          {loading ? "Loading…" : "Load campaigns from Windsor"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Campaign */}
          <div>
            <label className="block text-xs text-subtle mb-1.5">Campaign (leave blank = show all)</label>
            {campaigns.length > 0 ? (
              <select value={filter.campaign} onChange={(e) => setFilter((f) => ({ ...f, campaign: e.target.value, adset: "" }))} className={inputClass}>
                <option value="">All campaigns</option>
                {campaigns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={filter.campaign} onChange={(e) => setFilter((f) => ({ ...f, campaign: e.target.value, adset: "" }))}
                placeholder="Paste campaign name or load from Windsor ↑" className={inputClass} />
            )}
          </div>

          {/* Adset */}
          <div>
            <label className="block text-xs text-subtle mb-1.5">Ad Set (leave blank = show all)</label>
            {adsets.length > 0 ? (
              <select value={filter.adset} onChange={(e) => setFilter((f) => ({ ...f, adset: e.target.value }))} className={inputClass}>
                <option value="">All ad sets</option>
                {adsets.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={filter.adset} onChange={(e) => setFilter((f) => ({ ...f, adset: e.target.value }))}
                placeholder="Paste ad set name or select campaign first" className={inputClass} />
            )}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-subtle mb-1.5">Date from</label>
            <input type="date" value={filter.dateFrom} onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1.5">Date to</label>
            <input type="date" value={filter.dateTo} onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ backgroundColor: brandColor }}>
            {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Apply to dashboard</>}
          </button>
          <button onClick={clear} className="text-xs text-subtle hover:text-ink transition-colors">Reset to all</button>
        </div>
      </div>
    </div>
  );
}

function WindsorTest() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function test() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/windsor-test");
      setResult(await res.json());
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-semibold text-ink">Windsor.ai Connection</h2>
        <button onClick={test} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
          style={{ backgroundColor: "#002957" }}>
          {loading ? "Testing…" : "Test Connection"}
        </button>
      </div>
      {result && (
        <div className="mt-3">
          {"error" in result ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ❌ {String(result.error)}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-medium">✅ Connected</span>
                <span className="text-subtle">— {String(result.rowCount)} rows returned</span>
              </div>
              {(result.accounts as string[])?.length > 0 && (
                <div>
                  <p className="text-xs text-subtle mb-1 uppercase tracking-wide font-medium">Accounts found in Windsor</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(result.accounts as string[]).map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-blue/10 text-blue text-xs font-mono">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {(result.sampleCampaigns as string[])?.length > 0 && (
                <div>
                  <p className="text-xs text-subtle mb-1 uppercase tracking-wide font-medium">Sample campaigns</p>
                  <ul className="text-xs text-muted space-y-0.5">
                    {(result.sampleCampaigns as string[]).map((c) => <li key={c}>• {c}</li>)}
                  </ul>
                </div>
              )}
              {result.rowCount === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ Windsor connected but returned 0 rows. Check that your Meta accounts are linked in the Windsor dashboard and the API key is correct in Vercel env vars.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

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
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10">
            <Lock className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-400 font-medium">Admin only</span>
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors text-xs">
            <LogOut className="w-3.5 h-3.5" />Sign out
          </button>
        </div>
      </header>

      <div className="p-6 max-w-4xl space-y-10 page-enter">

        {/* Windsor connection test */}
        <WindsorTest />

        {/* How it works */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink mb-3">How settings work</h2>
          <div className="space-y-2 text-sm text-muted">
            <p>✅ <strong>Campaign title, currency, Last Updated</strong> — saved in your browser. Changes show immediately when you refresh the dashboard.</p>
            <p>✅ <strong>KPI Targets</strong> — saved below, persist in your browser.</p>
            <p>⚙️ <strong>Account IDs</strong> — must be set in <code className="bg-surface px-1 py-0.5 rounded text-xs text-navy-500">/config/brands.ts</code> and redeployed. Ask your developer or edit the file directly on GitHub.</p>
          </div>
        </div>

        {/* Dashboard view — pre-select campaign/adset/dates for stakeholders */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">Dashboard View</h2>
            <p className="text-sm text-muted">Pre-select which campaign, ad set and date range stakeholders see by default. They can still change filters themselves.</p>
          </div>
          <div className="space-y-4">
            {brands.map((brand) => (
              <DashboardViewCard key={brand.id} brandId={brand.id} brandLabel={brand.label} brandColor={brand.color} />
            ))}
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Per-brand display settings */}
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Display Settings</h2>
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

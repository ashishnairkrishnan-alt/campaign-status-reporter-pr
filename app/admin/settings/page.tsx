// Admin-only settings page — share this URL only with your team
// Route: /admin/settings
// Stakeholders visiting /dashboard/* will never see this link

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock } from "lucide-react";
import { SettingsTable } from "@/components/SettingsTable";
import { TargetsTable } from "@/components/TargetsTable";
import { brands } from "@/config/brands";
import targetsJson from "@/config/targets.json";
import type { Targets } from "@/types";
import type { AccountRow } from "@/components/SettingsTable";

const targets = targetsJson as Targets;

const initialRows: AccountRow[] = brands.flatMap((brand) =>
  brand.accounts.map((account) => ({
    id: account.id,
    brandId: brand.id,
    label: brand.label,
    accountId: account.accountId,
    channel: account.channel,
    objective: account.objective ?? "awareness",
    active: account.active,
  }))
);

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Header */}
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
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 leading-none mb-0.5">
            Admin
          </p>
          <h1 className="font-display text-lg font-semibold text-white leading-tight">
            Settings
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-amber-400 font-medium">Admin only</span>
        </div>
      </header>

      <div className="p-6 max-w-4xl space-y-12 page-enter">
        {/* Last Updated instructions */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink mb-2">
            How to update "Last Updated" date
          </h2>
          <p className="text-sm text-muted mb-3">
            Edit the <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-navy-500">LAST_UPDATED</code> constant
            at the top of <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-navy-500">/config/brands.ts</code>,
            then redeploy. It appears in the dashboard header as &ldquo;Updated [date]&rdquo;.
          </p>
          <div className="bg-navy-900 rounded-lg px-4 py-3 font-mono text-xs text-emerald-400">
            export const LAST_UPDATED = &quot;4 June 2025&quot;;
          </div>
        </section>

        {/* Brand Accounts */}
        <section>
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">Brand Accounts</h2>
            <p className="text-sm text-muted">
              Configure Windsor.ai account IDs per brand. Changes here update the local config —
              in production on Vercel, edit <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-navy-500">/config/brands.ts</code> directly
              and redeploy (Vercel&apos;s filesystem is read-only at runtime).
            </p>
          </div>
          <SettingsTable initialRows={initialRows} />
        </section>

        <div className="border-t border-border" />

        {/* KPI Targets */}
        <section>
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">KPI Targets</h2>
            <p className="text-sm text-muted">
              Set performance benchmarks per brand and objective. These appear below each KPI tile on the dashboard.
            </p>
          </div>
          <TargetsTable initialTargets={targets} brandIds={brands.map((b) => b.id)} />
        </section>

        <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-display text-sm font-semibold text-navy-500 mb-3">How to add a new brand</h3>
          <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
            <li>Add the brand entry to <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-navy-500">/config/brands.ts</code> with its Meta account ID.</li>
            <li>Add KPI targets to <code className="bg-surface px-1.5 py-0.5 rounded text-xs text-navy-500">/config/targets.json</code>.</li>
            <li>Commit and push — the brand switcher, routing, and data pipeline all update automatically.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

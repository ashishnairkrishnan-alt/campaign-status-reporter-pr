"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { BrandSwitcher } from "@/components/BrandSwitcher";
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

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-white border-r border-border">
        <div className="flex items-center justify-center px-4 py-5 border-b-2" style={{ borderBottomColor: "#79ACD2" }}>
          <Image src="/pr-logo.svg" alt="Pernod Ricard" width={120} height={56}
            style={{ filter: "invert(14%) sepia(40%) saturate(700%) hue-rotate(190deg) brightness(30%) contrast(110%)" }} />
        </div>
        <div className="p-4 pt-5 flex-1">
          <BrandSwitcher />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
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
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 leading-none mb-0.5">
              Pernod Ricard
            </p>
            <h1 className="font-display text-lg font-semibold text-white leading-tight">Settings</h1>
          </div>
        </header>

        <div className="p-6 max-w-4xl space-y-12 page-enter">
          {/* Brand Accounts */}
          <section>
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Brand Accounts</h2>
              <p className="text-sm text-muted">
                Configure account IDs per brand and channel. In production, connect to Supabase for persistence across deployments.
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

          {/* How to add a brand */}
          <section className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-navy-500 mb-3">How to add a new brand</h3>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Add the brand to <code className="text-navy-500 bg-surface px-1.5 py-0.5 rounded text-xs">/config/brands.ts</code> with its account IDs.</li>
              <li>Add targets in <code className="text-navy-500 bg-surface px-1.5 py-0.5 rounded text-xs">/config/targets.json</code> or use the form above.</li>
              <li>Add the Windsor.ai account and link it to the correct connector (Meta / Google / TikTok).</li>
              <li>Deploy — the brand switcher and data layer derive from <code className="text-navy-500 bg-surface px-1.5 py-0.5 rounded text-xs">brands.ts</code> automatically.</li>
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}

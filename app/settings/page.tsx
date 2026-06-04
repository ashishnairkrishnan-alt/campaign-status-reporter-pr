"use client";

import Link from "next/link";
import { BarChart2, ArrowLeft } from "lucide-react";
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
    <div className="flex min-h-screen bg-navy-800">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-navy-900 border-r border-navy-700 p-4 pt-6">
        <div className="flex items-center gap-2 mb-8 px-3">
          <BarChart2 className="w-4 h-4 text-gold-500" />
          <span className="font-display text-sm font-semibold text-white">
            Performance
          </span>
        </div>
        <BrandSwitcher />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-navy-700 bg-navy-900/50 sticky top-0 z-30">
          <Link
            href="/dashboard/chivas"
            className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-surface-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold text-white">
              Settings
            </h1>
            <p className="text-xs text-navy-400 mt-0.5">
              Manage brand accounts, channels, and KPI targets
            </p>
          </div>
        </header>

        <div className="p-6 max-w-4xl space-y-12 page-enter">
          {/* Brand Accounts */}
          <section>
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold text-white mb-1">
                Brand Accounts
              </h2>
              <p className="text-sm text-navy-400">
                Configure account IDs for each brand and channel. Changes update
                the local config — in production, connect to a Supabase database
                for persistence across deployments.
              </p>
            </div>
            <SettingsTable initialRows={initialRows} />
          </section>

          {/* Divider */}
          <div className="border-t border-navy-700" />

          {/* KPI Targets */}
          <section>
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold text-white mb-1">
                KPI Targets
              </h2>
              <p className="text-sm text-navy-400">
                Set performance benchmarks per brand and objective. These appear
                below each KPI tile on the dashboard.
              </p>
            </div>
            <TargetsTable
              initialTargets={targets}
              brandIds={brands.map((b) => b.id)}
            />
          </section>

          {/* How to add a new brand */}
          <section className="bg-surface-2 border border-navy-700 rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-gold-400 mb-3">
              How to add a new brand
            </h3>
            <ol className="text-sm text-navy-300 space-y-2 list-decimal list-inside">
              <li>
                Add the brand entry to{" "}
                <code className="text-gold-400/80 bg-navy-900 px-1.5 py-0.5 rounded text-xs">
                  /config/brands.ts
                </code>{" "}
                with its account IDs.
              </li>
              <li>
                Add target values in{" "}
                <code className="text-gold-400/80 bg-navy-900 px-1.5 py-0.5 rounded text-xs">
                  /config/targets.json
                </code>{" "}
                (or use the form above).
              </li>
              <li>
                If using Windsor.ai, add the new account to the Windsor
                dashboard and link it to the correct connector (Meta / Google /
                TikTok).
              </li>
              <li>
                Deploy — the brand switcher, routing, and data layer all derive
                from{" "}
                <code className="text-gold-400/80 bg-navy-900 px-1.5 py-0.5 rounded text-xs">
                  brands.ts
                </code>{" "}
                automatically.
              </li>
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}

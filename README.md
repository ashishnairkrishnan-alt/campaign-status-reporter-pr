# Campaign Performance Dashboard

Stakeholder-facing paid media dashboard for Pernod Ricard brands — Chivas, Absolut, and Jameson.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query, and Claude AI.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard/chivas`.

---

## Environment Variables

Create `.env.local` in the project root:

```env
WINDSOR_API_KEY=your_windsor_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

| Variable | Description |
|---|---|
| `WINDSOR_API_KEY` | Windsor.ai API key — found in your Windsor dashboard |
| `ANTHROPIC_API_KEY` | Anthropic API key — from console.anthropic.com. Powers the AI summary card and creative suggestions. |

If `ANTHROPIC_API_KEY` is not set, the AI summary card shows an error message — everything else works.

---

## Adding a New Brand Account

1. **Open `/config/brands.ts`** and add a new entry:

```ts
{
  id: "hendricks",
  label: "Hendrick's Gin",
  color: "#4A235A",
  accounts: [
    {
      id: "hendricks-meta",
      label: "Hendrick's Meta",
      accountId: "ACT_YOUR_ACCOUNT_ID",
      channel: "meta",
      color: "#4A235A",
      active: true,
      objective: "awareness",
    },
  ],
},
```

2. **Add targets in `/config/targets.json`**:

```json
"hendricks": {
  "awareness": { "reach": 400000, "frequency": 3.0, "cpm": 18, "vtr": 0.30 },
  "conversion": { "ctr": 0.02, "cpc": 4.5, "cpl": 75, "roas": 3.2 }
}
```

3. **Add mock fallback data in `/lib/mockData.ts`** (optional but recommended for demos with unconfigured accounts).

4. **Deploy** — the brand switcher, routing, and data pipeline all derive from `brands.ts` automatically.

---

## Adding a New Channel

1. Implement the connector in `/lib/connectors/your-channel.ts` — export a `fetchAds(accountId, dateRange, apiKey)` function that returns `AdData[]`.
2. Add the channel to the `Channel` type in `/types/index.ts`.
3. Register it in `/lib/connectors/index.ts`.
4. Add KPI strip logic in `/components/KPIStrip.tsx` under the awareness/conversion blocks.

---

## Architecture

```
/app
  /api/windsor/route.ts       → Windsor.ai data layer (fetches + normalises ads)
  /api/summarize/route.ts     → Claude AI summary and creative suggestion endpoint
  /api/settings/route.ts      → Brand accounts config persistence
  /api/settings/targets/      → KPI targets persistence
  /dashboard/[brand]/page.tsx → Main dashboard per brand
  /settings/page.tsx          → Settings UI

/config
  brands.ts                   → Brand + account ID mapping (source of truth)
  targets.json                → KPI targets per brand per objective

/lib
  connectors/
    meta.ts                   → Windsor.ai → normalised AdData (Meta)
    google.ts                 → Scaffold (connect Windsor Google Ads connector here)
    tiktok.ts                 → Scaffold (connect Windsor TikTok connector here)
  badges.ts                   → Badge logic and status colour helpers
  metrics.ts                  → Aggregation, grouping, and number formatting
  mockData.ts                 → Realistic fallback data for demo / empty accounts

/components
  BrandSwitcher.tsx           → Left-sidebar brand navigation
  KPIStrip.tsx                → 4-tile KPI row, objective + channel aware, with targets
  CreativeGallery.tsx         → Ad card grid with click-to-open drawer
  AdDrawer.tsx                → Right-side panel with full metrics + AI suggestion
  AISummaryCard.tsx           → Collapsible AI summary card
  DateRangePicker.tsx         → 7d / 14d / 30d preset selector
  SettingsTable.tsx           → Brand account CRUD table
  TargetsTable.tsx            → KPI target editor per brand
  ChannelIcon.tsx             → Meta / Google / TikTok icon badge

/types/index.ts               → Shared TypeScript types
/providers/QueryProvider.tsx  → React Query client setup
```

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set `WINDSOR_API_KEY` and `ANTHROPIC_API_KEY` as environment variables in Vercel project settings.
4. Deploy.

> **Note on settings persistence:** The settings page writes to `/config/targets.json` and `/config/brands.ts` locally. On Vercel, the filesystem is read-only after deployment. For production persistence, migrate the `/api/settings` routes to Supabase — see the inline comments in those files.

---

## Design System

- **Background:** `#0D1B2A` (navy-800)
- **Accent gold:** `#C9A84C` (gold-500)
- **Fonts:** Playfair Display (headings) / DM Sans (body)
- **Surface levels:** `#111827` → `#1A2535` → `#243040`
- **Badge colours:** gold (scaling), emerald (on-target), sky (healthy), amber (refresh due), violet (creative testing)

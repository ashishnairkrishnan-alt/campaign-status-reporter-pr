export type Channel = "meta" | "google" | "tiktok";
export type Objective = "awareness" | "conversion";

export interface BrandAccount {
  id: string;
  label: string;
  accountId: string;       // Meta account ID (numeric)
  channel: Channel;
  color: string;
  active: boolean;
  objective?: Objective;
}

export interface Brand {
  id: string;
  label: string;
  color: string;
  currency: string;        // e.g. "£" | "$" | "€"
  campaignLabel: string;   // Featured campaign title shown at top of dashboard
  accounts: BrandAccount[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LAST_UPDATED — edit this to change the "Updated" badge in the header.
// Format: "D MMMM YYYY"  e.g. "4 June 2025"
// ─────────────────────────────────────────────────────────────────────────────
export const LAST_UPDATED = "4 June 2025";

export const brands: Brand[] = [
  {
    id: "chivas",
    label: "Chivas",
    color: "#C9A84C",
    currency: "£",
    campaignLabel: "Chivas — Brand Awareness 2025",
    accounts: [
      {
        id: "chivas-meta",
        label: "Chivas Meta",
        accountId: "687576933271645",
        channel: "meta",
        color: "#C9A84C",
        active: true,
        objective: "awareness",
      },
    ],
  },
  {
    id: "absolut",
    label: "Absolut",
    color: "#1A5276",
    currency: "£",
    campaignLabel: "Absolut — Always On 2025",
    accounts: [
      {
        id: "absolut-meta",
        label: "Absolut Meta",
        accountId: "ACT_XXXXXXXXX",
        channel: "meta",
        color: "#1A5276",
        active: true,
        objective: "awareness",
      },
    ],
  },
  {
    id: "jameson",
    label: "Jameson",
    color: "#2E7D32",
    currency: "£",
    campaignLabel: "Jameson — Always On 2025",
    accounts: [
      {
        id: "jameson-meta",
        label: "Jameson Meta",
        accountId: "ACT_XXXXXXXXX",
        channel: "meta",
        color: "#2E7D32",
        active: true,
        objective: "conversion",
      },
    ],
  },
];

export function getBrand(id: string): Brand | undefined {
  return brands.find((b) => b.id === id);
}

export function detectObjective(campaignName: string): Objective {
  const upper = campaignName.toUpperCase();
  if (
    upper.includes("AWA") ||
    upper.includes("REACH") ||
    upper.includes("BRAND") ||
    upper.includes("AWARENESS") ||
    upper.includes("VIEWS")
  ) return "awareness";
  if (
    upper.includes("CONV") ||
    upper.includes("LEAD") ||
    upper.includes("PURCHASE") ||
    upper.includes("SALE") ||
    upper.includes("RETARG")
  ) return "conversion";
  return "awareness";
}

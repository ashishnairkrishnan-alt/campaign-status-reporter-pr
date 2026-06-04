export type Channel = "meta" | "google" | "tiktok";
export type Objective = "awareness" | "conversion";

export interface BrandAccount {
  id: string;
  label: string;
  accountId: string;
  channel: Channel;
  color: string;
  active: boolean;
  objective?: Objective;
}

export interface Brand {
  id: string;
  label: string;
  color: string;
  accounts: BrandAccount[];
}

export const brands: Brand[] = [
  {
    id: "chivas",
    label: "Chivas",
    color: "#C9A84C",
    accounts: [
      {
        id: "chivas-meta",
        label: "Chivas Meta",
        accountId: "ACT_XXXXXXXXX",
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

/** Detect objective from campaign name keywords if not set on account */
export function detectObjective(campaignName: string): Objective {
  const upper = campaignName.toUpperCase();
  if (
    upper.includes("AWA") ||
    upper.includes("REACH") ||
    upper.includes("BRAND") ||
    upper.includes("AWARENESS") ||
    upper.includes("VIEWS")
  ) {
    return "awareness";
  }
  if (
    upper.includes("CONV") ||
    upper.includes("LEAD") ||
    upper.includes("PURCHASE") ||
    upper.includes("SALE") ||
    upper.includes("RETARG")
  ) {
    return "conversion";
  }
  return "awareness";
}

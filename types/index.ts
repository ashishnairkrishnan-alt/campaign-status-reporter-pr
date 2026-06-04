import type { Channel, Objective } from "@/config/brands";

export type { Channel, Objective };

export interface AdMetrics {
  impressions: number;
  reach?: number;
  frequency?: number;
  spend: number;
  clicks?: number;
  ctr?: number;
  cpm?: number;
  cpc?: number;
  videoViews?: number;
  videoViewRate?: number;
  roas?: number;
  costPerResult?: number;
}

export interface AdData {
  id: string;
  campaignName: string;
  adsetName: string;
  adName: string;
  channel: Channel;
  objective: Objective;
  metrics: AdMetrics;
  thumbnailUrl?: string;
  videoUrl?: string;
  dateRange: { start: string; end: string };
}

export interface CampaignGroup {
  campaignName: string;
  objective: Objective;
  adsets: AdsetGroup[];
  totals: AdMetrics;
}

export interface AdsetGroup {
  adsetName: string;
  ads: AdData[];
  totals: AdMetrics;
}

export interface DashboardData {
  brand: string;
  dateRange: { start: string; end: string };
  campaigns: CampaignGroup[];
  allAds: AdData[];
  aggregateTotals: AdMetrics;
}

export type DateRangePreset = "7d" | "14d" | "30d";

export interface DateRange {
  preset: DateRangePreset;
  start: string;
  end: string;
  label: string;
}

export type BadgeVariant =
  | "scaling"
  | "on-target"
  | "healthy"
  | "refresh"
  | "creative-testing"
  | "premium";

export interface BadgeConfig {
  label: string;
  variant: BadgeVariant;
}

export interface TargetSet {
  awareness: {
    reach: number;
    frequency: number;
    cpm: number;
    vtr: number;
  };
  conversion: {
    ctr: number;
    cpc: number;
    cpl: number;
    roas: number;
  };
}

export interface Targets {
  [brand: string]: TargetSet;
}

export type TargetStatus = "above" | "near" | "below";

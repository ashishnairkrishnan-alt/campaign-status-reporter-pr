import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { formatMetric } from "@/lib/metrics";
import type { AdData, AdMetrics } from "@/types";

const SYSTEM_PROMPT =
  "You are a senior media strategist writing a concise performance summary for a brand stakeholder at a premium spirits company. Write in confident, professional agency language. Frame everything positively — highlight achievements, frame optimisations as proactive decisions, and end with a clear forward-looking action. Never use words like 'poor', 'failing', 'problem', 'issue', 'low', 'drop', or 'concern'. Maximum 4 sentences. Return plain text only.";

interface SummarizeRequest {
  brand: string;
  dateRange: { start: string; end: string };
  totals: AdMetrics;
  topAds: AdData[];
  adLevel?: boolean;
  ad?: AdData;
}

function buildPrompt(req: SummarizeRequest): string {
  if (req.adLevel && req.ad) {
    const ad = req.ad;
    const m = ad.metrics;
    return `Creative: "${ad.adName}" | Campaign: ${ad.campaignName} | Channel: ${ad.channel.toUpperCase()}
Metrics: Impressions ${formatMetric(m.impressions, "impressions")}, Reach ${formatMetric(m.reach, "reach")}, Frequency ${formatMetric(m.frequency, "frequency")}, Spend ${formatMetric(m.spend, "spend")}, CTR ${formatMetric(m.ctr, "ctr")}, CPM ${formatMetric(m.cpm, "cpm")}${m.videoViewRate ? `, VTR ${formatMetric(m.videoViewRate, "videoViewRate")}` : ""}${m.roas ? `, ROAS ${formatMetric(m.roas, "roas")}` : ""}

Write a single forward-looking creative recommendation for this ad — one paragraph, agency tone, focused on what to do next to improve or scale performance. Start with "Consider".`;
  }

  const t = req.totals;
  const topAdsList = req.topAds
    .slice(0, 5)
    .map(
      (ad, i) =>
        `${i + 1}. "${ad.adName}" — Impressions: ${formatMetric(ad.metrics.impressions, "impressions")}, Spend: ${formatMetric(ad.metrics.spend, "spend")}${ad.metrics.ctr ? `, CTR: ${formatMetric(ad.metrics.ctr, "ctr")}` : ""}${ad.metrics.reach ? `, Reach: ${formatMetric(ad.metrics.reach, "reach")}` : ""}`
    )
    .join("\n");

  return `Brand: ${req.brand} | Period: ${req.dateRange.start} to ${req.dateRange.end}

Overall performance:
- Total Impressions: ${formatMetric(t.impressions, "impressions")}
- Total Reach: ${formatMetric(t.reach, "reach")}
- Total Spend: ${formatMetric(t.spend, "spend")}
- Average Frequency: ${formatMetric(t.frequency, "frequency")}
- Average CPM: ${formatMetric(t.cpm, "cpm")}
- CTR: ${formatMetric(t.ctr, "ctr")}
${t.videoViewRate ? `- Video View Rate: ${formatMetric(t.videoViewRate, "videoViewRate")}` : ""}
${t.roas ? `- ROAS: ${formatMetric(t.roas, "roas")}` : ""}

Top 5 active ads:
${topAdsList}

Write a 4-sentence stakeholder summary of this campaign performance.`;
}

export async function POST(request: NextRequest) {
  const body: SummarizeRequest = await request.json();

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(body) }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ summary: text });
}

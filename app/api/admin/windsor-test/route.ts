import { NextResponse } from "next/server";

const VIDEO_FIELDS = [
  "video_views",
  "video_view_rate",
  "video_3_sec_watched_actions",
  "three_second_video_views",
  "video_p25_watched_actions",
];

// Debug endpoint — checks what Windsor.ai returns for your API key
export async function GET() {
  const apiKey = process.env.WINDSOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: "WINDSOR_API_KEY is not set in Vercel environment variables. Add it in Vercel → Settings → Environment Variables.",
    }, { status: 503 });
  }

  try {
    const fields = [
      "date", "account_name", "campaign",
      "spend", "impressions", "clicks", "reach",
      ...VIDEO_FIELDS,
    ].join(",");

    const url = new URL("https://connectors.windsor.ai/all");
    url.searchParams.set("api_key",     apiKey);
    url.searchParams.set("date_preset", "last_30d");
    url.searchParams.set("fields",      fields);

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({
        error: `Windsor returned HTTP ${res.status} ${res.statusText}`,
        hint: res.status === 401 ? "API key is invalid or expired" : body,
      }, { status: res.status });
    }

    const raw = await res.json();
    const rows: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : (raw as Record<string, unknown[]>).data ?? (raw as Record<string, unknown[]>).rows ?? [];

    const accounts  = [...new Set(rows.map((r) => r.account_name ?? "—"))].filter(Boolean);
    const campaigns = [...new Set(rows.map((r) => r.campaign))].filter(Boolean).slice(0, 8);
    const dates     = [...new Set(rows.map((r) => r.date as string))].sort().slice(-5);

    // Check which video fields Windsor actually returned with non-zero values
    const videoFieldPresence: Record<string, { present: boolean; sampleValue: unknown }> = {};
    for (const field of VIDEO_FIELDS) {
      const values = rows.map((r) => r[field]).filter((v) => v !== undefined && v !== null && v !== "" && v !== 0 && v !== "0");
      videoFieldPresence[field] = {
        present: values.length > 0,
        sampleValue: values[0] ?? null,
      };
    }

    return NextResponse.json({
      status: "ok",
      rowCount: rows.length,
      accounts,
      sampleCampaigns: campaigns,
      mostRecentDates: dates,
      videoFields: videoFieldPresence,
      firstRow: rows[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

// Debug endpoint — checks what Windsor.ai returns for your API key
export async function GET() {
  const apiKey = process.env.WINDSOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: "WINDSOR_API_KEY is not set in Vercel environment variables. Add it in Vercel → Settings → Environment Variables.",
    }, { status: 503 });
  }

  try {
    const url = new URL("https://connectors.windsor.ai/all");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("date_preset", "last_180d"); // wide window to catch all data
    url.searchParams.set("fields", "date,account_name,campaign,spend,impressions,clicks");

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({
        error: `Windsor returned HTTP ${res.status} ${res.statusText}`,
        hint: res.status === 401 ? "API key is invalid or expired" : body,
      }, { status: res.status });
    }

    const raw = await res.json();
    const rows: Record<string, string>[] = Array.isArray(raw)
      ? raw
      : raw.data ?? raw.rows ?? [];

    const accounts  = [...new Set(rows.map((r) => r.account_name ?? "—"))].filter(Boolean);
    const campaigns = [...new Set(rows.map((r) => r.campaign))].filter(Boolean).slice(0, 8);
    const dates     = [...new Set(rows.map((r) => r.date))].sort().slice(-5);

    return NextResponse.json({
      status: "ok",
      rowCount: rows.length,
      accounts,
      sampleCampaigns: campaigns,
      mostRecentDates: dates,
      firstRow: rows[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

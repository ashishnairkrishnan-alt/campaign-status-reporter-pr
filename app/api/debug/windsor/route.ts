import { NextRequest, NextResponse } from "next/server";

// Debug endpoint — shows raw Windsor.ai response so you can verify data is flowing.
// Visit: /api/debug/windsor?preset=last_7d
// Remove or protect this endpoint before sharing the URL publicly.

export async function GET(request: NextRequest) {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "WINDSOR_API_KEY not set in environment variables" }, { status: 503 });
  }

  const preset = request.nextUrl.searchParams.get("preset") ?? "last_7d";

  const url = new URL("https://connectors.windsor.ai/all");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("date_preset", preset);
  url.searchParams.set("fields", "date,datasource,account_name,account_id,campaign,adset,ad,impressions,spend,clicks,ctr,cpm");

  try {
    const res  = await fetch(url.toString(), { cache: "no-store" });
    const text = await res.text();

    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    const rows = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>)?.data ?? (parsed as Record<string, unknown>)?.rows ?? parsed;

    const count = Array.isArray(rows) ? rows.length : "unknown";
    const sample = Array.isArray(rows) ? rows.slice(0, 5) : rows;

    // Unique accounts in response
    const accounts = Array.isArray(rows)
      ? [...new Set((rows as Record<string, string>[]).map((r) => `${r.account_name ?? "?"} (${r.account_id ?? "?"})`))].slice(0, 20)
      : [];

    return NextResponse.json({
      status: res.status,
      rowCount: count,
      accounts,
      sample,
      url: url.toString().replace(apiKey, "***"),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

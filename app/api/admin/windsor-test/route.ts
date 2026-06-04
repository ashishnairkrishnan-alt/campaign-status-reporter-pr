import { NextResponse } from "next/server";

// Debug endpoint — checks what Windsor.ai returns for your API key
// Visit: /api/admin/windsor-test
export async function GET() {
  const apiKey = process.env.WINDSOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "WINDSOR_API_KEY not set in environment variables" }, { status: 503 });
  }

  try {
    const url = new URL("https://connectors.windsor.ai/all");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("date_preset", "last_7d");
    url.searchParams.set("fields", "date,account_name,account_id,campaign,spend,impressions,clicks");

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json({
        error: `Windsor returned ${res.status} ${res.statusText}`,
        url: url.toString().replace(apiKey, "***"),
      }, { status: res.status });
    }

    const raw = await res.json();
    const rows = Array.isArray(raw) ? raw : raw.data ?? raw.rows ?? [];

    // Summarise what came back
    const accounts = [...new Set(rows.map((r: Record<string, string>) => r.account_name ?? r.account_id ?? "unknown"))];
    const campaigns = [...new Set(rows.map((r: Record<string, string>) => r.campaign))].slice(0, 10);

    return NextResponse.json({
      status: "ok",
      rowCount: rows.length,
      accounts,
      sampleCampaigns: campaigns,
      firstRow: rows[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

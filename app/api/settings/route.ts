import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import type { Targets } from "@/types";

// NOTE: This writes to /config/targets.json at build/runtime time (local dev only).
// For production on Vercel, the filesystem is read-only — migrate this to a database
// (e.g. Supabase: create a `targets` table with brand/objective/values columns,
// then replace readFile/writeFile with Supabase client calls).

const TARGETS_PATH = path.join(process.cwd(), "config", "targets.json");

export async function GET() {
  const raw = await readFile(TARGETS_PATH, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(request: NextRequest) {
  const body: Targets = await request.json();
  await writeFile(TARGETS_PATH, JSON.stringify(body, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}

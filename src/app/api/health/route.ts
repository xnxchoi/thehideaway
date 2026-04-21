import config from "@/payload.config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await getPayload({ config });
    await payload.db.drizzle.execute(sql`SELECT 1`);
    return NextResponse.json(
      { ok: true, ts: Date.now() },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

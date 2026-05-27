import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

/** Geliştirme: `npm run dev:share` .dev-tunnel-url yazar; panel buradan okur. */
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { url: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const file = path.join(process.cwd(), ".dev-tunnel-url");
  if (!existsSync(file)) {
    return NextResponse.json(
      { url: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const raw = readFileSync(file, "utf8").trim();
  const ok = /^https:\/\/[a-z0-9.-]+\.trycloudflare\.com\/?$/i.test(raw);
  return NextResponse.json(
    { url: ok ? raw.replace(/\/$/, "") : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

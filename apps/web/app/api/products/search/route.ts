import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSearchQuery } from "@/lib/catalog/schemas";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = parseSearchQuery(searchParams);
  return NextResponse.json(searchCatalog(params));
}

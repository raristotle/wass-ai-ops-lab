import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { findEquivalents } from "@/lib/catalog/equivalents";

export const dynamic = "force-dynamic";

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const product = getCatalog().byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ?? undefined;
    return NextResponse.json({
      product,
      equivalents: findEquivalents(product, 8, branchId),
    });
  });
}

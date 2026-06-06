import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { goesWith } from "@/lib/catalog/goeswith";

export const dynamic = "force-dynamic";

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const product = getCatalog().byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ items: goesWith(product, 6) });
  });
}

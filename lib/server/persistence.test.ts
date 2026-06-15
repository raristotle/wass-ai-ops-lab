import { describe, it, expect } from "vitest";
import { MemoryStore } from "@/lib/server/persistence";
import { InlineQueue } from "@/lib/server/queue";

describe("MemoryStore", () => {
  it("puts, gets, lists, and deletes within a namespace", async () => {
    const s = new MemoryStore();
    await s.put("rfq", "a", { id: "a", n: 1 });
    await s.put("rfq", "b", { id: "b", n: 2 });
    expect(await s.get<{ n: number }>("rfq", "a")).toEqual({ id: "a", n: 1 });
    expect((await s.list("rfq")).length).toBe(2);
    await s.delete("rfq", "a");
    expect(await s.get("rfq", "a")).toBeNull();
    expect((await s.list("rfq")).length).toBe(1);
  });

  it("isolates namespaces", async () => {
    const s = new MemoryStore();
    await s.put("orders", "x", { v: 1 });
    expect(await s.get("rma", "x")).toBeNull();
    expect((await s.list("rma")).length).toBe(0);
  });

  it("stores a deep copy — external mutation does not change the stored value", async () => {
    const s = new MemoryStore();
    const obj = { id: "a", nested: { q: 1 } };
    await s.put("ns", "a", obj);
    obj.nested.q = 999;
    expect((await s.get<typeof obj>("ns", "a"))!.nested.q).toBe(1);
  });

  it("returns null for a missing key", async () => {
    const s = new MemoryStore();
    expect(await s.get("ns", "nope")).toBeNull();
  });
});

describe("InlineQueue", () => {
  it("runs the handler inline", async () => {
    const q = new InlineQueue();
    let seen: number | null = null;
    await q.enqueue("test", { n: 7 }, async (d: { n: number }) => {
      seen = d.n;
    });
    expect(seen).toBe(7);
    expect(q.mode).toBe("inline");
  });

  it("never throws into the caller when a handler fails", async () => {
    const q = new InlineQueue();
    await expect(
      q.enqueue("boom", {}, async () => {
        throw new Error("handler exploded");
      }),
    ).resolves.toBeUndefined();
  });
});

import { PrismaClient } from "@prisma/client";
import { ACCOUNTS } from "../data/mock/accounts";
import { QUOTES } from "../data/mock/quotes";
import { ORDERS } from "../data/mock/orders";
import { INVENTORY_ITEMS } from "../data/mock/inventory";
import { SUPPLIERS } from "../data/mock/suppliers";
import { REBATES } from "../data/mock/rebates";
import { PROJECTS } from "../data/mock/projects";
import { SHIPMENTS } from "../data/mock/shipments";
import { INVOICES } from "../data/mock/invoices";
import { AI_USE_CASES } from "../data/mock/ai-use-cases";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  await prisma.account.createMany({
    data: ACCOUNTS.map((a) => ({
      id: a.id,
      name: a.name,
      sbu: a.sbu,
      function: a.function,
      region: a.region,
      tier: a.tier,
      status: a.status,
      annualRevenue: a.annualRevenue,
      contactName: a.contactName,
      contactEmail: a.contactEmail,
      accountManager: a.accountManager,
      createdAt: a.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${ACCOUNTS.length} accounts`);

  await prisma.quote.createMany({
    data: QUOTES.map((q) => ({
      id: q.id,
      accountId: q.accountId,
      accountName: q.accountName,
      sbu: q.sbu,
      function: q.function,
      status: q.status,
      value: q.value,
      margin: q.margin,
      currency: q.currency,
      validUntil: q.validUntil,
      createdAt: q.createdAt,
      owner: q.owner,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${QUOTES.length} quotes`);

  await prisma.order.createMany({
    data: ORDERS.map((o) => ({
      id: o.id,
      quoteId: o.quoteId,
      accountId: o.accountId,
      accountName: o.accountName,
      sbu: o.sbu,
      function: o.function,
      status: o.status,
      value: o.value,
      currency: o.currency,
      lineItems: o.lineItems,
      orderDate: o.orderDate,
      expectedDelivery: o.expectedDelivery,
      actualDelivery: o.actualDelivery ?? null,
      owner: o.owner,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${ORDERS.length} orders`);

  await prisma.inventoryItem.createMany({
    data: INVENTORY_ITEMS.map((i) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      category: i.category,
      supplierId: i.supplierId,
      supplierName: i.supplierName,
      quantity: i.quantity,
      reorderPoint: i.reorderPoint,
      unitCost: i.unitCost,
      totalValue: i.totalValue,
      location: i.location,
      status: i.status,
      sbu: i.sbu,
      function: i.function,
      lastRestocked: i.lastRestocked,
      createdAt: i.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${INVENTORY_ITEMS.length} inventory items`);

  await prisma.supplier.createMany({
    data: SUPPLIERS.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      sbu: s.sbu,
      function: s.function,
      tier: s.tier,
      status: s.status,
      country: s.country,
      contactName: s.contactName,
      contactEmail: s.contactEmail,
      annualSpend: s.annualSpend,
      qualityScore: s.qualityScore,
      deliveryScore: s.deliveryScore,
      leadTimeDays: s.leadTimeDays,
      createdAt: s.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${SUPPLIERS.length} suppliers`);

  await prisma.rebate.createMany({
    data: REBATES.map((r) => ({
      id: r.id,
      name: r.name,
      sbu: r.sbu,
      function: r.function,
      direction: r.direction,
      counterpartyType: r.counterpartyType,
      counterpartyId: r.counterpartyId,
      counterpartyName: r.counterpartyName,
      status: r.status,
      targetValue: r.targetValue,
      achievedValue: r.achievedValue,
      rebateAmount: r.rebateAmount,
      currency: r.currency,
      period: r.period,
      startDate: r.startDate,
      endDate: r.endDate,
      createdAt: r.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${REBATES.length} rebates`);

  await prisma.project.createMany({
    data: PROJECTS.map((p) => ({
      id: p.id,
      name: p.name,
      sbu: p.sbu,
      function: p.function,
      status: p.status,
      phase: p.phase,
      owner: p.owner,
      budget: p.budget,
      spent: p.spent,
      completionPct: p.completionPct,
      teamSize: p.teamSize,
      startDate: p.startDate,
      targetDate: p.targetDate,
      createdAt: p.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${PROJECTS.length} projects`);

  await prisma.shipment.createMany({
    data: SHIPMENTS.map((s) => ({
      id: s.id,
      orderId: s.orderId,
      accountId: s.accountId,
      accountName: s.accountName,
      sbu: s.sbu,
      function: s.function,
      status: s.status,
      mode: s.mode,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      origin: s.origin,
      destination: s.destination,
      weight: s.weight,
      packages: s.packages,
      shippingCost: s.shippingCost,
      dispatchDate: s.dispatchDate,
      estimatedArrival: s.estimatedArrival,
      actualArrival: s.actualArrival ?? null,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${SHIPMENTS.length} shipments`);

  await prisma.invoice.createMany({
    data: INVOICES.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      accountId: i.accountId,
      accountName: i.accountName,
      sbu: i.sbu,
      function: i.function,
      status: i.status,
      amount: i.amount,
      tax: i.tax,
      total: i.total,
      currency: i.currency,
      paymentTerms: i.paymentTerms,
      issuedDate: i.issuedDate,
      dueDate: i.dueDate,
      paidDate: i.paidDate ?? null,
      daysOutstanding: i.daysOutstanding,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${INVOICES.length} invoices`);

  await prisma.aiUseCase.createMany({
    data: AI_USE_CASES.map((u) => ({
      id: u.id,
      name: u.name,
      sbu: u.sbu,
      function: u.function,
      domain: u.domain,
      status: u.status,
      model: u.model,
      monthlyCallVolume: u.monthlyCallVolume,
      avgLatencyMs: u.avgLatencyMs,
      errorRatePct: u.errorRatePct,
      estimatedValueUsd: u.estimatedValueUsd,
      actualValueUsd: u.actualValueUsd,
      monthlyCostUsd: u.monthlyCostUsd,
      roiMultiple: u.roiMultiple,
      launchDate: u.launchDate,
      createdAt: u.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ ${AI_USE_CASES.length} AI use cases`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

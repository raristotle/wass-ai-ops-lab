import type { ComplexProject } from "@/lib/risk/project-orchestrator";

export const mockComplexProjects: ComplexProject[] = [
  // ── 1. One Bayfront Tower ─────────────────────────────────────────────────
  {
    id: "CP-001",
    name: "One Bayfront Tower",
    customer: "Bayfront Development Group",
    sbus: ["CSS", "EES", "UBS"],
    status: "active",
    totalValueUsd: 8_500_000,
    startDate: "2026-01-15",
    endDate: "2026-11-30",
    owners: [
      { sbu: "CSS", name: "Maria Chen" },
      { sbu: "EES", name: "David Park" },
      { sbu: "UBS", name: "Rachel Torres" },
    ],
    bom: { total: 284, approved: 231, missing: 18, pendingReview: 35 },
    quotes: { open: 3, submitted: 2, won: 7, totalValueUsd: 8_500_000, marginPct: 0.17 },
    supplierPackages: [
      { vendor: "Belden",      category: "Structured Cabling",  status: "confirmed",  dueDate: "2026-06-15", valueUsd: 420_000 },
      { vendor: "Panduit",     category: "Rack & Cable Mgmt",   status: "confirmed",  dueDate: "2026-06-20", valueUsd: 185_000 },
      { vendor: "Eaton",       category: "Power Distribution",  status: "confirmed",  dueDate: "2026-07-01", valueUsd: 680_000 },
      { vendor: "Commscope",   category: "Fiber Infrastructure", status: "submitted", dueDate: "2026-06-30", valueUsd: 310_000 },
      { vendor: "Axis Comm.",  category: "Security Cameras",    status: "confirmed",  dueDate: "2026-07-15", valueUsd: 225_000 },
    ],
    milestones: [
      { name: "Design Freeze",          plannedDate: "2026-02-28", actualDate: "2026-03-05", status: "complete" },
      { name: "BOM Approval",           plannedDate: "2026-03-31", actualDate: "2026-04-02", status: "complete" },
      { name: "Supplier PO Release",    plannedDate: "2026-04-15", actualDate: "2026-04-18", status: "complete" },
      { name: "First Material Delivery", plannedDate: "2026-06-15", status: "on-track" },
      { name: "Rough-In Complete",       plannedDate: "2026-08-01", status: "on-track" },
      { name: "Systems Integration",     plannedDate: "2026-09-15", status: "on-track" },
      { name: "Commissioning",           plannedDate: "2026-10-31", status: "on-track" },
      { name: "Owner Acceptance",        plannedDate: "2026-11-30", status: "on-track" },
    ],
    risks: [
      { type: "delivery", severity: "medium", description: "Commscope fiber lead time extended 2 weeks; buffer exists" },
      { type: "scope",    severity: "low",    description: "Tenant fit-out changes may add 15 additional WAPs" },
    ],
    crossSell: [
      { category: "AV Integration",      sbu: "CSS", estimatedValueUsd: 380_000, status: "proposed" },
      { category: "Building Automation", sbu: "EES", estimatedValueUsd: 215_000, status: "identified" },
    ],
  },

  // ── 2. Northgate Medical Campus ───────────────────────────────────────────
  {
    id: "CP-002",
    name: "Northgate Medical Campus",
    customer: "Northgate Health System",
    sbus: ["CSS", "EES"],
    status: "at-risk",
    totalValueUsd: 3_200_000,
    startDate: "2025-11-01",
    endDate: "2026-08-15",
    owners: [
      { sbu: "CSS", name: "James Wilson" },
      { sbu: "EES", name: "Priya Sharma" },
    ],
    bom: { total: 142, approved: 98, missing: 27, pendingReview: 17 },
    quotes: { open: 4, submitted: 1, won: 5, totalValueUsd: 3_200_000, marginPct: 0.13 },
    supplierPackages: [
      { vendor: "Leviton",     category: "Nurse Call System",   status: "late",       dueDate: "2026-04-30", valueUsd: 290_000 },
      { vendor: "Honeywell",   category: "Fire Alarm",          status: "confirmed",  dueDate: "2026-05-15", valueUsd: 175_000 },
      { vendor: "Genetec",     category: "Access Control",      status: "submitted",  dueDate: "2026-05-30", valueUsd: 220_000 },
      { vendor: "Schneider",   category: "Electrical Panels",   status: "late",       dueDate: "2026-05-01", valueUsd: 340_000 },
    ],
    milestones: [
      { name: "Schematic Design",      plannedDate: "2025-12-15", actualDate: "2025-12-18", status: "complete" },
      { name: "BOM Approval",          plannedDate: "2026-01-31", actualDate: "2026-02-14", status: "complete" },
      { name: "Supplier Award",        plannedDate: "2026-02-28", status: "late" },
      { name: "First Delivery",        plannedDate: "2026-05-01", status: "at-risk" },
      { name: "Rough-In Complete",     plannedDate: "2026-06-15", status: "at-risk" },
      { name: "Commissioning",         plannedDate: "2026-07-31", status: "on-track" },
      { name: "Beneficial Occupancy",  plannedDate: "2026-08-15", status: "on-track" },
    ],
    risks: [
      { type: "delivery",    severity: "critical", description: "2 supplier packages 22 days late; Leviton nurse-call system impacting critical-path" },
      { type: "margin",      severity: "high",     description: "Margin compressed to 13% due to scope additions; below 15% threshold" },
      { type: "fulfillment", severity: "high",     description: "27 BOM lines still unapproved; electrical panels delayed from Schneider" },
    ],
    crossSell: [
      { category: "Medical Gas Monitoring", sbu: "EES", estimatedValueUsd: 120_000, status: "identified" },
      { category: "Infant Security",        sbu: "CSS", estimatedValueUsd: 95_000,  status: "proposed" },
    ],
  },

  // ── 3. Riverside Logistics Hub ────────────────────────────────────────────
  {
    id: "CP-003",
    name: "Riverside Logistics Hub",
    customer: "Riverside Transport Co.",
    sbus: ["EES", "UBS"],
    status: "planning",
    totalValueUsd: 2_100_000,
    startDate: "2026-06-01",
    endDate: "2027-02-28",
    owners: [
      { sbu: "EES", name: "Tom Nguyen" },
    ],
    bom: { total: 88, approved: 12, missing: 44, pendingReview: 32 },
    quotes: { open: 6, submitted: 0, won: 2, totalValueUsd: 2_100_000, marginPct: 0.19 },
    supplierPackages: [
      { vendor: "Hubbell",  category: "Industrial Wiring Devices", status: "pending", dueDate: "2026-07-15", valueUsd: 180_000 },
      { vendor: "Corning",  category: "Fiber Cable Plant",         status: "pending", dueDate: "2026-07-30", valueUsd: 140_000 },
    ],
    milestones: [
      { name: "Kick-Off",       plannedDate: "2026-06-15", status: "on-track" },
      { name: "BOM Freeze",     plannedDate: "2026-07-31", status: "on-track" },
      { name: "Supplier Award", plannedDate: "2026-08-31", status: "on-track" },
      { name: "First Delivery", plannedDate: "2026-10-01", status: "on-track" },
      { name: "Commissioning",  plannedDate: "2027-01-31", status: "on-track" },
    ],
    risks: [
      { type: "owner", severity: "high", description: "UBS owner not yet assigned; broadband scope unrepresented" },
    ],
    crossSell: [
      { category: "Fleet Charging Infrastructure", sbu: "EES", estimatedValueUsd: 310_000, status: "identified" },
      { category: "Private LTE / CBRS",            sbu: "UBS", estimatedValueUsd: 190_000, status: "identified" },
    ],
  },

  // ── 4. Pinnacle Smart Office ──────────────────────────────────────────────
  {
    id: "CP-004",
    name: "Pinnacle Smart Office Complex",
    customer: "Pinnacle REIT Holdings",
    sbus: ["CSS", "EES", "UBS"],
    status: "active",
    totalValueUsd: 5_800_000,
    startDate: "2026-02-01",
    endDate: "2026-12-15",
    owners: [
      { sbu: "CSS", name: "Angela Kim" },
      { sbu: "EES", name: "Marco Alvarez" },
      { sbu: "UBS", name: "Steve Liu" },
    ],
    bom: { total: 198, approved: 176, missing: 8, pendingReview: 14 },
    quotes: { open: 1, submitted: 3, won: 9, totalValueUsd: 5_800_000, marginPct: 0.21 },
    supplierPackages: [
      { vendor: "Siemens",    category: "Building Automation",  status: "confirmed",  dueDate: "2026-06-01", valueUsd: 520_000 },
      { vendor: "Lutron",     category: "Lighting Control",     status: "confirmed",  dueDate: "2026-05-15", valueUsd: 210_000 },
      { vendor: "Cisco",      category: "Network Infrastructure", status: "confirmed", dueDate: "2026-06-15", valueUsd: 680_000 },
      { vendor: "Milestone",  category: "VMS Platform",         status: "confirmed",  dueDate: "2026-07-01", valueUsd: 145_000 },
    ],
    milestones: [
      { name: "Design Complete",   plannedDate: "2026-03-15", actualDate: "2026-03-12", status: "complete" },
      { name: "BOM Approval",      plannedDate: "2026-04-01", actualDate: "2026-04-03", status: "complete" },
      { name: "Material On-Site",  plannedDate: "2026-06-15", status: "on-track" },
      { name: "Fit-Out Complete",  plannedDate: "2026-09-30", status: "on-track" },
      { name: "Commissioning",     plannedDate: "2026-11-15", status: "on-track" },
      { name: "Handover",          plannedDate: "2026-12-15", status: "on-track" },
    ],
    risks: [
      { type: "scope", severity: "low", description: "Tenant 3B added 2,000 sq ft; minor BOM impact under evaluation" },
    ],
    crossSell: [
      { category: "Digital Signage",  sbu: "CSS", estimatedValueUsd: 175_000, status: "quoted" },
      { category: "EV Charging",      sbu: "EES", estimatedValueUsd: 240_000, status: "proposed" },
    ],
  },

  // ── 5. Meridian Industrial Control ────────────────────────────────────────
  {
    id: "CP-005",
    name: "Meridian Industrial Control Upgrade",
    customer: "Meridian Plastics Inc.",
    sbus: ["EES"],
    status: "active",
    totalValueUsd: 1_400_000,
    startDate: "2026-03-01",
    endDate: "2026-09-30",
    owners: [
      { sbu: "EES", name: "Sandra Okafor" },
    ],
    bom: { total: 64, approved: 58, missing: 3, pendingReview: 3 },
    quotes: { open: 0, submitted: 1, won: 4, totalValueUsd: 1_400_000, marginPct: 0.22 },
    supplierPackages: [
      { vendor: "Allen-Bradley", category: "PLCs & Drives",       status: "confirmed", dueDate: "2026-05-30", valueUsd: 410_000 },
      { vendor: "Phoenix Contact", category: "Control Components", status: "confirmed", dueDate: "2026-05-15", valueUsd: 120_000 },
    ],
    milestones: [
      { name: "Engineering Complete", plannedDate: "2026-03-31", actualDate: "2026-04-01", status: "complete" },
      { name: "Equipment Delivery",   plannedDate: "2026-06-01", status: "on-track" },
      { name: "Panel Build",          plannedDate: "2026-07-15", status: "on-track" },
      { name: "Site Install",         plannedDate: "2026-08-31", status: "on-track" },
      { name: "Commissioning",        plannedDate: "2026-09-30", status: "on-track" },
    ],
    risks: [],
    crossSell: [
      { category: "SCADA Connectivity", sbu: "EES", estimatedValueUsd: 85_000, status: "identified" },
    ],
  },

  // ── 6. Clearview Fiber Network ────────────────────────────────────────────
  {
    id: "CP-006",
    name: "Clearview Fiber Network Expansion",
    customer: "Clearview Municipality",
    sbus: ["UBS"],
    status: "at-risk",
    totalValueUsd: 2_900_000,
    startDate: "2025-10-01",
    endDate: "2026-07-31",
    owners: [
      { sbu: "UBS", name: "Brett Hansen" },
    ],
    bom: { total: 112, approved: 74, missing: 22, pendingReview: 16 },
    quotes: { open: 2, submitted: 3, won: 4, totalValueUsd: 2_900_000, marginPct: 0.16 },
    supplierPackages: [
      { vendor: "Corning",   category: "Outside Plant Fiber", status: "late",      dueDate: "2026-03-31", valueUsd: 580_000 },
      { vendor: "CommScope", category: "Splice Closures",     status: "submitted", dueDate: "2026-04-30", valueUsd: 95_000  },
      { vendor: "ADSS",      category: "Aerial Hardware",     status: "confirmed", dueDate: "2026-05-15", valueUsd: 130_000 },
    ],
    milestones: [
      { name: "Route Survey",        plannedDate: "2025-11-30", actualDate: "2025-12-01", status: "complete" },
      { name: "Permitting Complete", plannedDate: "2026-01-31", status: "late" },
      { name: "Material Delivery",   plannedDate: "2026-04-15", status: "at-risk" },
      { name: "Aerial Strand",       plannedDate: "2026-05-31", status: "at-risk" },
      { name: "Fiber Blowing",       plannedDate: "2026-06-30", status: "on-track" },
      { name: "Final Acceptance",    plannedDate: "2026-07-31", status: "on-track" },
    ],
    risks: [
      { type: "delivery",    severity: "critical", description: "Municipal permitting delayed 6 weeks; Corning fiber 45 days late to site" },
      { type: "fulfillment", severity: "high",     description: "22 BOM lines pending county approval for underground conduit spec" },
    ],
    crossSell: [
      { category: "OSP Maintenance Contract", sbu: "UBS", estimatedValueUsd: 145_000, status: "proposed" },
    ],
  },

  // ── 7. Harbor Security Overhaul ───────────────────────────────────────────
  {
    id: "CP-007",
    name: "Harbor Security Overhaul",
    customer: "Port Authority of Harbor Bay",
    sbus: ["CSS"],
    status: "complete",
    totalValueUsd: 1_800_000,
    startDate: "2025-06-01",
    endDate: "2026-01-31",
    owners: [
      { sbu: "CSS", name: "Lena Hartmann" },
    ],
    bom: { total: 95, approved: 95, missing: 0, pendingReview: 0 },
    quotes: { open: 0, submitted: 0, won: 6, totalValueUsd: 1_800_000, marginPct: 0.24 },
    supplierPackages: [
      { vendor: "Axis Comm.",  category: "PTZ Cameras",       status: "confirmed", dueDate: "2025-09-01", valueUsd: 280_000 },
      { vendor: "Gallagher",   category: "Access Control",    status: "confirmed", dueDate: "2025-09-15", valueUsd: 195_000 },
      { vendor: "Pelco",       category: "Video Management",  status: "confirmed", dueDate: "2025-10-01", valueUsd: 110_000 },
    ],
    milestones: [
      { name: "Design",        plannedDate: "2025-07-31", actualDate: "2025-07-30", status: "complete" },
      { name: "Install",       plannedDate: "2025-11-30", actualDate: "2025-11-28", status: "complete" },
      { name: "Commissioning", plannedDate: "2026-01-15", actualDate: "2026-01-17", status: "complete" },
      { name: "Handover",      plannedDate: "2026-01-31", actualDate: "2026-01-31", status: "complete" },
    ],
    risks: [],
    crossSell: [
      { category: "Drone Detection System", sbu: "CSS", estimatedValueUsd: 220_000, status: "proposed" },
    ],
  },

  // ── 8. Central Distribution Center ───────────────────────────────────────
  {
    id: "CP-008",
    name: "Central Distribution Center Build-Out",
    customer: "Apex Fulfillment Inc.",
    sbus: ["EES", "UBS"],
    status: "at-risk",
    totalValueUsd: 4_200_000,
    startDate: "2026-01-01",
    endDate: "2026-10-31",
    owners: [
      { sbu: "EES", name: "Chris Deluca" },
      // UBS owner missing
    ],
    bom: { total: 176, approved: 121, missing: 38, pendingReview: 17 },
    quotes: { open: 5, submitted: 2, won: 6, totalValueUsd: 4_200_000, marginPct: 0.11 },
    supplierPackages: [
      { vendor: "Eaton",      category: "MV Switchgear",      status: "late",       dueDate: "2026-04-01", valueUsd: 890_000 },
      { vendor: "Corning",    category: "Fiber Backbone",      status: "confirmed",  dueDate: "2026-05-15", valueUsd: 220_000 },
      { vendor: "Hubbell",    category: "Industrial Outlets",  status: "submitted",  dueDate: "2026-05-01", valueUsd: 155_000 },
      { vendor: "Banner Eng.", category: "Safety Systems",     status: "late",       dueDate: "2026-04-15", valueUsd: 195_000 },
    ],
    milestones: [
      { name: "Site Readiness",      plannedDate: "2026-02-28", actualDate: "2026-02-28", status: "complete" },
      { name: "MV Switchgear Delivery", plannedDate: "2026-04-01", status: "late" },
      { name: "Main Electrical Rough-In", plannedDate: "2026-05-31", status: "at-risk" },
      { name: "Automation Install",  plannedDate: "2026-07-31", status: "at-risk" },
      { name: "Commissioning",       plannedDate: "2026-09-30", status: "on-track" },
      { name: "Go-Live",             plannedDate: "2026-10-31", status: "on-track" },
    ],
    risks: [
      { type: "fulfillment", severity: "critical", description: "MV Switchgear from Eaton 31 days late; critical-path impact to rough-in" },
      { type: "margin",      severity: "high",     description: "Margin at 11% after scope change orders; below floor" },
      { type: "owner",       severity: "high",     description: "UBS scope owner not assigned; broadband infra design stalled" },
    ],
    crossSell: [
      { category: "WMS Integration",      sbu: "EES", estimatedValueUsd: 175_000, status: "identified" },
      { category: "Private 5G Network",   sbu: "UBS", estimatedValueUsd: 290_000, status: "identified" },
    ],
  },

  // ── 9. University Campus Connect ──────────────────────────────────────────
  {
    id: "CP-009",
    name: "University Campus Connect",
    customer: "Western State University",
    sbus: ["CSS", "UBS"],
    status: "active",
    totalValueUsd: 2_600_000,
    startDate: "2026-01-01",
    endDate: "2026-08-31",
    owners: [
      { sbu: "CSS", name: "Diana Lee" },
      { sbu: "UBS", name: "Kevin Osei" },
    ],
    bom: { total: 128, approved: 111, missing: 7, pendingReview: 10 },
    quotes: { open: 2, submitted: 1, won: 5, totalValueUsd: 2_600_000, marginPct: 0.18 },
    supplierPackages: [
      { vendor: "Belden",    category: "Cat6A Cabling",        status: "confirmed", dueDate: "2026-05-15", valueUsd: 285_000 },
      { vendor: "Ericsson",  category: "DAS System",           status: "confirmed", dueDate: "2026-06-01", valueUsd: 430_000 },
      { vendor: "Axis",      category: "Campus Cameras",       status: "confirmed", dueDate: "2026-05-30", valueUsd: 195_000 },
    ],
    milestones: [
      { name: "Phase 1 Design",  plannedDate: "2026-02-15", actualDate: "2026-02-16", status: "complete" },
      { name: "Material Award",  plannedDate: "2026-03-15", actualDate: "2026-03-14", status: "complete" },
      { name: "Dorm Install",    plannedDate: "2026-06-15", status: "on-track" },
      { name: "Academic Install", plannedDate: "2026-07-31", status: "on-track" },
      { name: "Go-Live",         plannedDate: "2026-08-31", status: "on-track" },
    ],
    risks: [
      { type: "delivery", severity: "low", description: "Summer shutdown window July 4-14 constrains install schedule; buffer adequate" },
    ],
    crossSell: [
      { category: "Smart Classroom AV",  sbu: "CSS", estimatedValueUsd: 210_000, status: "proposed" },
      { category: "Emergency Mass Notification", sbu: "CSS", estimatedValueUsd: 85_000, status: "identified" },
    ],
  },

  // ── 10. Lakeside Manufacturing ────────────────────────────────────────────
  {
    id: "CP-010",
    name: "Lakeside Manufacturing Plant",
    customer: "Lakeside Precision Parts",
    sbus: ["EES"],
    status: "on-hold",
    totalValueUsd: 3_500_000,
    startDate: "2026-05-01",
    endDate: "2027-04-30",
    owners: [
      { sbu: "EES", name: "Raj Patel" },
    ],
    bom: { total: 154, approved: 34, missing: 82, pendingReview: 38 },
    quotes: { open: 8, submitted: 0, won: 1, totalValueUsd: 3_500_000, marginPct: 0.16 },
    supplierPackages: [
      { vendor: "ABB",       category: "Motor Control Centers",  status: "pending", dueDate: "2026-09-01", valueUsd: 920_000 },
      { vendor: "Rockwell",  category: "Safety PLCs",            status: "pending", dueDate: "2026-09-15", valueUsd: 380_000 },
    ],
    milestones: [
      { name: "Customer CapEx Approval", plannedDate: "2026-06-30", status: "on-track" },
      { name: "Engineering Kick-Off",    plannedDate: "2026-07-31", status: "on-track" },
      { name: "BOM Freeze",              plannedDate: "2026-09-30", status: "on-track" },
    ],
    risks: [
      { type: "scope", severity: "medium", description: "Customer CapEx committee approval pending; project on-hold pending board review" },
      { type: "owner", severity: "medium", description: "Project gated; owner bandwidth constrained on active portfolio" },
    ],
    crossSell: [
      { category: "Energy Management System", sbu: "EES", estimatedValueUsd: 420_000, status: "identified" },
    ],
  },

  // ── 11. Summit Telecom Tower ──────────────────────────────────────────────
  {
    id: "CP-011",
    name: "Summit Telecom Tower Build",
    customer: "Summit Ridge Wireless",
    sbus: ["UBS"],
    status: "planning",
    totalValueUsd: 1_100_000,
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    owners: [],
    bom: { total: 48, approved: 0, missing: 48, pendingReview: 0 },
    quotes: { open: 3, submitted: 0, won: 0, totalValueUsd: 1_100_000, marginPct: 0.20 },
    supplierPackages: [],
    milestones: [
      { name: "Site Acquisition",    plannedDate: "2026-08-31", status: "on-track" },
      { name: "Structural Analysis", plannedDate: "2026-09-30", status: "on-track" },
      { name: "Equipment Award",     plannedDate: "2026-10-15", status: "on-track" },
      { name: "Tower Erection",      plannedDate: "2026-11-30", status: "on-track" },
      { name: "RF Commission",       plannedDate: "2026-12-31", status: "on-track" },
    ],
    risks: [
      { type: "owner", severity: "critical", description: "No owner assigned; tower scope with no UBS lead" },
    ],
    crossSell: [],
  },

  // ── 12. Metro Office Complex ──────────────────────────────────────────────
  {
    id: "CP-012",
    name: "Metro Office Complex",
    customer: "Metro Property Partners",
    sbus: ["CSS", "EES"],
    status: "active",
    totalValueUsd: 2_300_000,
    startDate: "2026-02-15",
    endDate: "2026-09-30",
    owners: [
      { sbu: "CSS", name: "Frank Russo" },
      { sbu: "EES", name: "Amy Zhou" },
    ],
    bom: { total: 104, approved: 92, missing: 4, pendingReview: 8 },
    quotes: { open: 1, submitted: 2, won: 5, totalValueUsd: 2_300_000, marginPct: 0.19 },
    supplierPackages: [
      { vendor: "Panduit",  category: "Structured Cabling",  status: "confirmed", dueDate: "2026-06-01", valueUsd: 195_000 },
      { vendor: "Leviton",  category: "AV Systems",          status: "confirmed", dueDate: "2026-06-15", valueUsd: 140_000 },
      { vendor: "Eaton",    category: "UPS Systems",         status: "submitted", dueDate: "2026-06-30", valueUsd: 215_000 },
    ],
    milestones: [
      { name: "BOM Approval",     plannedDate: "2026-03-31", actualDate: "2026-04-01", status: "complete" },
      { name: "Material Delivery", plannedDate: "2026-06-01", status: "on-track" },
      { name: "Install",          plannedDate: "2026-07-31", status: "on-track" },
      { name: "Commissioning",    plannedDate: "2026-09-15", status: "on-track" },
      { name: "Handover",         plannedDate: "2026-09-30", status: "on-track" },
    ],
    risks: [],
    crossSell: [
      { category: "Managed Services", sbu: "CSS", estimatedValueUsd: 95_000, status: "proposed" },
    ],
  },

  // ── 13. International Airport Terminal B ──────────────────────────────────
  {
    id: "CP-013",
    name: "International Airport Terminal B",
    customer: "Metro Airport Authority",
    sbus: ["CSS", "EES", "UBS"],
    status: "at-risk",
    totalValueUsd: 7_200_000,
    startDate: "2025-09-01",
    endDate: "2026-09-30",
    owners: [
      { sbu: "CSS", name: "Nina Roberts" },
      { sbu: "EES", name: "Carlos Mendez" },
      // UBS owner missing
    ],
    bom: { total: 312, approved: 198, missing: 67, pendingReview: 47 },
    quotes: { open: 7, submitted: 4, won: 8, totalValueUsd: 7_200_000, marginPct: 0.09 },
    supplierPackages: [
      { vendor: "Leviton",    category: "FIDS Cabling",         status: "late",       dueDate: "2026-02-28", valueUsd: 420_000 },
      { vendor: "Bosch",      category: "PA / Intercom",        status: "late",       dueDate: "2026-03-15", valueUsd: 385_000 },
      { vendor: "Siemens",    category: "BMS Integration",      status: "confirmed",  dueDate: "2026-05-01", valueUsd: 780_000 },
      { vendor: "Eaton",      category: "Bus Duct System",      status: "late",       dueDate: "2026-03-01", valueUsd: 950_000 },
      { vendor: "CommScope",  category: "DAS / Cellular",       status: "submitted",  dueDate: "2026-05-15", valueUsd: 540_000 },
      { vendor: "Milestone",  category: "Airport VMS",          status: "confirmed",  dueDate: "2026-06-01", valueUsd: 290_000 },
    ],
    milestones: [
      { name: "Phase 1 Design",      plannedDate: "2025-11-30", actualDate: "2025-12-10", status: "complete" },
      { name: "Airside Approval",    plannedDate: "2026-01-31", status: "late" },
      { name: "Bus Duct Delivery",   plannedDate: "2026-03-01", status: "late" },
      { name: "Electrical Rough-In", plannedDate: "2026-04-30", status: "at-risk" },
      { name: "FIDS / AV Install",   plannedDate: "2026-06-30", status: "at-risk" },
      { name: "TSA Commissioning",   plannedDate: "2026-08-15", status: "on-track" },
      { name: "Terminal Opening",    plannedDate: "2026-09-30", status: "on-track" },
    ],
    risks: [
      { type: "delivery",    severity: "critical", description: "3 supplier packages late incl. Bus Duct ($950K); critical-path jeopardized" },
      { type: "margin",      severity: "critical", description: "Margin at 9% — below profitability floor; change order negotiations ongoing" },
      { type: "owner",       severity: "high",     description: "UBS / DAS scope owner not assigned; cellular carrier coordination unmanaged" },
      { type: "fulfillment", severity: "high",     description: "67 BOM lines unapproved; airside security items require TSA pre-approval" },
    ],
    crossSell: [
      { category: "Baggage Handling BMS", sbu: "EES", estimatedValueUsd: 480_000, status: "identified" },
      { category: "Airfield Lighting",    sbu: "EES", estimatedValueUsd: 320_000, status: "identified" },
      { category: "Outdoor DAS Phase 2",  sbu: "UBS", estimatedValueUsd: 215_000, status: "proposed" },
    ],
  },

  // ── 14. Westside Hospital Expansion ───────────────────────────────────────
  {
    id: "CP-014",
    name: "Westside Hospital Expansion",
    customer: "Westside Regional Medical Center",
    sbus: ["CSS", "EES"],
    status: "at-risk",
    totalValueUsd: 3_900_000,
    startDate: "2025-12-01",
    endDate: "2026-10-31",
    owners: [
      { sbu: "CSS", name: "Monica Singh" },
      { sbu: "EES", name: "Dan Fischer" },
    ],
    bom: { total: 168, approved: 117, missing: 31, pendingReview: 20 },
    quotes: { open: 3, submitted: 2, won: 6, totalValueUsd: 3_900_000, marginPct: 0.14 },
    supplierPackages: [
      { vendor: "Rauland",     category: "Nurse Call",        status: "confirmed", dueDate: "2026-05-30", valueUsd: 310_000 },
      { vendor: "GE Healthcare", category: "Monitoring Infra", status: "late",     dueDate: "2026-04-30", valueUsd: 560_000 },
      { vendor: "Schneider",   category: "Critical Power",    status: "submitted", dueDate: "2026-06-01", valueUsd: 480_000 },
    ],
    milestones: [
      { name: "Design Approval",    plannedDate: "2026-01-31", actualDate: "2026-02-05", status: "complete" },
      { name: "HCP Equipment",      plannedDate: "2026-04-30", status: "late" },
      { name: "Rough-In Complete",  plannedDate: "2026-06-30", status: "at-risk" },
      { name: "AHJ Inspection",     plannedDate: "2026-08-15", status: "on-track" },
      { name: "Commissioning",      plannedDate: "2026-09-30", status: "on-track" },
      { name: "Occupancy",          plannedDate: "2026-10-31", status: "on-track" },
    ],
    risks: [
      { type: "delivery", severity: "high",   description: "GE Healthcare monitoring infra late; ICU area rough-in delayed" },
      { type: "margin",   severity: "medium",  description: "Margin at 14%; watchlist — below 15% threshold" },
    ],
    crossSell: [
      { category: "OR Integration",     sbu: "CSS", estimatedValueUsd: 180_000, status: "proposed" },
      { category: "Emergency Generator", sbu: "EES", estimatedValueUsd: 250_000, status: "identified" },
    ],
  },

  // ── 15. National Retail Rollout ───────────────────────────────────────────
  {
    id: "CP-015",
    name: "National Retail Rollout Phase 2",
    customer: "NationMart Stores LLC",
    sbus: ["CSS"],
    status: "active",
    totalValueUsd: 1_600_000,
    startDate: "2026-04-01",
    endDate: "2026-11-30",
    owners: [
      { sbu: "CSS", name: "Tyler Brooks" },
    ],
    bom: { total: 72, approved: 65, missing: 2, pendingReview: 5 },
    quotes: { open: 0, submitted: 1, won: 6, totalValueUsd: 1_600_000, marginPct: 0.23 },
    supplierPackages: [
      { vendor: "Axis",    category: "Retail Cameras",       status: "confirmed", dueDate: "2026-06-01", valueUsd: 210_000 },
      { vendor: "Sensormatic", category: "EAS/RFID",        status: "confirmed", dueDate: "2026-06-15", valueUsd: 175_000 },
    ],
    milestones: [
      { name: "Pilot Store Complete",  plannedDate: "2026-05-31", status: "on-track" },
      { name: "Wave 1 (10 stores)",    plannedDate: "2026-07-31", status: "on-track" },
      { name: "Wave 2 (20 stores)",    plannedDate: "2026-09-30", status: "on-track" },
      { name: "Wave 3 (remaining)",    plannedDate: "2026-11-30", status: "on-track" },
    ],
    risks: [
      { type: "scope", severity: "low", description: "6 additional locations added to Wave 3; minimal BOM impact" },
    ],
    crossSell: [
      { category: "Digital Price Tags",  sbu: "CSS", estimatedValueUsd: 95_000,  status: "proposed" },
      { category: "Self-Checkout Infra", sbu: "CSS", estimatedValueUsd: 145_000, status: "identified" },
    ],
  },
];

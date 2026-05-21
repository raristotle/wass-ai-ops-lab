import type { SBU, OpsFunction } from "./accounts";

export type UseCaseStatus = "Ideation" | "Pilot" | "Deployed" | "Scaling" | "Deprecated";
export type UseCaseDomain = "Automation" | "Analytics" | "Decision Support" | "Customer Experience" | "Prediction" | "Document Processing" | "Code Generation";

export interface AiUseCase {
  id: string;
  name: string;
  description: string;
  domain: UseCaseDomain;
  status: UseCaseStatus;
  model: string;
  sbu: SBU;
  function: OpsFunction;
  owner: string;
  launchDate: string | null;
  monthlyCallVolume: number;
  avgLatencyMs: number;
  errorRatePct: number;
  estimatedValueUsd: number;
  actualValueUsd: number;
  monthlyCostUsd: number;
  roiMultiple: number;
  createdAt: string;
  // governance
  confidenceScore: number;       // 0-100; 0 = not yet calculated
  reasonCodes: string[];
  humanReviewRequired: boolean;
}

export const mockAiUseCases: AiUseCase[] = [
  {
    id: "AI-001", name: "PO Anomaly Detector",
    description: "Flags suspicious purchase orders using pattern matching + LLM reasoning",
    domain: "Decision Support", status: "Deployed", model: "claude-haiku-4",
    sbu: "Manufacturing", function: "Procurement", owner: "Emma Wilson",
    launchDate: "2024-08-15T00:00:00Z",
    monthlyCallVolume: 124_000, avgLatencyMs: 280, errorRatePct: 0.08,
    estimatedValueUsd: 1_200_000, actualValueUsd: 1_480_000, monthlyCostUsd: 3_100, roiMultiple: 39.8,
    createdAt: "2024-05-10T00:00:00Z",
    confidenceScore: 92, reasonCodes: [], humanReviewRequired: false,
  },
  {
    id: "AI-002", name: "Clinical Note Summariser",
    description: "Generates structured SOAP notes from physician dictation audio transcripts",
    domain: "Document Processing", status: "Deployed", model: "claude-sonnet-4",
    sbu: "Healthcare", function: "Operations", owner: "Carol Singh",
    launchDate: "2024-10-01T00:00:00Z",
    monthlyCallVolume: 38_500, avgLatencyMs: 920, errorRatePct: 0.11,
    estimatedValueUsd: 3_500_000, actualValueUsd: 3_200_000, monthlyCostUsd: 11_550, roiMultiple: 22.9,
    createdAt: "2024-06-20T00:00:00Z",
    confidenceScore: 87, reasonCodes: ["HIGH_LATENCY"], humanReviewRequired: true,
  },
  {
    id: "AI-003", name: "Demand Forecasting Co-pilot",
    description: "Conversational interface over 5-year demand data; generates forecasts on query",
    domain: "Analytics", status: "Deployed", model: "claude-sonnet-4",
    sbu: "Retail", function: "Operations", owner: "David Park",
    launchDate: "2024-11-20T00:00:00Z",
    monthlyCallVolume: 12_200, avgLatencyMs: 850, errorRatePct: 0.09,
    estimatedValueUsd: 2_400_000, actualValueUsd: 2_100_000, monthlyCostUsd: 3_660, roiMultiple: 47.5,
    createdAt: "2024-07-15T00:00:00Z",
    confidenceScore: 84, reasonCodes: ["SEASONAL_ANOMALY"], humanReviewRequired: false,
  },
  {
    id: "AI-004", name: "Contract Review Assistant",
    description: "Extracts clauses, flags risk terms, and compares against standard playbook",
    domain: "Document Processing", status: "Deployed", model: "claude-opus-4",
    sbu: "Government", function: "Procurement", owner: "Alice Thornton",
    launchDate: "2024-09-10T00:00:00Z",
    monthlyCallVolume: 4_800, avgLatencyMs: 2_400, errorRatePct: 0.05,
    estimatedValueUsd: 5_000_000, actualValueUsd: 4_600_000, monthlyCostUsd: 14_400, roiMultiple: 26.4,
    createdAt: "2024-05-28T00:00:00Z",
    confidenceScore: 91, reasonCodes: ["REGULATORY_RISK"], humanReviewRequired: true,
  },
  {
    id: "AI-005", name: "Shipment Exception Handler",
    description: "Triages carrier exception alerts and drafts resolution actions automatically",
    domain: "Automation", status: "Deployed", model: "claude-haiku-4",
    sbu: "Distribution", function: "Logistics", owner: "Bob Reyes",
    launchDate: "2025-01-10T00:00:00Z",
    monthlyCallVolume: 67_000, avgLatencyMs: 310, errorRatePct: 0.12,
    estimatedValueUsd: 850_000, actualValueUsd: 920_000, monthlyCostUsd: 1_675, roiMultiple: 45.9,
    createdAt: "2024-09-05T00:00:00Z",
    confidenceScore: 89, reasonCodes: [], humanReviewRequired: false,
  },
  {
    id: "AI-006", name: "Financial Close Assistant",
    description: "Reconciles GL entries and flags unexplained variances with narrative",
    domain: "Analytics", status: "Deployed", model: "claude-sonnet-4",
    sbu: "Retail", function: "Finance", owner: "David Park",
    launchDate: "2024-12-01T00:00:00Z",
    monthlyCallVolume: 8_400, avgLatencyMs: 780, errorRatePct: 0.06,
    estimatedValueUsd: 1_800_000, actualValueUsd: 1_950_000, monthlyCostUsd: 2_520, roiMultiple: 64.3,
    createdAt: "2024-08-12T00:00:00Z",
    confidenceScore: 95, reasonCodes: [], humanReviewRequired: false,
  },
  {
    id: "AI-007", name: "Quality Defect Classifier",
    description: "Computer-vision + LLM pipeline classifying manufacturing defects by type",
    domain: "Prediction", status: "Scaling", model: "claude-sonnet-4",
    sbu: "Manufacturing", function: "Operations", owner: "Emma Wilson",
    launchDate: "2025-02-15T00:00:00Z",
    monthlyCallVolume: 89_000, avgLatencyMs: 640, errorRatePct: 0.14,
    estimatedValueUsd: 4_200_000, actualValueUsd: 840_000, monthlyCostUsd: 26_700, roiMultiple: 2.6,
    createdAt: "2024-10-20T00:00:00Z",
    confidenceScore: 71, reasonCodes: ["LOW_SAMPLE_SIZE", "MODEL_DRIFT"], humanReviewRequired: true,
  },
  {
    id: "AI-008", name: "Supplier Risk Monitor",
    description: "Daily LLM scan of news, filings, and ratings to score supplier risk",
    domain: "Decision Support", status: "Deployed", model: "claude-haiku-4",
    sbu: "Manufacturing", function: "Procurement", owner: "Emma Wilson",
    launchDate: "2024-11-01T00:00:00Z",
    monthlyCallVolume: 31_000, avgLatencyMs: 295, errorRatePct: 0.07,
    estimatedValueUsd: 2_200_000, actualValueUsd: 1_900_000, monthlyCostUsd: 775, roiMultiple: 204.1,
    createdAt: "2024-08-30T00:00:00Z",
    confidenceScore: 88, reasonCodes: [], humanReviewRequired: false,
  },
  {
    id: "AI-009", name: "Patient FAQ Chatbot",
    description: "24/7 conversational agent for appointment scheduling and policy queries",
    domain: "Customer Experience", status: "Deployed", model: "claude-haiku-4",
    sbu: "Healthcare", function: "IT", owner: "Carol Singh",
    launchDate: "2025-03-01T00:00:00Z",
    monthlyCallVolume: 210_000, avgLatencyMs: 290, errorRatePct: 0.10,
    estimatedValueUsd: 1_600_000, actualValueUsd: 480_000, monthlyCostUsd: 5_250, roiMultiple: 7.6,
    createdAt: "2024-11-08T00:00:00Z",
    confidenceScore: 83, reasonCodes: ["LOW_SAMPLE_SIZE"], humanReviewRequired: true,
  },
  {
    id: "AI-010", name: "Regulatory Filing Generator",
    description: "Drafts OSHA, EPA, and SEC filings from structured internal data",
    domain: "Document Processing", status: "Pilot", model: "claude-opus-4",
    sbu: "Government", function: "Finance", owner: "Alice Thornton",
    launchDate: null,
    monthlyCallVolume: 480, avgLatencyMs: 3_100, errorRatePct: 0.22,
    estimatedValueUsd: 6_000_000, actualValueUsd: 0, monthlyCostUsd: 1_440, roiMultiple: 0.0,
    createdAt: "2025-01-15T00:00:00Z",
    confidenceScore: 52, reasonCodes: ["PILOT_EVALUATION", "REGULATORY_RISK", "HIGH_ERROR_RATE"], humanReviewRequired: true,
  },
  {
    id: "AI-011", name: "Inventory Reorder Agent",
    description: "Autonomous agent that raises POs when stock falls below dynamic thresholds",
    domain: "Automation", status: "Pilot", model: "claude-sonnet-4",
    sbu: "Distribution", function: "Procurement", owner: "Bob Reyes",
    launchDate: null,
    monthlyCallVolume: 4_200, avgLatencyMs: 880, errorRatePct: 0.18,
    estimatedValueUsd: 1_100_000, actualValueUsd: 0, monthlyCostUsd: 1_260, roiMultiple: 0.0,
    createdAt: "2025-02-20T00:00:00Z",
    confidenceScore: 64, reasonCodes: ["PILOT_EVALUATION", "HIGH_ERROR_RATE"], humanReviewRequired: true,
  },
  {
    id: "AI-012", name: "Code Review Co-pilot",
    description: "Automated PR review with security, performance, and standards checks",
    domain: "Code Generation", status: "Deployed", model: "claude-sonnet-4",
    sbu: "Retail", function: "IT", owner: "David Park",
    launchDate: "2025-01-20T00:00:00Z",
    monthlyCallVolume: 15_600, avgLatencyMs: 910, errorRatePct: 0.04,
    estimatedValueUsd: 900_000, actualValueUsd: 720_000, monthlyCostUsd: 4_680, roiMultiple: 12.8,
    createdAt: "2024-12-01T00:00:00Z",
    confidenceScore: 93, reasonCodes: [], humanReviewRequired: false,
  },
  {
    id: "AI-013", name: "Sales Proposal Writer",
    description: "Generates tailored proposals from CRM data, win/loss history, and templates",
    domain: "Document Processing", status: "Deployed", model: "claude-sonnet-4",
    sbu: "Retail", function: "Sales", owner: "David Park",
    launchDate: "2024-10-15T00:00:00Z",
    monthlyCallVolume: 6_200, avgLatencyMs: 1_100, errorRatePct: 0.08,
    estimatedValueUsd: 2_800_000, actualValueUsd: 3_100_000, monthlyCostUsd: 1_860, roiMultiple: 138.7,
    createdAt: "2024-07-28T00:00:00Z",
    confidenceScore: 90, reasonCodes: [], humanReviewRequired: false,
  },
  {
    id: "AI-014", name: "Route Optimisation Assistant",
    description: "NL query interface over logistics data for ad-hoc route analysis",
    domain: "Analytics", status: "Ideation", model: "claude-sonnet-4",
    sbu: "Distribution", function: "Logistics", owner: "Bob Reyes",
    launchDate: null,
    monthlyCallVolume: 0, avgLatencyMs: 0, errorRatePct: 0.00,
    estimatedValueUsd: 3_200_000, actualValueUsd: 0, monthlyCostUsd: 0, roiMultiple: 0.0,
    createdAt: "2025-03-15T00:00:00Z",
    confidenceScore: 0, reasonCodes: ["INSUFFICIENT_DATA", "PILOT_EVALUATION"], humanReviewRequired: true,
  },
  {
    id: "AI-015", name: "Workforce Scheduling AI",
    description: "Optimises shift scheduling using demand forecasts, skills, and preferences",
    domain: "Prediction", status: "Deprecated", model: "claude-haiku-4",
    sbu: "Manufacturing", function: "Operations", owner: "Emma Wilson",
    launchDate: "2024-03-01T00:00:00Z",
    monthlyCallVolume: 0, avgLatencyMs: 0, errorRatePct: 0.00,
    estimatedValueUsd: 750_000, actualValueUsd: 380_000, monthlyCostUsd: 0, roiMultiple: 0.0,
    createdAt: "2023-12-10T00:00:00Z",
    confidenceScore: 0, reasonCodes: ["DEPRECATED"], humanReviewRequired: false,
  },
];

// Named export expected by seed.ts
export const AI_USE_CASES = mockAiUseCases;

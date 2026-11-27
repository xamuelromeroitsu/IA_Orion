import { z } from 'zod';

export const currencySchema = z.enum(['USD', 'VES']);
export const defaultCurrency = 'USD';

export const moneySchema = z.object({
  amount: z.number().finite(),
  currency: currencySchema
});

export const documentKindSchema = z.enum(['pdf', 'image', 'spreadsheet', 'unknown']);

export const proposalItemSchema = z.object({
  description: z.string(),
  qty: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  declaredSubtotal: z.number().nullable().optional(),
  calculatedSubtotal: z.number().nonnegative(),
  sourceCell: z.string().nullable().optional()
});

export const findingSchema = z.object({
  id: z.string(),
  category: z.enum([
    'arithmetic',
    'hidden_cost',
    'injection',
    'scope',
    'compatibility',
    'market_price',
    'warranty',
    'general'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  detail: z.string(),
  evidence: z.string(),
  amountImpactUsd: z.number().default(0),
  sourceUrl: z.string().nullable().optional()
});

export const documentAnalysisSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  projectId: z.string(),
  supplier: z.string(),
  kind: documentKindSchema,
  currency: currencySchema,
  declaredTotal: z.number().nonnegative(),
  calculatedTotal: z.number().nonnegative(),
  realTotalUsd: z.number().nonnegative(),
  tcoUsd: z.number().nonnegative(),
  summary: z.string(),
  conclusion: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  finePrint: z.array(z.string()),
  items: z.array(proposalItemSchema),
  findings: z.array(findingSchema),
  confidence: z.number().min(0).max(1),
  source: z.enum(['gemini', 'deterministic']),
  analyzedAt: z.string()
});

export const documentRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  fileName: z.string(),
  mime: z.string(),
  kind: documentKindSchema,
  size: z.number().nonnegative(),
  storagePath: z.string(),
  uploadedAt: z.string(),
  extractedText: z.string(),
  sheets: z.array(z.object({
    name: z.string(),
    rows: z.array(z.record(z.string()))
  })).default([])
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().default(''),
  location: z.string().default('Caracas, Venezuela'),
  budgetReferenceUsd: z.number().nonnegative().default(0),
  status: z.enum(['recepcion', 'evaluacion', 'revision_comite', 'adjudicado', 'cerrado']).default('recepcion'),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const comparisonRowSchema = z.object({
  analysisId: z.string(),
  supplier: z.string(),
  fileName: z.string(),
  declaredTotal: z.number(),
  calculatedTotal: z.number(),
  hiddenCostsUsd: z.number(),
  tcoUsd: z.number(),
  deviationPct: z.number(),
  decision: z.enum(['recomendada', 'valida', 'descartada']),
  reason: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string())
});

export const evaluationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.enum(['running', 'completed', 'failed']),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  ranking: z.array(z.string()),
  comparison: z.array(comparisonRowSchema),
  summary: z.string(),
  recommendedId: z.string().nullable(),
  exchangeRate: z.number(),
  exchangeRateDate: z.string(),
  reviewedBy: z.string().nullable(),
  reviewNotes: z.string().nullable(),
  approvedBy: z.string().nullable()
});

export const chatMessageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string()
});

export const batchOutputSchema = z.object({
  reto: z.literal('propuesta_servicios'),
  repositorio: z.string(),
  commit: z.string().length(40),
  inicio: z.string(),
  fin: z.string(),
  procesados: z.array(z.object({ archivo: z.string(), hora: z.string() })),
  ranking: z.array(z.string())
});

export const allowedMime = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

export const maxUploadBytes = 15 * 1024 * 1024;

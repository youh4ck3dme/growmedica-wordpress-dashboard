import { z } from 'zod'

export const recommendSchema = z.object({
  summary: z.string(),
  recommendedHandles: z.array(z.string()),
  recommendedCategories: z.array(z.string()),
  reasoningForUser: z.string(),
  warnings: z.array(z.string()).default([]),
  bundleSuggestion: z
    .object({
      title: z.string(),
      handles: z.array(z.string()),
      cta: z.string(),
    })
    .nullable()
    .default(null),
})

export type RecommendOutput = z.infer<typeof recommendSchema>

export const productFitSchema = z.object({
  fit: z.enum(['good', 'maybe', 'not_recommended']),
  shortAnswer: z.string(),
  bestFor: z.array(z.string()),
  notIdealFor: z.array(z.string()),
  howToUse: z.string(),
  safeDisclaimer: z.string(),
})

export type ProductFitOutput = z.infer<typeof productFitSchema>

export const complianceCheckSchema = z.object({
  approved: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  blockedClaims: z.array(z.string()).default([]),
  rewrite: z.string(),
  notes: z.array(z.string()).default([]),
})

export type ComplianceCheckOutput = z.infer<typeof complianceCheckSchema>

export type AiProductSummary = {
  handle: string
  title: string
}

export type RecommendApiResponse = RecommendOutput & {
  recommendedProducts: AiProductSummary[]
  bundleProducts: AiProductSummary[]
}

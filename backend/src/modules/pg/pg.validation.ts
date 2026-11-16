import { z } from 'zod';

export const pgQuerySchema = z.object({
  category: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim()).filter(Boolean);
    }),

  city: z.string().trim().optional(),

  locality: z.string().trim().optional(),

  sort: z.enum(['default', 'price-asc', 'price-desc']).default('default'),

  facilities: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim().toLowerCase()).filter(Boolean);
    }),

  sharing: z.enum(['Single', 'Double', 'Triple', 'Any']).default('Any'),

  food: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val ? 'Included in rent' : undefined;
      return val.trim();
    }),

  minRent: z
    .preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().nonnegative().optional()),

  maxRent: z
    .preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().nonnegative().optional()),

  page: z
    .preprocess((val) => (val === '' || val === undefined ? 1 : Number(val)), z.number().int().min(1).default(1)),

  limit: z
    .preprocess(
      (val) => (val === '' || val === undefined ? 12 : Number(val)),
      z.number().int().min(1).max(50, 'Max limit is 50 listings per page').default(12)
    ),
});

export type PGQueryInput = z.infer<typeof pgQuerySchema>;

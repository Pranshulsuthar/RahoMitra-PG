import { z } from 'zod';

export const submitAdmissionCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Admission code is too short')
    .transform((val) => val.toUpperCase()),
  roomPreference: z.string().trim().optional(),
});

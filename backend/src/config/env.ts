import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z
      .string()
      .default('4000')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive()),
    FIREBASE_STORAGE_BUCKET: z
      .string()
      .min(1, 'FIREBASE_STORAGE_BUCKET is required (e.g. your-project-id.appspot.com)'),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.FIREBASE_SERVICE_ACCOUNT_JSON && !data.GOOGLE_APPLICATION_CREDENTIALS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Set FIREBASE_SERVICE_ACCOUNT_JSON (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (path to service account file)',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error('Environment variable validation failed:');
    console.error(JSON.stringify(formatted, null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

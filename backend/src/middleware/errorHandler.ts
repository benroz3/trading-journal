import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.name === 'MulterError') {
    const multerErr = err as Error & { code?: string };
    let message = err.message;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the 10MB limit';
    } else if (multerErr.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum is 5';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    res.status(400).json({ error: message });
    return;
  }

  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({ error: message });
}

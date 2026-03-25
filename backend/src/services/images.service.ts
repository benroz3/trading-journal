import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { query } from '../config/database';
import { TradeImage } from '../types';

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function upload(
  tradeId: string,
  files: Express.Multer.File[]
): Promise<TradeImage[]> {
  ensureUploadsDir();

  // Verify trade exists
  const tradeCheck = await query('SELECT id FROM trades WHERE id = $1', [tradeId]);
  if (tradeCheck.rows.length === 0) {
    const err = new Error('Trade not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  // Get current max sort_order
  const sortResult = await query<{ max_sort: number | null }>(
    'SELECT MAX(sort_order) as max_sort FROM trade_images WHERE trade_id = $1',
    [tradeId]
  );
  let sortOrder = (sortResult.rows[0].max_sort ?? -1) + 1;

  const results: TradeImage[] = [];

  for (const file of files) {
    const id = crypto.randomUUID();
    const filename = `${id}.webp`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Process image with Sharp
    const processed = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(filePath, processed);

    const result = await query<TradeImage>(
      `INSERT INTO trade_images (id, trade_id, filename, original_name, mime_type, file_size, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, tradeId, filename, file.originalname, 'image/webp', processed.length, sortOrder++]
    );

    results.push(result.rows[0]);
  }

  return results;
}

export async function remove(id: string): Promise<boolean> {
  const result = await query<TradeImage>(
    'SELECT * FROM trade_images WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return false;

  const image = result.rows[0];
  const filePath = path.join(UPLOADS_DIR, image.filename);

  // Delete from DB first
  await query('DELETE FROM trade_images WHERE id = $1', [id]);

  // Delete file from disk (non-blocking, ignore errors)
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[Images] Failed to delete file ${filePath}:`, err);
  }

  return true;
}

export async function getFilePath(
  id: string
): Promise<{ filePath: string; mimeType: string; filename: string } | null> {
  const result = await query<TradeImage>(
    'SELECT * FROM trade_images WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;

  const image = result.rows[0];
  const filePath = path.join(UPLOADS_DIR, image.filename);

  if (!fs.existsSync(filePath)) return null;

  return {
    filePath,
    mimeType: image.mime_type,
    filename: image.original_name,
  };
}

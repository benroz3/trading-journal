import crypto from 'crypto';
import sharp from 'sharp';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { TradeImage } from '../types';
import { tradeImageFromFirestore } from '../utils/firestoreNormalize';

const IMAGES = 'trade_images';

/** Firestore doc max ~1 MiB; leave room for other fields. */
const MAX_EMBEDDED_WEBP_BYTES = 720 * 1024;

function bufferFromFirestoreBytes(raw: unknown): Buffer | null {
  if (raw == null) return null;
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  return null;
}

export async function deleteAllForTrade(tradeId: string): Promise<void> {
  const snap = await db.collection(IMAGES).where('trade_id', '==', tradeId).get();
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
}

export async function upload(
  tradeId: string,
  files: Express.Multer.File[]
): Promise<TradeImage[]> {
  const tradeDoc = await db.collection('trades').doc(tradeId).get();
  if (!tradeDoc.exists) {
    const err = new Error('Trade not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const existing = await db.collection(IMAGES).where('trade_id', '==', tradeId).get();
  let sortOrder =
    existing.docs.reduce((max, d) => Math.max(max, (d.data().sort_order as number) ?? 0), -1) + 1;

  const results: TradeImage[] = [];

  for (const file of files) {
    const processed = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    if (processed.length > MAX_EMBEDDED_WEBP_BYTES) {
      const err = new Error(
        `Image is still too large after compression (${Math.round(processed.length / 1024)} KB). Max ~${Math.round(MAX_EMBEDDED_WEBP_BYTES / 1024)} KB per image for free-tier Firestore. Try a smaller screenshot.`
      ) as Error & { statusCode: number };
      err.statusCode = 413;
      throw err;
    }

    const id = crypto.randomUUID();
    const filename = `${id}.webp`;

    const doc = {
      trade_id: tradeId,
      filename,
      original_name: file.originalname,
      mime_type: 'image/webp',
      file_size: processed.length,
      sort_order: sortOrder++,
      webp_bytes: processed,
      created_at: FieldValue.serverTimestamp(),
    };

    await db.collection(IMAGES).doc(id).set(doc);
    const saved = await db.collection(IMAGES).doc(id).get();
    results.push(tradeImageFromFirestore(saved.id, saved.data()!));
  }

  return results;
}

export async function remove(id: string): Promise<boolean> {
  const ref = db.collection(IMAGES).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}

export async function getImageForServe(
  id: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const doc = await db.collection(IMAGES).doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  const buf = bufferFromFirestoreBytes(data.webp_bytes);
  if (!buf) return null;

  const mimeType =
    typeof data.mime_type === 'string' && data.mime_type.startsWith('image/')
      ? data.mime_type
      : 'image/webp';

  return { buffer: buf, mimeType };
}

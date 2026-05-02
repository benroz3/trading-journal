import crypto from 'crypto';
import sharp from 'sharp';
import { FieldValue } from 'firebase-admin/firestore';
import { bucket, db } from '../config/firebase';
import { TradeImage } from '../types';
import { tradeImageFromFirestore } from '../utils/firestoreNormalize';

const IMAGES = 'trade_images';

export async function deleteAllForTrade(tradeId: string): Promise<void> {
  const snap = await db.collection(IMAGES).where('trade_id', '==', tradeId).get();
  await Promise.all(
    snap.docs.map(async (doc) => {
      const path = doc.data().storage_path as string | undefined;
      if (path) {
        try {
          await bucket.file(path).delete();
        } catch {
          /* ignore missing file */
        }
      }
      await doc.ref.delete();
    })
  );
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
    const id = crypto.randomUUID();
    const filename = `${id}.webp`;
    const storagePath = `trade-images/${tradeId}/${filename}`;

    const processed = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    await bucket.file(storagePath).save(processed, {
      contentType: 'image/webp',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    const doc = {
      trade_id: tradeId,
      filename,
      original_name: file.originalname,
      mime_type: 'image/webp',
      file_size: processed.length,
      sort_order: sortOrder++,
      storage_path: storagePath,
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

  const storagePath = doc.data()!.storage_path as string | undefined;
  if (storagePath) {
    try {
      await bucket.file(storagePath).delete();
    } catch {
      console.warn(`[Images] Failed to delete storage object ${storagePath}`);
    }
  }

  await ref.delete();
  return true;
}

async function getStoragePath(id: string): Promise<string | null> {
  const doc = await db.collection(IMAGES).doc(id).get();
  if (!doc.exists) return null;
  return (doc.data()!.storage_path as string) ?? null;
}

export async function getSignedReadUrl(id: string): Promise<string | null> {
  const path = await getStoragePath(id);
  if (!path) return null;
  const [url] = await bucket.file(path).getSignedUrl({
    action: 'read',
    expires: Date.now() + 3600 * 1000,
  });
  return url;
}

import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { db } from '../config/firebase';
import { Strategy } from '../types';
import { CreateStrategyInput, UpdateStrategyInput } from '../schemas/strategy.schema';
import { strategyFromFirestore, StrategyNameConflictError } from '../utils/firestoreNormalize';

const COL = 'strategies';

async function nameTaken(name: string, excludeId?: string): Promise<boolean> {
  const q = await db.collection(COL).where('name', '==', name).limit(5).get();
  if (q.empty) return false;
  if (excludeId) {
    return q.docs.some((d) => d.id !== excludeId);
  }
  return true;
}

export async function getAll(): Promise<Strategy[]> {
  const snap = await db.collection(COL).get();
  const rows = snap.docs.map((d) => strategyFromFirestore(d.id, d.data()));
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

export async function getById(id: string): Promise<Strategy | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return strategyFromFirestore(doc.id, doc.data()!);
}

export async function create(data: CreateStrategyInput): Promise<Strategy> {
  if (await nameTaken(data.name)) {
    throw new StrategyNameConflictError();
  }
  const id = crypto.randomUUID();
  const now = FieldValue.serverTimestamp();
  const doc = {
    name: data.name,
    description: data.description ?? null,
    color: data.color ?? '#3B82F6',
    created_at: now,
    updated_at: now,
  };
  await db.collection(COL).doc(id).set(doc);
  const created = await db.collection(COL).doc(id).get();
  return strategyFromFirestore(created.id, created.data()!);
}

export async function update(
  id: string,
  data: UpdateStrategyInput
): Promise<Strategy | null> {
  const ref = db.collection(COL).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  if (data.name !== undefined && (await nameTaken(data.name, id))) {
    throw new StrategyNameConflictError();
  }

  const patch: Record<string, unknown> = { updated_at: FieldValue.serverTimestamp() };
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.color !== undefined) patch.color = data.color;

  await ref.update(patch);
  const next = await ref.get();
  return strategyFromFirestore(next.id, next.data()!);
}

export async function remove(id: string): Promise<boolean> {
  const ref = db.collection(COL).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;

  const tradesSnap = await db.collection('trades').where('strategy_id', '==', id).get();
  const docs = tradesSnap.docs;
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + chunkSize)) {
      batch.update(d.ref, { strategy_id: null, updated_at: FieldValue.serverTimestamp() });
    }
    await batch.commit();
  }

  await ref.delete();
  return true;
}

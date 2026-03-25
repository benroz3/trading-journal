import { query } from '../config/database';
import { Strategy } from '../types';
import { CreateStrategyInput, UpdateStrategyInput } from '../schemas/strategy.schema';

export async function getAll(): Promise<Strategy[]> {
  const result = await query<Strategy>(
    'SELECT * FROM strategies ORDER BY name ASC'
  );
  return result.rows;
}

export async function getById(id: string): Promise<Strategy | null> {
  const result = await query<Strategy>(
    'SELECT * FROM strategies WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function create(data: CreateStrategyInput): Promise<Strategy> {
  const result = await query<Strategy>(
    `INSERT INTO strategies (name, description, color)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.name, data.description ?? null, data.color]
  );
  return result.rows[0];
}

export async function update(
  id: string,
  data: UpdateStrategyInput
): Promise<Strategy | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(data.color);
  }

  if (fields.length === 0) return getById(id);

  values.push(id);
  const result = await query<Strategy>(
    `UPDATE strategies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM strategies WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

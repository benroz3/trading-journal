import { Request, Response, NextFunction } from 'express';
import * as strategiesService from '../services/strategies.service';

export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const strategies = await strategiesService.getAll();
    res.json(strategies);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const strategy = await strategiesService.getById(req.params.id);
    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json(strategy);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const strategy = await strategiesService.create(req.body);
    res.status(201).json(strategy);
  } catch (err: unknown) {
    if (err instanceof Error && (err as Error & { code?: string }).code === '23505') {
      res.status(409).json({ error: 'A strategy with that name already exists' });
      return;
    }
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const strategy = await strategiesService.update(req.params.id, req.body);
    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json(strategy);
  } catch (err: unknown) {
    if (err instanceof Error && (err as Error & { code?: string }).code === '23505') {
      res.status(409).json({ error: 'A strategy with that name already exists' });
      return;
    }
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await strategiesService.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

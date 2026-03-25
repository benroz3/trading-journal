import { Request, Response, NextFunction } from 'express';
import * as tradesService from '../services/trades.service';
import { TradeFilters, TradeOutcome } from '../types';

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters: TradeFilters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      sort: (req.query.sort as string) || 'trade_date',
      order: (req.query.order as 'ASC' | 'DESC') || 'DESC',
      symbol: req.query.symbol as string | undefined,
      outcome: req.query.outcome as TradeOutcome | undefined,
      strategy_id: req.query.strategy_id as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };

    const result = await tradesService.getAll(filters);
    res.json(result);
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
    const trade = await tradesService.getById(req.params.id);
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json(trade);
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
    const trade = await tradesService.create(req.body);
    res.status(201).json(trade);
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const trade = await tradesService.update(req.params.id, req.body);
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json(trade);
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await tradesService.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import * as statsService from '../services/stats.service';
import { StatFilters } from '../types';

function parseFilters(query: Request['query']): StatFilters {
  return {
    from: query.from as string | undefined,
    to: query.to as string | undefined,
    strategy_id: query.strategy_id as string | undefined,
    symbol: query.symbol as string | undefined,
  };
}

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getSummary(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getByStrategy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getByStrategy(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBySymbol(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getBySymbol(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBySession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getBySession(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getByDayOfWeek(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getByDayOfWeek(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEquityCurve(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getEquityCurve(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCalendar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getCalendar(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStreaks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await statsService.getStreaks(parseFilters(req.query));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

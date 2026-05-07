import { Request, Response, NextFunction } from 'express';
import * as imagesService from '../services/images.service';

export async function upload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No image files provided' });
      return;
    }

    const images = await imagesService.upload(req.params.tradeId, files);
    res.status(201).json(images);
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
    const deleted = await imagesService.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function serve(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = await imagesService.getImageForServe(req.params.id);
    if (!payload) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    res.setHeader('Content-Type', payload.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(payload.buffer);
  } catch (err) {
    next(err);
  }
}
